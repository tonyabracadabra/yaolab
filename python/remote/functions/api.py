import logging

import fastapi
import modal
import pandas as pd
import pyteomics.mass
from fastapi import Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from remote.image import image

from core.models.analysis import AnalysisTriggerInput, MassInput, PreprocessIonsInput
from core.preprocess import preprocess_targeted_ions_file
from core.utils.convex import ConvexClient, get_convex, load_binary
from core.utils.logger import logger

app = modal.App("analysis-api")
web = fastapi.FastAPI()
security = HTTPBearer()


class AnalysisResponse(BaseModel):
    call_id: str


class PreprocessIonsResponse(BaseModel):
    storageId: str
    sampleCols: list[str]


@app.function(secrets=[modal.Secret.from_name("yaolab")], image=image)
@modal.asgi_app()
def api():
    return web


@web.post("/analysis/start")
async def start_analysis(
    input: AnalysisTriggerInput, token: HTTPAuthorizationCredentials = Depends(security)
) -> AnalysisResponse:
    process_analysis = modal.Function.lookup("analysis-worker", "run_analysis_workflow")
    call = process_analysis.spawn(input, convex_token=token.credentials)
    return AnalysisResponse(call_id=call.object_id)


@web.post("/analysis/mass")
async def mass(input: MassInput) -> dict[str, list[float]]:
    """
    Calculate the mass of a given chemical formula.

    Args:
        input: MassInput object containing a list of formula changes

    Returns:
        Dictionary containing a list of calculated masses

    Raises:
        HTTPException: If there's an error in calculation or invalid input
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


def _upload_parquet(df: pd.DataFrame, file_name: str, convex: ConvexClient) -> str:
    """Helper function to upload parquet file to storage"""
    parquet_buffer = df.to_parquet()
    response = convex.action(
        "actions:uploadFile",
        {"file": parquet_buffer, "fileName": f"{file_name}.parquet"},
    )
    # Extract storageId from the response
    return response["storageId"]


@web.post("/analysis/preprocessIons")
async def preprocess_ions(
    input: PreprocessIonsInput, token: HTTPAuthorizationCredentials = Depends(security)
) -> JSONResponse:
    """
    Preprocess targeted ions file.

    Args:
        input: PreprocessIonsInput containing targeted ions data and tool type
        convex: ConvexClient instance for file operations

    Returns:
        JSONResponse containing storage ID and sample columns

    Raises:
        HTTPException: If preprocessing fails
    """
    convex = get_convex(token.credentials)
    try:
        blob: bytes = await load_binary(input.targetedIons, convex=convex)
        df, sample_cols = preprocess_targeted_ions_file(blob=blob, tool=input.tool)
        storage_id = _upload_parquet(df, file_name="target-ions", convex=convex)

        return PreprocessIonsResponse(
            storageId=storage_id,
            sampleCols=sample_cols,
        )
    except Exception as e:
        logger.log(logging.ERROR, e)
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        convex.action("actions:removeFile", {"storageId": input.targetedIons})
