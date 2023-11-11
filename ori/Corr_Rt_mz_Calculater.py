import pandas as pd
import numpy as np
from typing import Tuple

# Load data using a function for reusability and clearer code structure
def load_data(detected_ions_file: str, edge_file: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
    detected_ions_data = pd.read_csv(detected_ions_file)
    edge_data = pd.read_csv(edge_file)
    return detected_ions_data, edge_data

# Calculate correlations using vectorized operations
def calculate_correlation(detected_ions_data: pd.DataFrame, edge_data: pd.DataFrame) -> None:
    # Generate a dictionary that maps ID to the corresponding data
    ion_dict = detected_ions_data.set_index('ID').iloc[:, 16:].T.to_dict('list')

    # Using list comprehension and numpy for vectorized operations
    edge_data['Correlation'] = [
        np.corrcoef(ion_dict[ID1], ion_dict[ID2])[0, 1]
        if ID1 in ion_dict and ID2 in ion_dict else None
        for ID1, ID2 in zip(edge_data['ID1'], edge_data['ID2'])
    ]

# Calculate retention time differences using vectorized operations
def calculate_retention_time_difference(detected_ions_data: pd.DataFrame, edge_data: pd.DataFrame) -> None:
    ion_rt = detected_ions_data.set_index('ID')['Rt(min)']
    edge_data['Retention Time Difference'] = abs(
        ion_rt.reindex(edge_data['ID1']).values - ion_rt.reindex(edge_data['ID2']).values
    )

# Calculate m/z differences using vectorized operations
def calculate_MZ_difference(detected_ions_data: pd.DataFrame, edge_data: pd.DataFrame) -> None:
    ion_mz = detected_ions_data.set_index('ID')['m/z']
    edge_data['MZ Difference'] = abs(
        ion_mz.reindex(edge_data['ID1']).values - ion_mz.reindex(edge_data['ID2']).values
    )

# Main function to encapsulate the process
def process_files(detected_ions_file: str, edge_file: str) -> None:
    detected_ions_data, edge_data = load_data(detected_ions_file, edge_file)

    calculate_correlation(detected_ions_data, edge_data)
    calculate_retention_time_difference(detected_ions_data, edge_data)
    calculate_MZ_difference(detected_ions_data, edge_data)

    # Save the updated edge data
    edge_data.to_csv(edge_file, index=False)

# Constants for file paths
DETECTED_IONS_FILE = 'F2-Targeted Ions.csv'
EDGE_FILE = 'F9_Mz&Similarity_RawEdge.csv'

# Execute the process
process_files(DETECTED_IONS_FILE, EDGE_FILE)
