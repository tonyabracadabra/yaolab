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
    edge_metrics: pd.DataFrame,
    reaction_df: pd.DataFrame,
    rt_time_window: float = 0.015,
    mz_error_threshold: float = 0.01,
    correlation_threshold: float = 0.95,
) -> tuple[pd.DataFrame, pd.Series]:
    # rename it!
    matched = edge_metrics

    # Ensure no NaN values
    reaction_df[MASS_DIFF_COL] = reaction_df.infer_objects(copy=False)[
        MASS_DIFF_COL
    ].fillna(np.inf)
    matched[MZ_DIFF_COL] = matched.infer_objects(copy=False)[MZ_DIFF_COL].fillna(np.inf)

    # Calculate the closest match within the threshold
    closest_matches = reaction_df.iloc[
        np.abs(
            reaction_df[MASS_DIFF_COL].values[:, None] - matched[MZ_DIFF_COL].values
        ).argmin(axis=0)
    ]
    matched[
        [
            MATCHED_MZ_DIFF_COL,
            MATCHED_FORMULA_CHANGE_COL,
            MATCHED_REACTION_DESCRIPTION_COL,
        ]
    ] = closest_matches[
        [MASS_DIFF_COL, FORMULA_CHANGE_COL, REACTION_DESCRIPTION_COL]
    ].values

    matched = matched[
        matched[MATCHED_MZ_DIFF_COL]
        .sub(matched[MZ_DIFF_COL])
        .abs()
        .lt(mz_error_threshold)
    ]

    # Add Redundant Data and ModCos columns
    matched[REDUNDANT_DATA_COL] = (
        matched[CORRELATION_COL] >= correlation_threshold
    ) & (matched[RT_DIFF_COL] <= rt_time_window)
    matched[MODCOS_COL] = matched[VALUE_COL] - 1

    return matched
