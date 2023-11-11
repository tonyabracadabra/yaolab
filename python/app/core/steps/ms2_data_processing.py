import os
import time
import pandas as pd
from matchms.importing import load_from_mgf
from matchms import calculate_scores
from matchms.similarity import ModifiedCosine

def _my_filter_spec_by_scan_id(spec_f, filter_scan_id_set):
    return [spec for spec in spec_f if int(spec.metadata["scans"]) in filter_scan_id_set]

def _combine_score_to_matrix(scores, spec_ids):
    df_scores = pd.DataFrame(scores.scores, index=spec_ids, columns=spec_ids)
    return df_scores

def _cal_filter_ms2_cosine(spectrums, df_filter, similarity_measure, output_prefix):
    filter_scan_ids = set(df_filter["ID"])
    filtered_spectra = my_filter_spec_by_scan_id(spectrums, filter_scan_ids)
    print(len(filtered_spectra))
    
    if not filtered_spectra:  # If no spectra were found, exit the function
        print("No matching spectra found for given IDs.")
        return
    
    my_filter_scores = calculate_scores(filtered_spectra, filtered_spectra, similarity_measure, is_symmetric=True)
    spec_ids = [spec.metadata["scans"] for spec in filtered_spectra]
    score_matrix_df = combine_score_to_matrix(my_filter_scores, spec_ids)

    return score_matrix_df

def step_ms2_data_processing():
    similarity_measure = ModifiedCosine(tolerance=0.005)
    spectrums = list(load_from_mgf("F1-MSDIAL-MS2.mgf"))
    
    target_ions_csv_file = "F2-Targeted Ions.csv"
    df_filter_all = pd.read_csv(target_ions_csv_file)
    print(f"The {target_ions_csv_file} has been read!")
    print(f"The target ions count is {df_filter_all.shape[0]}")

    # Call the main function
    return cal_filter_ms2_cosine(spectrums, df_filter_all, similarity_measure, output_prefix="F7_ModCos")
