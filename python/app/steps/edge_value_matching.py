import numpy as np
import pandas as pd
from app.utils.logger import log

from ..utils.contants import (CORRELATION_COL, FORMULA_CHANGE_COL,
                              MASS_DIFF_COL, MODCOS_COL, MZ_DIFF_COL,
                              REACTION_DESCRIPTION_COL, REDUNDANT_DATA_COL,
                              RT_DIFF_COL, VALUE_COL)

MATCHED_MZ_DIFF_COL = "Matched MZ Difference"
MATCHED_FORMULA_CHANGE_COL = "Matched FormulaChange"
MATCHED_REACTION_DESCRIPTION_COL = "Matched Reaction Description"


@log("Edge value matching")
async def edge_value_matching(
    edge_metrics: pd.DataFrame,
    metabolic_reaction_df: pd.DataFrame,
    rtTimeWindow: float = 0.015,
    mzErrorThreshold: float = 0.01,
    correlationThreshold: float = 0.95,
) -> tuple[pd.DataFrame, pd.Series]:
    matched = edge_metrics.copy()

    # Ensure no NaN values
    metabolic_reaction_df[MASS_DIFF_COL] = metabolic_reaction_df[MASS_DIFF_COL].fillna(
        np.inf
    )
    matched[MZ_DIFF_COL] = edge_metrics[MZ_DIFF_COL].fillna(np.inf)

    # Calculate the closest match within the threshold
    closest_matches = metabolic_reaction_df.iloc[
        np.abs(
            metabolic_reaction_df[MASS_DIFF_COL].values[:, None]
            - matched[MZ_DIFF_COL].values
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
        .lt(mzErrorThreshold)
    ]

    # Add Redundant Data and ModCos columns
    matched[REDUNDANT_DATA_COL] = (matched[CORRELATION_COL] >= correlationThreshold) & (
        matched[RT_DIFF_COL] <= rtTimeWindow
    )
    matched[MODCOS_COL] = matched[VALUE_COL] - 1

    # Counting Formula Changes
    formula_change_counts = (
        matched[MATCHED_FORMULA_CHANGE_COL].value_counts().to_frame()
    )

    return matched, formula_change_counts
