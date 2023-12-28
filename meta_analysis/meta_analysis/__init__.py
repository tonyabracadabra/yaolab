from dagster import job
from scipy.sparse import coo_matrix
from matchms.Spectrum import Spectrum
import pandas as pd

from .steps import (
    calculate_edge_metrics,
    create_similarity_matrix,
    combine_matrices_and_extract_edges,
    edge_value_matching,
    create_ion_interaction_matrix,
    load_data,
    update_metabolic_reaction_database,
)


@job
def full_workflow():
    # f1, f2, f3
    spectra, targeted_ions_df, metabolic_reaction_df, reaction_input = load_data()

    # optional
    metabolic_reaction_df: pd.DataFrame = update_metabolic_reaction_database(
        metabolic_reaction_df, reaction_input
    )

    # f6
    # this is to extract the interaction between ions that has m/z and mass difference within MASS_DIFF_THRESHOLD
    # given the metabolic reaction database (metabolic_reaction_df)
    ion_interaction_matrix = create_ion_interaction_matrix(
        targeted_ions_df, metabolic_reaction_df
    )
    # f7
    # this is to calculate the similarity between each pair of spectra
    similarity_matrix: coo_matrix = create_similarity_matrix(spectra, targeted_ions_df)
    # f9
    edge_data_df = combine_matrices_and_extract_edges(
        ion_interaction_matrix, similarity_matrix
    )
    # f10
    edge_metrics = calculate_edge_metrics(targeted_ions_df, edge_data_df)
    # f11, f12
    matched_df, formula_change_counts = edge_value_matching(
        edge_metrics, metabolic_reaction_df
    )

    print(f"matched_df: {matched_df}")
    print(f"formula_change_counts: {formula_change_counts}")
