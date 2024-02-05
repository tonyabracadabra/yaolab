import logging

import pyteomics.mass
from app.core.analysis import AnalysisWorker
from app.core.preprocess import preprocess_targeted_ions_file
from app.models.analysis import Analysis, AnalysisStatus, AnalysisTriggerInput, MSTool
from app.utils.constants import DEFAULT_REACTION_DF
from app.utils.convex import download_file, get_convex, upload_parquet
from app.utils.logger import logger
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from convex import ConvexClient

router = APIRouter()


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
    targetedIons: str
    tool: MSTool


@router.post("/preprocessIons")
async def proprocess_ions(
    input: PreprocessIonsInput,
    convex: ConvexClient = Depends(get_convex),
) -> dict[str, str]:
    try:
        ions_blob: bytes = download_file(input.targetedIons)
        df, sample_cols = preprocess_targeted_ions_file(
            ions_blob=ions_blob, tool=input.tool
        )
        storage_id = upload_parquet(df, convex)

        return {"storageId": storage_id, "sampleCols": sample_cols}
    except Exception as e:
        logger.log(logging.ERROR, e)
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        convex.action("actions:removeFile", {"storageId": input.targetedIons})
