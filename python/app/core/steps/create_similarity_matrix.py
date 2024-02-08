from typing import List

import numpy as np
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
    spectra: list[Spectrum], ids: np.ndarray
) -> coo_matrix:
    id_to_index = {id_: index for index, id_ in enumerate(ids)}
    # Filter spectra and map to indices based on IDs
    filtered_spectra, filtered_indices = [], []
    for spectrum in spectra:
        spectrum_id = int(spectrum.metadata[SCANS_KEY])
        if spectrum_id in id_to_index:
            filtered_spectra.append(spectrum)
            filtered_indices.append(id_to_index[spectrum_id])

    similarity_measure = ModifiedCosine(tolerance=TOLERANCE)
    cosine_scores: Scores = calculate_scores(
        filtered_spectra,
        filtered_spectra,
        similarity_measure,
        is_symmetric=True,
    )

    filtered_indices_array = np.array(filtered_indices)
    rows = filtered_indices_array[cosine_scores.scores.row]
    cols = filtered_indices_array[cosine_scores.scores.col]

    similarity_matrix = coo_matrix(
        (cosine_scores.scores.data[SCORE_KEY], (rows, cols)), shape=(len(ids), len(ids))
    )

    return similarity_matrix
