from dagster import job
from .steps import diff_mz_matching, ReactionInput, edge_value_matching, calculate_ms_ms_cosine_similarity, update_metabolic_reaction_database, generate_adjacency_matrix, combine_matrices_and_extract_edges
import pandas as pd
from matchms.importing import load_from_mgf


@job
def full_workflow():
    # f1 data
    mgf_generator = load_from_mgf("file.mgf")
    # f2 data
    targeted_ions_df = pd.read_csv("targeted_ions.csv")
    # f3 data
    metabolic_reaction_df = pd.read_csv("metabolic_reaction.csv")
    reaction_input = ReactionInput(formula_change="", reaction_description="")

    metabolic_reaction_df_updated = update_metabolic_reaction_database(metabolic_reaction_df, reaction_input)
    # f4 data
    adj_matrix_mz_df = generate_adjacency_matrix(targeted_ions_df)
    # f6 data
    adj_matrix_df = diff_mz_matching(adj_matrix_mz_df, metabolic_reaction_df_updated)
    # f7 data
    similarity_matrix_df: pd.DataFrame = calculate_ms_ms_cosine_similarity(mgf_generator, targeted_ions_df)
    # f9 data
    edge_data_df = combine_matrices_and_extract_edges(adj_matrix_df, similarity_matrix_df)
    # f11, f12
    matched_df, formula_change_counts = edge_value_matching(edge_data_df, metabolic_reaction_df_updated)
