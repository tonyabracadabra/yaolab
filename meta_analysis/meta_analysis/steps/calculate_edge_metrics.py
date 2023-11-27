import pandas as pd
import numpy as np
from dagster import asset
from ..utils.contants import ID_COL, MZ_COL, RT_COL, SAMPLE_START_COL_INDEX, CORRELATION_COL, RT_DIFF_COL, MZ_DIFF_COL

# Dagster asset function
@asset
def calculate_edge_metrics(detected_ions_df: pd.DataFrame, edge_data_df: pd.DataFrame) -> pd.DataFrame:

    # Pre-calculate and map ID to mz and rt values for efficient lookup
    id_to_mz_rt = detected_ions_df.set_index(ID_COL)[[MZ_COL, RT_COL]].to_dict('index')

    def calculate_metrics(row):
        id1, id2 = row[ID_COL + '1'], row[ID_COL + '2']
        if id1 not in id_to_mz_rt or id2 not in id_to_mz_rt:
            return None, None, None

        id1_mz, id1_rt = id_to_mz_rt[id1][MZ_COL], id_to_mz_rt[id1][RT_COL]
        id2_mz, id2_rt = id_to_mz_rt[id2][MZ_COL], id_to_mz_rt[id2][RT_COL]

        mz_difference = abs(id1_mz - id2_mz)
        rt_difference = abs(id1_rt - id2_rt)

        id1_data = detected_ions_df.loc[detected_ions_df[ID_COL] == id1, detected_ions_df.columns[SAMPLE_START_COL_INDEX:]].values[0]
        id2_data = detected_ions_df.loc[detected_ions_df[ID_COL] == id2, detected_ions_df.columns[SAMPLE_START_COL_INDEX:]].values[0]
        correlation = np.corrcoef(id1_data, id2_data)[0, 1]

        return correlation, rt_difference, mz_difference

    edge_data_df[[CORRELATION_COL, RT_DIFF_COL, MZ_DIFF_COL]] = edge_data_df.apply(calculate_metrics, axis=1, result_type="expand")

    return edge_data_df

# Example usage:
# detected_ions_df = pd.read_csv('F2_Targeted_Ions.csv')
# edge_data_df = pd.read_csv('F9_Mz_Similarity_RawEdge.csv')
# updated_edge_data_df = calculate_edge_metrics(detected_ions_df, edge_data_df)
# updated_edge_data_df.to_csv('F10_Updated_Edge_Data.csv')
