import logging

import pyteomics.mass
from app.models.analysis import Analysis, AnalysisStatus, AnalysisTriggerInput
from app.steps import (calculate_edge_metrics,
                       combine_matrices_and_extract_edges,
                       create_ion_interaction_matrix, create_similarity_matrix,
                       edge_value_matching, load_data)
from app.utils.convex import get_convex
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

    class Config:
        arbitrary_types_allowed = True

    async def run(self) -> None:
        config = self.analysis.config
        spectra, targeted_ions_df, reaction_df = load_data(self.analysis)

        await self._update("Calculating ion interaction matrix")
        ion_interaction_matrix = create_ion_interaction_matrix(
            targeted_ions_df,
            reaction_df,
            mzErrorThreshold=self.analysis.config.mzErrorThreshold,
        )

        await self._update("Calculating similarity matrix")
        similarity_matrix: coo_matrix = create_similarity_matrix(
            spectra, targeted_ions_df
        )

        await self._update("Combining matrices and extracting edges")
        edge_data_df = combine_matrices_and_extract_edges(
            ion_interaction_matrix,
            similarity_matrix,
            ms2SimilarityThreshold=self.analysis.config.ms2SimilarityThreshold,
        )

        await self._update("Calculating edge metrics")
        edge_metrics = calculate_edge_metrics(targeted_ions_df, edge_data_df)

        await self._update("Matching edges")
        matched_df, formula_change_counts = edge_value_matching(
            edge_metrics,
            reaction_df,
            rtTimeWindow=config.rtTimeWindow,
            mzErrorThreshold=self.analysis.config.mzErrorThreshold,
        )

        await self._complete(self.id)

    async def _update(self, log_message: str) -> None:
        await self.convex.mutation(
            "analyses:update", {"id": self.id, "log": log_message}
        )

    async def _complete(self) -> None:
        await self.convex.mutation(
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
            "analyses:update", {"id": input.id, "status": AnalysisStatus.FAILED}
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
