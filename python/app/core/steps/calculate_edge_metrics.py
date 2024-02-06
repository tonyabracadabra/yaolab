import numpy as np
import pandas as pd
from app.utils.constants import (
    CORRELATION_COL,
    ID_COL,
    ID_COL_1,
    ID_COL_2,
    MZ_COL,
    MZ_DIFF_COL,
    RT_COL,
    RT_DIFF_COL,
)
from app.utils.logger import log
from numba import jit


@jit(nopython=True)
def _calculate_correlation(id1_data, id2_data):
    return np.dot(id1_data, id2_data) / (
        np.linalg.norm(id1_data) * np.linalg.norm(id2_data)
    )


@jit(nopython=True)
def _calculate_metrics_numba(ids1, ids2, mz_rt_map, samples):
    results = np.zeros(
        (len(ids1), 3)
    )  # For correlation, RT difference, and MZ difference
    for i in range(len(ids1)):
        id1, id2 = ids1[i], ids2[i]

        if id1 not in mz_rt_map or id2 not in mz_rt_map:
            continue  # Skip if IDs not found

        id1_mz, id1_rt = mz_rt_map[id1, 0], mz_rt_map[id1, 1]
        id2_mz, id2_rt = mz_rt_map[id2, 0], mz_rt_map[id2, 1]

        mz_difference = abs(id1_mz - id2_mz)
        rt_difference = abs(id1_rt - id2_rt)

        # Extract samples for IDs
        id1_data = samples[id1]
        id2_data = samples[id2]

        correlation = _calculate_correlation(id1_data, id2_data)

        results[i] = correlation, rt_difference, mz_difference

    return results


def _prepare_data(
    targeted_ions_df: pd.DataFrame, samples_df: pd.DataFrame, edge_data_df: pd.DataFrame
):
    # Convert ID columns to numpy arrays for ids1 and ids2 from edge_data_df
    ids1 = edge_data_df[ID_COL_1].to_numpy()
    ids2 = edge_data_df[ID_COL_2].to_numpy()

    # Assuming IDs are sequential and start from 0, which might need adjustment based on your actual IDs
    # If IDs are not sequential or start from a non-zero value, you would need to create a mapping
    id_mapping = {
        id_val: index for index, id_val in enumerate(targeted_ions_df[ID_COL].unique())
    }

    # Map ID to index for ids1 and ids2
    ids1_mapped = np.vectorize(id_mapping.get)(ids1)
    ids2_mapped = np.vectorize(id_mapping.get)(ids2)

    # Convert MZ and RT values into a 2D numpy array (indexed by the mapped ID)
    # Assuming the order of rows in targeted_ions_df matches the ID mapping
    mz_rt_map = targeted_ions_df[[MZ_COL, RT_COL]].to_numpy()

    # For samples_df, we need to ensure it's ordered by ID and matches the ID mapping
    # This assumes a single row per ID in samples_df, and the columns are the sample values
    # Convert to numpy, ensuring the order matches id_mapping
    samples_ordered = (
        samples_df.set_index(ID_COL).reindex(targeted_ions_df[ID_COL]).to_numpy()
    )

    return ids1_mapped, ids2_mapped, mz_rt_map, samples_ordered


@log("Calculating edge metrics")
async def calculate_edge_metrics(
    samples_df: pd.DataFrame, targeted_ions_df: pd.DataFrame, edge_data_df: pd.DataFrame
) -> pd.DataFrame:
    # Prepare data
    ids1, ids2, mz_rt_map, samples = _prepare_data(
        targeted_ions_df, samples_df, edge_data_df
    )
    results = _calculate_metrics_numba(ids1, ids2, mz_rt_map, samples)
    # Create a DataFrame from the Numba results
    metrics_df = pd.DataFrame(
        results, columns=[CORRELATION_COL, RT_DIFF_COL, MZ_DIFF_COL]
    )
    # If you kept the original index in the processing, you can set it directly
    metrics_df.index = edge_data_df.index

    return metrics_df
