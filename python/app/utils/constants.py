from enum import Enum, EnumMeta
from pathlib import Path

import pandas as pd

_prefix = lambda x, y: f"{x.lower()}{y.capitalize()}"
_matched = lambda x: _prefix("matched", x)


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
    PROTOTYPE_COMPOUND = "prototypeCompound"
    SAMPLE = "sample"


class ReactionColumn(AutoValueEnumMeta):
    MZ_DIFF = "mzDiff"
    FORMULA_CHANGE = "formulaChange"
    REACTION_DESCRIPTION = "description"


class EdgeColumn(AutoValueEnumMeta):
    SOURCE = "source"
    TARGET = "target"
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
DEFAULT_REACTION_DF = pd.read_csv(
    Path(__file__).parents[2] / "asset" / "default-reactions.csv"
)[
    [
        ReactionColumn.MZ_DIFF,
        ReactionColumn.FORMULA_CHANGE,
        ReactionColumn.REACTION_DESCRIPTION,
    ]
]
