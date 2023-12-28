import os

import pandas as pd
from dagster import multi_asset, AssetOut
from matchms.importing import load_from_mgf
from matchms.Spectrum import Spectrum
from .update_metabolic_reaction_database import ReactionInput

current_dir = os.path.dirname(__file__)


@multi_asset(
    outs={
        "spectra": AssetOut(),
        "targeted_ions_df": AssetOut(),
        "metabolic_reaction_df": AssetOut(),
        "reaction_input": AssetOut(),
    }
)
def load_data() -> tuple[list[Spectrum], pd.DataFrame, pd.DataFrame, ReactionInput]:
    input_dir = os.path.join(current_dir, "../input")
    spectra: list[Spectrum] = list(
        load_from_mgf(os.path.join(input_dir, "F1-MSDIAL-MS2.mgf"))
    )
    targeted_ions_df: pd.DataFrame = pd.read_csv(
        os.path.join(input_dir, "F2-Targeted Ions.csv")
    )
    metabolic_reaction_df: pd.DataFrame = pd.read_csv(
        os.path.join(input_dir, "F3-Metabolic Reaction Database.csv")
    )
    reaction_input = ReactionInput(formula_change="", reaction_description="")

    return spectra, targeted_ions_df, metabolic_reaction_df, reaction_input
