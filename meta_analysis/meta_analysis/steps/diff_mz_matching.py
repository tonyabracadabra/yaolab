import pandas as pd
from dagster import asset
from ..utils.contants import MASS_DIFF_COL

@asset
def diff_mz_matching(adj_matrix_df: pd.DataFrame, metabolic_reaction_df: pd.DataFrame, threshold: float = 0.005) -> pd.DataFrame:
    # Replace matching values
    for col in adj_matrix_df.columns[1:]:
        adj_matrix_df[col] = adj_matrix_df[col].apply(
            lambda x: next((y for y in metabolic_reaction_df[MASS_DIFF_COL] if abs(x - y) < threshold), 0)
        )

    # Replace non-zero values with 1
    adj_matrix_df = adj_matrix_df.replace(to_replace=[x for x in adj_matrix_df.columns if x != 0], value=1)

    return adj_matrix_df

# Example usage:
# adj_matrix_df = pd.read_csv('F4_Adjacency_Matrix_mz.csv')
# inhouse_data_df = pd.read_csv('F3-Metabolic_Reaction_Database.csv')
# processed_df = process_adjacency_matrix(adj_matrix_df, inhouse_data_df)
# processed_df.to_csv('F5_Re_Adjacency_Matrix_mz.csv')
