import pandas as pd
from dagster import asset
from matchms.importing import load_from_mgf
from matchms.Spectrum import Spectrum
from matchms import calculate_scores
from matchms.similarity import ModifiedCosine
from typing import Generator

# Dagster asset function
@asset
def calculate_ms_ms_cosine_similarity(mgf_generator: Generator[Spectrum, None, None], target_ions_df: pd.DataFrame) -> pd.DataFrame:
    # Set up similarity calculation parameters
    similarity_measure = ModifiedCosine(tolerance=0.005)

    # Read mgf file
    spectrums = list(mgf_generator)

    # Filter spectrums by scan ID
    filter_scan_ids = set(target_ions_df["id"].tolist())
    filtered_spectrums = [s for s in spectrums if int(s.metadata["scans"]) in filter_scan_ids]

    # Calculate cosine scores
    scores = calculate_scores(filtered_spectrums, filtered_spectrums, similarity_measure, is_symmetric=True)

    # Convert scores to DataFrame
    sim_matrix = pd.DataFrame({s.metadata["scans"]: [score.score for score in scores[i]] for i, s in enumerate(filtered_spectrums)})
    sim_matrix.index = [s.metadata["scans"] for s in filtered_spectrums]

    return sim_matrix

# Example usage:
# target_ions_df = pd.read_csv('F2-Targeted_Ions.csv')
# cosine_similarity_df = calculate_ms_ms_cosine_similarity(target_ions_df, 'F1-MSDIAL-MS2.mgf')
# cosine_similarity_df.to_csv('F7_ModCos_Adjecency_Matrix.csv')
