import pandas as pd
from app.utils.constants import EdgeColumn, TargetIonsColumn
from app.utils.logger import log
from scipy.spatial.distance import cosine


@log("Calculating edge metrics")
async def calculate_edge_metrics(
    samples_df: pd.DataFrame,
    targeted_ions_df: pd.DataFrame,
    edge_data_df: pd.DataFrame,
) -> pd.DataFrame:
    # Pre-calculate and map ID to mz and rt values for efficient lookup
    id_to_mz_rt = targeted_ions_df.set_index(TargetIonsColumn.ID)[
        [TargetIonsColumn.MZ, TargetIonsColumn.RT]
    ].to_dict("index")

    def calculate_metrics(row):
        source, target = row[EdgeColumn.ID1], row[EdgeColumn.ID2]
        if source not in id_to_mz_rt or target not in id_to_mz_rt:
            return None, None, None

        source_mz, source_rt = (
            id_to_mz_rt[source][TargetIonsColumn.MZ],
            id_to_mz_rt[source][TargetIonsColumn.RT],
        )
        target_mz, target_rt = (
            id_to_mz_rt[target][TargetIonsColumn.MZ],
            id_to_mz_rt[target][TargetIonsColumn.RT],
        )

        mz_difference = abs(source_mz - target_mz)
        rt_difference = abs(source_rt - target_rt)

        source_data = samples_df.loc[
            targeted_ions_df[TargetIonsColumn.ID] == source, :
        ].values[0]
        target_data = samples_df.loc[
            targeted_ions_df[TargetIonsColumn.ID] == target, :
        ].values[0]

        # Calculate the cosine similarity between the two IDs
        correlation = 1 - cosine(source_data, target_data)

        return correlation, rt_difference, mz_difference

    edge_data_df[
        [EdgeColumn.CORRELATION, EdgeColumn.RT_DIFF, EdgeColumn.MZ_DIFF]
    ] = edge_data_df.apply(calculate_metrics, axis=1, result_type="expand")

    return edge_data_df
