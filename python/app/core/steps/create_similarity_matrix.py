from typing import List

import pandas as pd
from app.utils.constants import ID_COL
from app.utils.logger import log
from matchms import Scores, calculate_scores
from matchms.similarity import ModifiedCosine
from matchms.Spectrum import Spectrum
from scipy.sparse import coo_matrix

# Constants
SCANS_KEY = "scans"
SCORE_KEY = "ModifiedCosine_score"
TOLERANCE = 0.005


@log("Creating similarity matrix")
async def create_similarity_matrix(
    spectra: List[Spectrum], target_ions_df: pd.DataFrame
) -> coo_matrix:
    # printout some debug information
    print("spectra:", spectra)
    print("target_ions_df:", target_ions_df.head())

    # Filter spectra based on scan IDs
    ids = set(target_ions_df[ID_COL])
    filtered_spectra = [
        spectrum for spectrum in spectra if int(spectrum.metadata[SCANS_KEY]) in ids
    ]

    # Calculate the cosine scores
    similarity_measure = ModifiedCosine(tolerance=TOLERANCE)
    cosine_scores: Scores = calculate_scores(
        filtered_spectra,
        filtered_spectra,
        similarity_measure,
        is_symmetric=True,
    )

    # Convert to COO matrix, providing the required 'name' argument
    similarity_matrix = cosine_scores.scores.to_coo(name=SCORE_KEY)

    return similarity_matrix
