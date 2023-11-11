import pandas as pd
import numpy as np

# Read CSV files using pandas
similarity_matrix = pd.read_csv('F7_ModCos_Adjecency_matrix.csv', index_col=0).astype(float)
mz_matrix = pd.read_csv('F6_1_0_Adjacency_Matrix_mz.csv', index_col=0).astype(float)

# Ensure that the indices and columns are sorted (if not already sorted)
similarity_matrix.sort_index(inplace=True)
similarity_matrix.sort_index(axis=1, inplace=True)
mz_matrix.sort_index(inplace=True)
mz_matrix.sort_index(axis=1, inplace=True)

# Perform element-wise addition of the matrices using numpy for efficiency
result_matrix = similarity_matrix.values + mz_matrix.values

# Convert the resulting numpy array back to a DataFrame
result_matrix_df = pd.DataFrame(result_matrix, index=similarity_matrix.index, columns=similarity_matrix.columns)

# Write to CSV file
result_matrix_df.to_csv('F8_Mz&Similarity_Adjecency_matrix.csv')
print("Mz&Similarity_Adjecency_matrix.csv has been saved!")

# Convert indices to integers for comparison
ids = result_matrix_df.index.astype(int)

# Use numpy to find pairs where the condition is met (value > 1.5 and ID1 <= ID2)
# This avoids stacking the DataFrame, which is a memory-intensive operation
id1, id2 = np.where(np.triu(result_matrix > 1.5, k=1))

# Create a DataFrame from the filtered pairs
edge_data = pd.DataFrame({
    'ID1': ids[id1],
    'ID2': ids[id2],
    'Value': result_matrix[id1, id2]
})

# Write to CSV file
edge_data.to_csv('F9_Mz&Similarity_RawEdge.csv', index=False)
print("F9_Mz&Similarity_RawEdge.csv has been saved!")
