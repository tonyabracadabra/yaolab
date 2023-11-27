import pandas as pd
from dagster import asset

@asset
def generate_adjacency_matrix(target_ions_df: pd.DataFrame, value_column: int = 1) -> pd.DataFrame:
    # Calculate the adjacency matrix using vectorized operations
    values = target_ions_df[value_column].values
    adj_matrix_mz_df = pd.DataFrame(abs(values - values.reshape(-1, 1)), columns=target_ions_df.iloc[:, 0], index=target_ions_df.iloc[:, 0])

    return adj_matrix_mz_df

# Example usage
# df = pd.read_csv('F2-Targeted Ions.csv')
# adjacency_matrix_df = generate_adjacency_matrix(df, 'YourValueColumnName')
# adjacency_matrix_df.to_csv('F4_Adjacency_Matrix_mz.csv')
