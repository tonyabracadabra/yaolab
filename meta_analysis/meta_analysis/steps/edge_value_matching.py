import numpy as np
import pandas as pd
from dagster import Out, op
from dagster_pandas import DataFrame

from ..utils.contants import (
    CORRELATION_COL,
    FORMULA_CHANGE_COL,
    MASS_DIFF_COL,
    MODCOS_COL,
    MZ_DIFF_COL,
    REACTION_DESCRIPTION_COL,
    REDUNDANT_DATA_COL,
    RT_DIFF_COL,
    VALUE_COL,
)

# 'Matched MZ Difference', 'Matched FormulaChange', 'Matched Reaction Description'
MATCHED_MZ_DIFF_COL = "Matched MZ Difference"
MATCHED_FORMULA_CHANGE_COL = "Matched FormulaChange"
MATCHED_REACTION_DESCRIPTION_COL = "Matched Reaction Description"


@op(out={"matched_df": Out(DataFrame), "formula_change_counts": Out(DataFrame)})
def edge_value_matching(
    edge_metrics: pd.DataFrame,
    metabolic_reaction_df: pd.DataFrame,
    threshold: float = 0.01,
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
        matched[MATCHED_MZ_DIFF_COL].sub(matched[MZ_DIFF_COL]).abs().lt(threshold)
    ]

    # Add Redundant Data and ModCos columns
    matched[REDUNDANT_DATA_COL] = (matched[CORRELATION_COL] >= 0.9) & (
        matched[RT_DIFF_COL] <= 0.015
    )
    matched[MODCOS_COL] = matched[VALUE_COL] - 1

    # Counting Formula Changes
    formula_change_counts = (
        matched[MATCHED_FORMULA_CHANGE_COL].value_counts().to_frame()
    )

    return matched, formula_change_counts


# Example usage:
# measured_df = pd.read_csv('F9_Mz_Similarity_RawEdge.csv')
# theoretical_df = pd.read_csv('F3_Metabolic_Reaction_Database.csv')
# matched_df, formula_change_counts = process_matched_data(measured_df, theoretical_df)
# matched_df.to_csv('F11_Updated_Matched_Edge.csv')
# formula_change_counts.to_csv('F12_Matched_FormulaChange_Count.csv', sep=",", encoding="utf-8")
