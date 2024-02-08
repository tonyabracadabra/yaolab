import numpy as np
import pandas as pd
from app.utils.constants import (
    CORRELATION_COL,
    ID_COL,
    MZ_COL,
    MZ_DIFF_COL,
    RT_COL,
    RT_DIFF_COL,
    SOURCE_COL,
    TARGET_COL,
)
from app.utils.logger import log
from scipy.spatial.distance import cosine


@log("Calculating edge metrics")
async def calculate_edge_metrics(
    samples_df: pd.DataFrame,
    targeted_ions_df: pd.DataFrame,
    edge_data_df: pd.DataFrame,
) -> pd.DataFrame:
    # Pre-calculate and map ID to mz and rt values for efficient lookup
    id_to_mz_rt = targeted_ions_df.set_index(ID_COL)[[MZ_COL, RT_COL]].to_dict("index")

    def calculate_metrics(row):
        source, target = row[SOURCE_COL], row[TARGET_COL]
        if source not in id_to_mz_rt or target not in id_to_mz_rt:
            return None, None, None

        source_mz, source_rt = id_to_mz_rt[source][MZ_COL], id_to_mz_rt[source][RT_COL]
        target_mz, target_rt = id_to_mz_rt[target][MZ_COL], id_to_mz_rt[target][RT_COL]

        mz_difference = abs(source_mz - target_mz)
        rt_difference = abs(source_rt - target_rt)

        source_data = samples_df.loc[targeted_ions_df[ID_COL] == source, :].values[0]
        target_data = samples_df.loc[targeted_ions_df[ID_COL] == target, :].values[0]

        # Calculate the cosine similarity between the two IDs
        correlation = 1 - cosine(source_data, target_data)

        return correlation, rt_difference, mz_difference

    edge_data_df[[CORRELATION_COL, RT_DIFF_COL, MZ_DIFF_COL]] = edge_data_df.apply(
        calculate_metrics, axis=1, result_type="expand"
    )

    return edge_data_df
