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


@log("Calculating edge metrics")
async def calculate_edge_metrics(
    samples_df: pd.DataFrame, targeted_ions_df: pd.DataFrame, edge_data_df: pd.DataFrame
) -> pd.DataFrame:
    # Pre-calculate and map ID to mz and rt values for efficient lookup
    id_to_mz_rt = targeted_ions_df.set_index(ID_COL)[[MZ_COL, RT_COL]].to_dict("index")

    def calculate_metrics(row):
        id1, id2 = row[ID_COL_1], row[ID_COL_2]
        if id1 not in id_to_mz_rt or id2 not in id_to_mz_rt:
            return None, None, None

        id1_mz, id1_rt = id_to_mz_rt[id1][MZ_COL], id_to_mz_rt[id1][RT_COL]
        id2_mz, id2_rt = id_to_mz_rt[id2][MZ_COL], id_to_mz_rt[id2][RT_COL]

        mz_difference = abs(id1_mz - id2_mz)
        rt_difference = abs(id1_rt - id2_rt)

        id1_data = samples_df.loc[targeted_ions_df[ID_COL] == id1, :].values[0]
        id2_data = samples_df.loc[targeted_ions_df[ID_COL] == id2, :].values[0]
        # Calculate the cosine similarity between the two IDs
        correlation = np.dot(id1_data, id2_data) / (
            np.linalg.norm(id1_data) * np.linalg.norm(id2_data)
        )

        return correlation, rt_difference, mz_difference

    edge_data_df[[CORRELATION_COL, RT_DIFF_COL, MZ_DIFF_COL]] = edge_data_df.apply(
        calculate_metrics, axis=1, result_type="expand"
    )

    return edge_data_df
