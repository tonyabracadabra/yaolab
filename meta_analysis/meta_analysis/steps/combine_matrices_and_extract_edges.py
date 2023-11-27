import pandas as pd
from dagster import asset

# Dagster asset function
@asset
def combine_matrices_and_extract_edges(mz_matrix_df: pd.DataFrame, similarity_matrix_df: pd.DataFrame, threshold: float = 1.5) -> pd.DataFrame:
    # Perform addition operation
    result_matrix = similarity_matrix_df.add(mz_matrix_df, fill_value=0)

    # Extract and filter edge data
    edge_data = result_matrix.stack().reset_index()
    edge_data.columns = ['ID1', 'ID2', 'Value']
    edge_data = edge_data[edge_data['Value'] > threshold]
    edge_data = edge_data[edge_data['ID1'].astype(int) - edge_data['ID2'].astype(int) <= 0]

    return edge_data

# Example usage:
# similarity_matrix_df = pd.read_csv('F7_ModCos_Adjecency_Matrix.csv')
# mz_matrix_df = pd.read_csv('F6_1_0_Adjacency_Matrix_mz.csv')
# edge_data_df = combine_matrices_and_extract_edges(similarity_matrix_df, mz_matrix_df)
# edge_data_df.to_csv('F9_Mz_Similarity_RawEdge.csv')
