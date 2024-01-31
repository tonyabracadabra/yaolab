import pandas as pd
from app.utils.logger import log
from scipy.sparse import coo_matrix


@log("Combining matrices and extracting edges")
async def combine_matrices_and_extract_edges(
    ion_interaction_matrix: coo_matrix,
    similarity_matrix: coo_matrix,
    ms2SimilarityThreshold: float = 0.7,
) -> pd.DataFrame:
    # Perform addition operation on sparse matrices
    result_matrix: coo_matrix = (ion_interaction_matrix + similarity_matrix).tocoo()

    # Extract row, column, and data from the result matrix
    row, col, data = result_matrix.row, result_matrix.col, result_matrix.data

    # Apply threshold and ensure ID1 - ID2 <= 0 to reduce the amount of data processed
    valid_indices = (data > 1 + ms2SimilarityThreshold) & (row <= col)

    # Create a DataFrame from filtered data
    edge_data = pd.DataFrame(
        {
            "ID1": row[valid_indices],
            "ID2": col[valid_indices],
            "Value": data[valid_indices],
        }
    )

    return edge_data
