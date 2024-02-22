from enum import Enum, EnumMeta
from pathlib import Path

import pandas as pd

_matched = lambda x: f"matched{x[0].upper()}{x[1:]}"


class AutoValueEnumMeta(EnumMeta):
    def __getattribute__(cls, name):
        member = super().__getattribute__(name)
        if isinstance(member, Enum):
            return member.value
        return member


class TargetIonsColumn(AutoValueEnumMeta):
    ID = "id"
    MZ = "mz"
    RT = "rt"
    IS_PROTOTYPE = "isPrototype"
    SAMPLE = "sample"


class ReactionColumn(AutoValueEnumMeta):
    MZ_DIFF = "mzDiff"
    FORMULA_CHANGE = "formulaChange"
    REACTION_DESCRIPTION = "description"


class EdgeColumn(AutoValueEnumMeta):
    ID1 = "id1"
    ID2 = "id2"
    VALUE = "value"
    CORRELATION = "correlation"
    MZ_DIFF = ReactionColumn.MZ_DIFF
    FORMULA_CHANGE = ReactionColumn.FORMULA_CHANGE
    REACTION_DESCRIPTION = ReactionColumn.REACTION_DESCRIPTION
    MATCHED_MZ_DIFF = _matched(ReactionColumn.MZ_DIFF)
    MATCHED_FORMULA_CHANGE = _matched(ReactionColumn.FORMULA_CHANGE)
    MATCHED_REACTION_DESCRIPTION = _matched(ReactionColumn.REACTION_DESCRIPTION)
    RT_DIFF = "rtDiff"
    MODCOS = "modCos"
    REDUNDANT_DATA = "redundantData"


class MDialColumn(str, Enum):
    MSMS_SPECTRUM = "MS/MS spectrum"
    MSMS_ASSIGNED = "MS/MS assigned"


# load default reaction dataframe of 119 reactions from local file
    

def _load_default_reactions():
    folder = Path(__file__).parents[2] / "asset"
    reaction_cols = [
        ReactionColumn.MZ_DIFF,
        ReactionColumn.FORMULA_CHANGE,
        ReactionColumn.REACTION_DESCRIPTION,
    ]
    default_reaction_df = pd.read_csv(folder / "default-common-reactions.csv")[
        reaction_cols
    ]
    pos_adduct_df = pd.read_csv(folder / "pos-adducts.csv")[reaction_cols]
    neg_adduct_df = pd.read_csv(folder / "neg-adducts.csv")[reaction_cols]

    return pd.concat([default_reaction_df, pos_adduct_df]), pd.concat([default_reaction_df, neg_adduct_df])

DEFAULT_POS_DF, DEFAULT_NEG_DF = _load_default_reactions()
