import pandas as pd
from app.utils.constants import ID_COL_1, ID_COL_2, VALUE_COL
from app.utils.logger import log
from scipy.sparse import coo_matrix


@log("Combining matrices and extracting edges")
async def combine_matrices_and_extract_edges(
    ion_interaction_matrix: coo_matrix,
    similarity_matrix: coo_matrix,
    ms2_similarity_threshold: float = 0.7,
) -> pd.DataFrame:
    result_matrix: coo_matrix = (ion_interaction_matrix + similarity_matrix).tocoo()

    # Extract row, column, and data from the result matrix
    row, col, data = result_matrix.row, result_matrix.col, result_matrix.data

    # Apply threshold and ensure ID1 - ID2 <= 0 to reduce the amount of data processed
    valid_indices = (data > 1 + ms2_similarity_threshold) & (row <= col)

    # Create a DataFrame from filtered data
    edge_data = pd.DataFrame(
        {
            ID_COL_1: row[valid_indices],
            ID_COL_2: col[valid_indices],
            VALUE_COL: data[valid_indices],
        }
    )

    return edge_data
