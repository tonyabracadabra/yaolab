import numpy as np
import pandas as pd
from app.utils.constants import EdgeColumn
from app.utils.logger import log
from scipy.sparse import coo_matrix


@log("Combining matrices and extracting edges")
async def combine_matrices_and_extract_edges(
    ion_interaction_matrix: coo_matrix,
    similarity_matrix: coo_matrix,
    ids: np.ndarray,
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
            EdgeColumn.ID1: ids[row[valid_indices]],
            EdgeColumn.ID2: ids[col[valid_indices]],
            EdgeColumn.VALUE: data[valid_indices],
        }
    )

    return edge_data
