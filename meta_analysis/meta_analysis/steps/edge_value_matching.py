import pandas as pd
from dagster import asset
from ..utils.contants import MASS_DIFF_COL, FORMULA_CHANGE_COL, REACTION_DESCRIPTION_COL, MZ_DIFF_COL, CORRELATION_COL, RT_DIFF_COL, VALUE_COL, REDUNDANT_DATA_COL, MODCOS_COL, FORMULA_CHANGE_COL


@asset
def edge_value_matching(measured_df: pd.DataFrame, theoretical_df: pd.DataFrame, threshold: float = 0.01) -> pd.DataFrame:
    # Calculate the closest match within the threshold
    matched = measured_df.copy()
    closest_matches = theoretical_df.iloc[(theoretical_df[MASS_DIFF_COL].values[:, None] - measured_df[MZ_DIFF_COL].values).abs().argmin(axis=0)]
    matched[['Matched MZ Difference', 'Matched FormulaChange', 'Matched Reaction Description']] = closest_matches[[MASS_DIFF_COL, FORMULA_CHANGE_COL, REACTION_DESCRIPTION_COL]].values
    matched = matched[matched['Matched MZ Difference'].sub(matched[MZ_DIFF_COL]).abs().lt(threshold)]

    # Add Redundant Data and ModCos columns
    matched[REDUNDANT_DATA_COL] = (matched[CORRELATION_COL] >= 0.9) & (matched[RT_DIFF_COL] <= 0.015)
    matched[MODCOS_COL] = matched[VALUE_COL] - 1

    # Counting Formula Changes
    formula_change_counts = matched[FORMULA_CHANGE_COL].value_counts()

    return matched, formula_change_counts

# Example usage:
# measured_df = pd.read_csv('F9_Mz_Similarity_RawEdge.csv')
# theoretical_df = pd.read_csv('F3_Metabolic_Reaction_Database.csv')
# matched_df, formula_change_counts = process_matched_data(measured_df, theoretical_df)
# matched_df.to_csv('F11_Updated_Matched_Edge.csv')
# formula_change_counts.to_csv('F12_Matched_FormulaChange_Count.csv', sep=",", encoding="utf-8")
