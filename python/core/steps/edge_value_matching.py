import numpy as np
import pandas as pd
from core.utils.constants import EdgeColumn
from core.utils.logger import log


@log("Edge value matching")
async def edge_value_matching(
    edges: pd.DataFrame,
    reaction_df: pd.DataFrame,
    rt_time_window: float = 0.015,
    mz_error_threshold: float = 0.01,
    correlation_threshold: float = 0.95,
) -> pd.DataFrame:
    # Ensure no NaN values
    reaction_df[EdgeColumn.MZ_DIFF] = reaction_df.infer_objects(copy=False)[
        EdgeColumn.MZ_DIFF
    ].fillna(np.inf)
    edges[EdgeColumn.MZ_DIFF] = edges.infer_objects(copy=False)[
        EdgeColumn.MZ_DIFF
    ].fillna(np.inf)

    # Calculate the closest match within the threshold
    closest_matches = reaction_df.iloc[
        np.abs(
            reaction_df[EdgeColumn.MZ_DIFF].values[:, None]
            - edges[EdgeColumn.MZ_DIFF].values
        ).argmin(axis=0)
    ]

    edges[
        [
            EdgeColumn.MATCHED_MZ_DIFF,
            EdgeColumn.MATCHED_FORMULA_CHANGE,
            EdgeColumn.MATCHED_REACTION_DESCRIPTION,
        ]
    ] = closest_matches[
        [EdgeColumn.MZ_DIFF, EdgeColumn.FORMULA_CHANGE, EdgeColumn.REACTION_DESCRIPTION]
    ].values
    edges = edges[
        edges[EdgeColumn.MATCHED_MZ_DIFF]
        .sub(edges[EdgeColumn.MZ_DIFF])
        .abs()
        .lt(mz_error_threshold)
    ]

    # Add Redundant Data and ModCos columns
    edges[EdgeColumn.REDUNDANT_DATA] = (
        edges[EdgeColumn.CORRELATION] >= correlation_threshold
    ) & (edges[EdgeColumn.RT_DIFF] <= rt_time_window)
    edges[EdgeColumn.MODCOS] = edges[EdgeColumn.VALUE] - 1

    return edges
