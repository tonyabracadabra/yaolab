# constants for standard target ions
ID_COL = "id"
MZ_COL = "m/z"
RT_COL = "Rt(min)"

CORRELATION_COL = "Correlation"
RT_DIFF_COL = "Retention Time Difference"
MZ_DIFF_COL = "MZ Difference"
SAMPLE_START_COL_INDEX = 17  # Adjust this based on your DataFrame structure
VALUE_COL = "Value"
MODCOS_COL = "ModCos"
REDUNDANT_DATA_COL = "Redundant Data"

# these are columns in the reaction file
MASS_DIFF_COL = "massDiff"
FORMULA_CHANGE_COL = "formulaChange"
REACTION_DESCRIPTION_COL = "description"

from pathlib import Path

# load default reaction dataframe of 119 reactions from local file
import pandas as pd

DEFAULT_REACTION_DF = pd.read_csv(
    Path(__file__).parents[2] / "asset" / "default-reactions.csv"
)[[MASS_DIFF_COL, FORMULA_CHANGE_COL, REACTION_DESCRIPTION_COL]]
