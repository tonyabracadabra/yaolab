from pathlib import Path

import pandas as pd

# constants for standard target ions
ID_COL = "id"
MZ_COL = "mz"
RT_COL = "rt"
SAMPLE_COL = "sample"

# MDial delimiter
MSMS_SPECTRUM_COL = "MS/MS spectrum"
MSMS_ASSIGNED_COL = "MS/MS assigned"

# these are columns in the reaction file
MASS_DIFF_COL = "massDiff"
FORMULA_CHANGE_COL = "formulaChange"
REACTION_DESCRIPTION_COL = "description"

# edge csv
SOURCE_COL = "source"
TARGET_COL = "target"
VALUE_COL = "value"
CORRELATION_COL = "correlation"
RT_DIFF_COL = "retentionTimeDiff"
MZ_DIFF_COL = "mzDiff"
SAMPLE_START_COL_INDEX = 17  # Adjust this based on your DataFrame structure
MODCOS_COL = "modCos"
REDUNDANT_DATA_COL = "redundantData"
MATCHED_MZ_DIFF_COL = "matchedMZDiff"
MATCHED_FORMULA_CHANGE_COL = "matchedFormulaChange"
MATCHED_REACTION_DESCRIPTION_COL = "matchedDescription"

# load default reaction dataframe of 119 reactions from local file
DEFAULT_REACTION_DF = pd.read_csv(
    Path(__file__).parents[2] / "asset" / "default-reactions.csv"
)[[MASS_DIFF_COL, FORMULA_CHANGE_COL, REACTION_DESCRIPTION_COL]]
