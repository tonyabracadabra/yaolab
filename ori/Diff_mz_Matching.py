import pandas as pd
import numpy as np
import pandas as pd
import numpy as np

def generate_adjacency_matrix(csv_file: str, output_file: str, value_column: int) -> None:
    # Read the CSV file using pandas for efficient data handling
    df = pd.read_csv(csv_file, usecols=[0, value_column], encoding='utf-8')

    # Extract the ID and value columns
    ids = df.iloc[:, 0].tolist()
    values = df.iloc[:, 1].values

    # Use broadcasting to calculate the differences matrix in a vectorized way
    adjacency_matrix = np.abs(values.reshape(-1, 1) - values.reshape(1, -1))

    # Convert the numpy array back to a DataFrame for easy CSV writing
    adjacency_df = pd.DataFrame(adjacency_matrix, index=ids, columns=ids)

    return adjacency_df


def replace_matching_values(adj_matrix: pd.DataFrame, inhouse_data: pd.DataFrame, threshold: float) -> pd.DataFrame:
    # Vectorized operation to calculate the absolute difference matrix
    mass_diff_matrix = adj_matrix.values[:, 1:].astype(float)
    theoretical_diffs = inhouse_data['Mass Difference(Da)'].values.astype(float)

    # Compute absolute differences and create a mask for values within the threshold
    abs_diff = np.abs(mass_diff_matrix[:, :, np.newaxis] - theoretical_diffs)
    within_threshold = np.any(abs_diff < threshold, axis=2)

    # Apply mask to the mass_diff_matrix
    mass_diff_matrix[~within_threshold] = 0
    # Place the theoretical values where the mask is True
    mass_diff_matrix[within_threshold] = theoretical_diffs[np.argmin(abs_diff, axis=2)][within_threshold]
    
    # Update the adjacency matrix with the new values
    adj_matrix.iloc[:, 1:] = mass_diff_matrix

    return adj_matrix

def replace_with_ones(adj_matrix: pd.DataFrame) -> pd.DataFrame:
    # Vectorized operation to replace non-zero values with '1'
    adj_matrix.iloc[:, 1:] = np.where(adj_matrix.iloc[:, 1:].astype(float) != 0, '1', '0')
    return adj_matrix

# Generate the adjacency matrix and save as Adjacency_Matrix_mz.csv
adj_matrix = generate_adjacency_matrix('F2-Targeted Ions.csv', 1)
inhouse_data = pd.read_csv('F3-Metabolic Reaction Database.csv', dtype=str)

# Set the threshold value
threshold = 0.005

# Step 1: Replace matching values
replaced_adj_matrix = replace_matching_values(adj_matrix.copy(), inhouse_data, threshold)

# Step 2: Replace non-zero m/z differences with 1
one_zero_adj_matrix = replace_with_ones(replaced_adj_matrix.copy())

# Write results to file
one_zero_adj_matrix.to_csv('F6_1_0_Adjacency_Matrix_mz.csv', index=False)
print("F6_1_0_Adjacency_Matrix_mz.csv has been saved !")
