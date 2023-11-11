import pandas as pd
import numpy as np

# Read the CSV files
measured = pd.read_csv("F9_Mz&Similarity_RawEdge.csv")
theoretical = pd.read_csv("F3-Metabolic Reaction Database.csv")

# Define MZ Difference matching threshold
threshold = 0.01

# Compute absolute differences and match with the threshold
# We'll use a KDTree for efficient nearest neighbor search which is more memory-efficient
from scipy.spatial import cKDTree

# Create a KDTree from the theoretical mass differences
tree = cKDTree(theoretical[["Mass Difference(Da)"]].values)

# Query the tree for each measured MZ difference to find the distance and index of the closest theoretical value
distances, indexes = tree.query(measured[["MZ Difference"]].values, distance_upper_bound=threshold)

# Filter out unmatched rows, where distance exceeds the threshold
matched_mask = distances < threshold
matched_indexes = indexes[matched_mask]

# Assign matched values directly to the measured DataFrame
measured.loc[matched_mask, "Matched MZ Difference"] = theoretical["Mass Difference(Da)"].iloc[matched_indexes].values
measured.loc[matched_mask, "Matched FormulaChange"] = theoretical["Formula Change"].iloc[matched_indexes].values
measured.loc[matched_mask, "Matched Reaction Description"] = theoretical["Reaction Description"].iloc[matched_indexes].values

# Keep only the rows with matches
matched = measured[matched_mask]

# Add 'Redundant Data' and 'ModCos' columns
matched["Redundant Data"] = (matched["Correlation"] >= 0.9) & (matched["Retention Time Difference"] <= 0.015)
matched["ModCos"] = matched["Value"] - 1

# Save the updated matched DataFrame
matched.to_csv("F11_Updated_Matched_Edge.csv", index=False)

# Calculate counts for the 'Matched FormulaChange' column and save to CSV
counts = matched["Matched FormulaChange"].value_counts()
counts.to_csv("F12_Matched FormulaChange Count.csv", sep=",", encoding="utf-8")
