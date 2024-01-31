import logging

import pandas as pd
import pyteomics.mass
from app.models.analysis import Analysis, AnalysisStatus, AnalysisTriggerInput
from app.steps import (calculate_edge_metrics,
                       combine_matrices_and_extract_edges,
                       create_ion_interaction_matrix, create_similarity_matrix,
                       edge_value_matching, load_data)
from app.utils.convex import get_convex
from fastapi import APIRouter, Depends, HTTPException
from scipy.sparse import coo_matrix

from convex import ConvexClient

router = APIRouter()

# define the log format
logger = logging.getLogger(__name__)


async def analysis_workflow(convex: ConvexClient, analysis: Analysis):
    config = analysis.config

    # f1, f2, f3
    (
        spectra,
        targeted_ions_df,
        reaction_df,
    ) = load_data(analysis=analysis)

    # f6
    # this is to extract the interaction between ions that has m/z and mass difference within MASS_DIFF_THRESHOLD
    # given the metabolic reaction database (metabolic_reaction_df)
    convex.mutation(
        "analyses:update",
        {"id": input.id, "log": "Calculating ion interaction matrix"},
    )
    ion_interaction_matrix = create_ion_interaction_matrix(
        targeted_ions_df, reaction_df, mzErrorThreshold=config.mzErrorThreshold
    )
    # f7
    # this is to calculate the similarity between each pair of spectra
    convex.mutation(
        "analyses:update",
        {"id": input.id, "log": "Calculating similarity matrix"},
    )
    similarity_matrix: coo_matrix = create_similarity_matrix(spectra, targeted_ions_df)
    # f9

    convex.update(
        "analyses",
        {"id": input.id, "log": "Combining matrices and extracting edges"},
    )
    edge_data_df = combine_matrices_and_extract_edges(
        ion_interaction_matrix,
        similarity_matrix,
        ms2SimilarityThreshold=config.ms2SimilarityThreshold,
    )
    # f10
    convex.mutation(
        "analyses:update",
        {"id": input.id, "log": "Calculating edge metrics"},
    )
    edge_metrics = calculate_edge_metrics(targeted_ions_df, edge_data_df)
    # f11, f12
    matched_df, formula_change_counts = edge_value_matching(
        edge_metrics,
        reaction_df,
        rtTimeWindow=config.rtTimeWindow,
        mzErrorThreshold=config.mzErrorThreshold,
    )

    convex.mutation(
        "analyses:update",
        {"id": input.id, "result": {"edges": []}, "status": AnalysisStatus.COMPLETED},
    )


@router.post("/start")
async def metabolite_analysis(input: AnalysisTriggerInput, convex=Depends(get_convex)):
    analysis: Analysis = convex.query("analyses:get", {"id": input.id})

    try:
        analysis_workflow(analysis=analysis)
        return {"status": "success"}
    except Exception as e:
        logger.log(logging.ERROR, e)
        convex.mutation(
            "analyses:update", {"id": input.id, "status": AnalysisStatus.FAILED}
        )
        return {"status": "error"}


@router.get("/mass")
async def mass(formula: str):
    """
    Calculate the mass of a given chemical formula.
    """
    try:
        mass = pyteomics.mass.calculate_mass(formula=formula)
        return {"formula": formula, "mass": mass}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
