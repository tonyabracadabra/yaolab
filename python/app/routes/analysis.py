import logging

import app.steps as steps
import pyteomics.mass
from app.models.analysis import Analysis, AnalysisStatus, AnalysisTriggerInput
from app.utils.convex import get_convex
from app.utils.logger import with_logging_and_context
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from scipy.sparse import coo_matrix

from convex import ConvexClient

router = APIRouter()

# define the log format
logger = logging.getLogger(__name__)


class AnalysisWorker(BaseModel):
    id: str
    analysis: Analysis
    convex: ConvexClient

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        log_and_context = with_logging_and_context(self.convex, self.id)
        # Apply decorator to all functions in steps module
        for name in steps.__all__:
            func = getattr(steps, name, None)
            if callable(func):
                decorated_func = log_and_context(func)
                setattr(steps, name, decorated_func)

    class Config:
        arbitrary_types_allowed = True

    async def run(self) -> None:
        from app.steps import (calculate_edge_metrics,
                               combine_matrices_and_extract_edges,
                               create_ion_interaction_matrix,
                               create_similarity_matrix, edge_value_matching,
                               load_data)

        config = self.analysis.config
        spectra, targeted_ions_df, reaction_df = load_data(self.analysis)

        ion_interaction_matrix = create_ion_interaction_matrix(
            targeted_ions_df,
            reaction_df,
            mzErrorThreshold=self.analysis.config.mzErrorThreshold,
        )

        similarity_matrix: coo_matrix = create_similarity_matrix(
            spectra, targeted_ions_df
        )

        edge_data_df = combine_matrices_and_extract_edges(
            ion_interaction_matrix,
            similarity_matrix,
            ms2SimilarityThreshold=self.analysis.config.ms2SimilarityThreshold,
        )

        edge_metrics = calculate_edge_metrics(targeted_ions_df, edge_data_df)

        matched_df, formula_change_counts = edge_value_matching(
            edge_metrics,
            reaction_df,
            rtTimeWindow=config.rtTimeWindow,
            mzErrorThreshold=self.analysis.config.mzErrorThreshold,
        )

        await self._complete(self.id)

    def _update(self, log_message: str) -> None:
        self.convex.mutation("analyses:update", {"id": self.id, "log": log_message})

    def _complete(self) -> None:
        self.convex.mutation(
            "analyses:update",
            {
                "id": self.id,
                "result": {"edges": []},
                "status": AnalysisStatus.COMPLETED,
            },
        )


@router.post("/start")
async def metabolite_analysis(
    input: AnalysisTriggerInput,
    background_tasks: BackgroundTasks,
    convex: ConvexClient = Depends(get_convex),
):
    raw = convex.query("analyses:get", {"id": input.id})
    print(f"raw: {raw}")
    analysis: Analysis = Analysis.parse_obj(raw)
    print(f"analysis: {analysis}")
    try:
        worker = AnalysisWorker(id=input.id, convex=convex, analysis=analysis)
        # Add run method to background tasks
        background_tasks.add_task(worker.run)
        return {"status": "processing"}
    except Exception as e:
        logger.log(logging.ERROR, e)
        convex.mutation(
            "analyses:update",
            {"id": input.id, "status": AnalysisStatus.FAILED, "log": str(e)},
        )
        return {"status": "error"}


@router.get("/mass")
async def mass(formula: str) -> dict[str, float]:
    """
    Calculate the mass of a given chemical formula.
    """
    try:
        mass = pyteomics.mass.calculate_mass(formula=formula)
        return {"formula": formula, "mass": mass}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
