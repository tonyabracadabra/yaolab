import logging

import app.steps as steps
import pandas as pd
import pyteomics.mass
from app.core.preprocess import preprocess_targeted_ions_file
from app.models.analysis import Analysis, AnalysisStatus, AnalysisTriggerInput, MSTool
from app.utils.constants import DEFAULT_REACTION_DF
from app.utils.convex import download_file, get_convex, upload_file
from app.utils.logger import logger, with_logging_and_context
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from scipy.sparse import coo_matrix

from convex import ConvexClient

router = APIRouter()


class AnalysisWorker(BaseModel):
    id: str
    convex: ConvexClient
    analysis: Analysis

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        log_and_context = with_logging_and_context(self.convex, self.id)
        # Apply decorator to all functions in steps module
        for name in steps.__all__:
            func = getattr(steps, name, None)
            if callable(func):
                decorated_func = log_and_context(func)
                setattr(steps, name, decorated_func)
                logger.info(f"Decorated {name} with log_and_context, {decorated_func}")

    class Config:
        arbitrary_types_allowed = True

    async def run(self) -> None:
        from app.steps import (
            calculate_edge_metrics,
            combine_matrices_and_extract_edges,
            create_ion_interaction_matrix,
            create_similarity_matrix,
            edge_value_matching,
            load_data,
        )

        config = self.analysis.config
        spectra, targeted_ions_df, reaction_df = await load_data(self.analysis)

        ion_interaction_matrix: coo_matrix = await create_ion_interaction_matrix(
            targeted_ions_df,
            reaction_df,
            mz_error_threshold=self.analysis.config.mzErrorThreshold,
        )

        similarity_matrix: coo_matrix = await create_similarity_matrix(
            spectra, targeted_ions_df
        )

        edge_data_df: pd.DataFrame = await combine_matrices_and_extract_edges(
            ion_interaction_matrix,
            similarity_matrix,
            ms2_similarity_threshold=config.ms2SimilarityThreshold,
        )

        edge_metrics = await calculate_edge_metrics(targeted_ions_df, edge_data_df)

        matched_df = await edge_value_matching(
            edge_metrics,
            reaction_df,
            rt_time_window=config.rtTimeWindow,
            mz_error_threshold=config.mzErrorThreshold,
            correlation_threshold=config.correlationThreshold,
        )

        # Upload matched_df to convex as a file, and update analysis result
        storageId = upload_file(matched_df, self.convex)
        self.convex.mutation(
            "analyses:update",
            {
                "id": self.id,
                "result": storageId,
                "status": AnalysisStatus.COMPLETE,
            },
        )


@router.post("/start")
async def metabolite_analysis(
    input: AnalysisTriggerInput,
    background_tasks: BackgroundTasks,
    convex: ConvexClient = Depends(get_convex),
):
    analysis: Analysis = Analysis.parse_obj(
        convex.query("analyses:get", {"id": input.id})
    )
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


class MassInput(BaseModel):
    formulaChanges: list[str]


@router.post("/mass")
async def mass(input: MassInput) -> dict[str, list[float]]:
    """
    Calculate the mass of a given chemical formula.
    """
    try:
        masses = []
        for formula_change in input.formulaChanges:
            if formula_change[0] == "(" and formula_change[-1] == ")":
                formula_change = formula_change[1:-1]
            try:
                mass = sum(
                    [
                        -pyteomics.mass.calculate_mass(formula=formula[1:])
                        if formula[0] == "-"
                        else pyteomics.mass.calculate_mass(formula=formula)
                        for formula in formula_change.split("+")
                    ]
                )
            except Exception:
                mass = 0
            masses.append(mass)
        return {"masses": masses}
    except Exception as e:
        logger.log(logging.ERROR, e)
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/defaultReactions")
async def download_default_reactions() -> dict[str, str]:
    return {"csv": DEFAULT_REACTION_DF.to_csv(index=False)}


class PreprocessIonsInput(BaseModel):
    ionsFile: str
    tool: MSTool


@router.post("/preprocessIons")
async def preprocessIons(
    input: PreprocessIonsInput,
    convex: ConvexClient = Depends(get_convex),
) -> dict[str, str]:
    ions_blob: bytes = download_file(input.ionsFile)
    df, sample_cols = preprocess_targeted_ions_file(
        ions_blob=ions_blob, tool=input.tool
    )
    # remove the original file
    convex.action("actions:removeFile", {"storageId": input.ionsFile})
    # upload the preprocessed file
    storage_id = upload_file(df, convex)

    return {
        "storageId": storage_id,
        "sampleCols": sample_cols,
    }
