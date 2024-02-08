import numpy as np
import pandas as pd
from app.utils.constants import (
    CORRELATION_COL,
    FORMULA_CHANGE_COL,
    MASS_DIFF_COL,
    MATCHED_FORMULA_CHANGE_COL,
    MATCHED_MZ_DIFF_COL,
    MATCHED_REACTION_DESCRIPTION_COL,
    MODCOS_COL,
    MZ_DIFF_COL,
    REACTION_DESCRIPTION_COL,
    REDUNDANT_DATA_COL,
    RT_DIFF_COL,
    VALUE_COL,
)
from app.utils.logger import log


@log("Edge value matching")
async def edge_value_matching(
    edges: pd.DataFrame,
    reaction_df: pd.DataFrame,
    rt_time_window: float = 0.015,
    mz_error_threshold: float = 0.01,
    correlation_threshold: float = 0.95,
) -> None:
    # Ensure no NaN values
    reaction_df[MASS_DIFF_COL] = reaction_df.infer_objects(copy=False)[
        MASS_DIFF_COL
    ].fillna(np.inf)
    edges[MZ_DIFF_COL] = edges.infer_objects(copy=False)[MZ_DIFF_COL].fillna(np.inf)

    # Calculate the closest match within the threshold
    closest_matches = reaction_df.iloc[
        np.abs(
            reaction_df[MASS_DIFF_COL].values[:, None] - edges[MZ_DIFF_COL].values
        ).argmin(axis=0)
    ]
    edges[
        [
            MATCHED_MZ_DIFF_COL,
            MATCHED_FORMULA_CHANGE_COL,
            MATCHED_REACTION_DESCRIPTION_COL,
        ]
    ] = closest_matches[
        [MASS_DIFF_COL, FORMULA_CHANGE_COL, REACTION_DESCRIPTION_COL]
    ].values

    edges = edges[
        edges[MATCHED_MZ_DIFF_COL].sub(edges[MZ_DIFF_COL]).abs().lt(mz_error_threshold)
    ]

    # Add Redundant Data and ModCos columns
    edges[REDUNDANT_DATA_COL] = (edges[CORRELATION_COL] >= correlation_threshold) & (
        edges[RT_DIFF_COL] <= rt_time_window
    )
    edges[MODCOS_COL] = edges[VALUE_COL] - 1
