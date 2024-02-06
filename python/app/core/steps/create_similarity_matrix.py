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
    spectra: List[Spectrum], targeted_ions_df: pd.DataFrame
) -> coo_matrix:
    ion_count = len(targeted_ions_df)
    ids = targeted_ions_df[ID_COL].to_numpy()
    id_to_index = {id_: index for index, id_ in enumerate(ids)}

    # Initialize a matrix of zeros with the shape (ion_count, ion_count)
    similarity_matrix_data = np.zeros((ion_count, ion_count))

    # Filter spectra and map to indices based on IDs
    filtered_spectra = []
    for spectrum in spectra:
        spectrum_id = int(spectrum.metadata[SCANS_KEY])
        if spectrum_id in id_to_index:
            filtered_spectra.append(spectrum)

    # Calculate the cosine scores only for filtered spectra
    if filtered_spectra:
        similarity_measure = ModifiedCosine(tolerance=TOLERANCE)
        cosine_scores: Scores = calculate_scores(
            filtered_spectra,
            filtered_spectra,
            similarity_measure,
            is_symmetric=True,
        )

        # Populate the similarity_matrix_data with actual scores from cosine_scores
        for reference, query, score in cosine_scores:
            ref_id = int(
                reference.metadata[SCANS_KEY]
            )  # Assuming the reference ID is stored under 'id' in metadata
            query_id = int(
                query.metadata[SCANS_KEY]
            )  # Same assumption for the query ID

            if ref_id in id_to_index and query_id in id_to_index:
                row_index = id_to_index[ref_id]
                col_index = id_to_index[query_id]
                similarity_matrix_data[row_index, col_index] = score[0]

    # Convert the populated data to a COO sparse matrix
    row_indices, col_indices = np.nonzero(similarity_matrix_data)
    data_values = similarity_matrix_data[row_indices, col_indices]
    similarity_matrix = coo_matrix(
        (data_values, (row_indices, col_indices)), shape=(ion_count, ion_count)
    )

    return similarity_matrix
