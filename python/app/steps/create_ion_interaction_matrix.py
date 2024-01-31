import numpy as np
import pandas as pd
from app.utils.logger import log
from scipy.sparse import coo_matrix

from ..utils.contants import MASS_DIFF_COL, MZ_COL


@log("Creating ion interaction matrix")
def create_ion_interaction_matrix(
    targeted_ions_df: pd.DataFrame,
    reaction_df: pd.DataFrame,
    mz_error_threshold: float = 0.01,
) -> coo_matrix:
    ion_mass_values = targeted_ions_df[MZ_COL].values
    ion_count = len(ion_mass_values)

    # Generate row and column indices for the interaction matrix
    row_indices, col_indices = np.ogrid[:ion_count, :ion_count]

    # Calculate mz differences for the interaction matrix
    mz_differences = np.abs(ion_mass_values[row_indices] - ion_mass_values[col_indices])

    # Prepare sorted mass differences for reaction potential check
    sorted_mass_diffs = np.sort(reaction_df[MASS_DIFF_COL].values)

    # Broadcasting sorted_mass_diffs to match the shape of mz_differences
    # sorted_mass_diffs is reshaped to (1, m) and then broadcasted to (n, m)
    sorted_mass_diffs_broadcasted = sorted_mass_diffs.reshape(1, -1)

    # Calculate the indices of the nearest differences
    # Broadcasting here aligns mz_differences (n, n) with sorted_mass_diffs (1, m)
    nearest_diff_indices = np.abs(
        mz_differences[:, :, np.newaxis] - sorted_mass_diffs_broadcasted
    ).argmin(axis=2)

    # Fetch the nearest differences based on the calculated indices
    nearest_diffs = np.take_along_axis(
        sorted_mass_diffs_broadcasted, nearest_diff_indices, axis=1
    )

    # Calculate the ppm difference
    ppm_diff = np.abs(mz_differences - nearest_diffs) / nearest_diffs * 1e6

    # Construct the interaction matrix with the same shape as mz_differences
    ion_interaction_matrix = coo_matrix((ppm_diff < mz_error_threshold).astype(int))

    return ion_interaction_matrix
