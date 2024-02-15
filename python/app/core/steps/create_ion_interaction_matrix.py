import numpy as np
import pandas as pd
from app.utils.constants import ReactionColumn, TargetIonsColumn
from app.utils.logger import log
from numba import jit
from scipy.sparse import coo_matrix


@jit(nopython=True)
def _calculate_adj_matrix(ion_mass_values, theoretical_mz_diffs, mz_error_threshold):
    ion_count = len(ion_mass_values)
    adj_matrix = np.zeros((ion_count, ion_count), dtype=np.float32)

    for i in range(ion_count):
        for j in range(i, ion_count):  # Optimize by considering only unique pairs
            mz_difference = np.abs(ion_mass_values[i] - ion_mass_values[j])
            # Find the nearest mass difference from sorted_mass_diffs
            idx = np.searchsorted(theoretical_mz_diffs, mz_difference, side="left")
            if idx == len(theoretical_mz_diffs):
                nearest_diff = theoretical_mz_diffs[-1]
            elif idx == 0:
                nearest_diff = theoretical_mz_diffs[0]
            else:
                left = theoretical_mz_diffs[idx - 1]
                right = theoretical_mz_diffs[idx]
                nearest_diff = (
                    right
                    if np.abs(right - mz_difference) < np.abs(mz_difference - left)
                    else left
                )

            # Apply threshold and populate symmetric matrix
            if abs(mz_difference - nearest_diff) < mz_error_threshold:
                adj_matrix[i, j] = adj_matrix[j, i] = 1

    return adj_matrix


@log("Creating ion interaction matrix")
async def create_ion_interaction_matrix(
    targeted_ions_df: pd.DataFrame,
    reaction_df: pd.DataFrame,
    mz_error_threshold: float = 0.01,
) -> coo_matrix:
    ion_mass_values = targeted_ions_df[TargetIonsColumn.MZ].values
    theoretical_mz_diffs = np.sort(reaction_df[ReactionColumn.MZ_DIFF].values)

    # Calculate the ppm difference matrix using the optimized Numba function
    adj_matrix = _calculate_adj_matrix(
        ion_mass_values, theoretical_mz_diffs, mz_error_threshold
    )

    # Construct the interaction matrix
    return coo_matrix(adj_matrix, dtype=np.int8)
