from pathlib import Path

import pandas as pd

# constants for standard target ions
ID_COL = "id"
MZ_COL = "m/z"
RT_COL = "Rt(min)"
SAMPLE_COL = "sample"

# MDial delimiter
MSMS_SPECTRUM_COL = "MS/MS spectrum"
MSMS_ASSIGNED_COL = "MS/MS assigned"

CORRELATION_COL = "Correlation"
RT_DIFF_COL = "Retention Time Difference"
MZ_DIFF_COL = "MZ Difference"
SAMPLE_START_COL_INDEX = 17  # Adjust this based on your DataFrame structure
MODCOS_COL = "ModCos"
REDUNDANT_DATA_COL = "Redundant Data"

# these are columns in the reaction file
MASS_DIFF_COL = "massDiff"
FORMULA_CHANGE_COL = "formulaChange"
REACTION_DESCRIPTION_COL = "description"

# for edge df
ID_COL_1 = "id1"
ID_COL_2 = "id2"
VALUE_COL = "Value"

# load default reaction dataframe of 119 reactions from local file
DEFAULT_REACTION_DF = pd.read_csv(
    Path(__file__).parents[2] / "asset" / "default-reactions.csv"
)[[MASS_DIFF_COL, FORMULA_CHANGE_COL, REACTION_DESCRIPTION_COL]]

# edge csv
MATCHED_MZ_DIFF_COL = "Matched MZ Difference"
MATCHED_FORMULA_CHANGE_COL = "Matched FormulaChange"
MATCHED_REACTION_DESCRIPTION_COL = "Matched Reaction Description"
