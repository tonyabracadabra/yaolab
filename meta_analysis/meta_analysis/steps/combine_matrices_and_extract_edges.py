import pandas as pd
from dagster import Out, op
from dagster_pandas import DataFrame
from scipy.sparse import coo_matrix

FILTERING_THRESHOLD = 1.5


@op(out=Out(DataFrame))
def combine_matrices_and_extract_edges(
    ion_interaction_matrix: coo_matrix,
    similarity_matrix: coo_matrix,
) -> pd.DataFrame:
    print(f"ion_interaction_matrix: {ion_interaction_matrix.shape}")
    print(f"similarity_matrix: {similarity_matrix.shape}")

    # Perform addition operation on sparse matrices
    result_matrix: coo_matrix = (ion_interaction_matrix + similarity_matrix).tocoo()

    # Extract row, column, and data from the result matrix
    row, col, data = result_matrix.row, result_matrix.col, result_matrix.data

    # Apply threshold and ensure ID1 - ID2 <= 0 to reduce the amount of data processed
    valid_indices = (data > FILTERING_THRESHOLD) & (row <= col)

    # Create a DataFrame from filtered data
    edge_data = pd.DataFrame(
        {
            "ID1": row[valid_indices],
            "ID2": col[valid_indices],
            "Value": data[valid_indices],
        }
    )

    return edge_data

# Example usage:
# similarity_matrix_df = pd.read_csv('F7_ModCos_Adjecency_Matrix.csv')
# mz_matrix_df = pd.read_csv('F6_1_0_Adjacency_Matrix_mz.csv')
# edge_data_df = combine_matrices_and_extract_edges(similarity_matrix_df, mz_matrix_df)
# edge_data_df.to_csv('F9_Mz_Similarity_RawEdge.csv')
