import os
import tempfile

import pandas as pd
from app.models.analysis import Analysis, ReactionDatabase
from app.utils.convex import load_csv, load_mgf
from matchms.importing import load_from_mgf
from matchms.Spectrum import Spectrum

current_dir = os.path.dirname(__file__)


def _load_reaction_db(reaction_db: ReactionDatabase) -> pd.DataFrame:
    reaction_df: pd.DataFrame = load_csv(reaction_db.file)

    # Convert customReactions to DataFrame
    custom_reactions_df = pd.DataFrame(
        [reaction.to_dict() for reaction in reaction_db.customReactions]
    )
    custom_reactions_df.columns = [
        "Reaction Description",
        "Mass Difference(Da)",
        "Formula Change",
    ]

    # Merge DataFrames
    merged_df = reaction_df.merge(
        custom_reactions_df,
        how="outer",
        on=["Reaction Description", "Mass Difference(Da)", "Formula Change"],
    )

    return merged_df


def load_data(
    analysis: Analysis,
) -> tuple[list[Spectrum], pd.DataFrame, pd.DataFrame]:
    spectra = load_mgf(analysis.rawFile.mgf)
    targeted_ions_df = load_csv(analysis.rawFile.targetedIons)
    reaction_df = _load_reaction_db(analysis.reactionDb)

    input_dir = os.path.join(current_dir, "../input")
    spectra: list[Spectrum] = list(
        load_from_mgf(os.path.join(input_dir, "F1-MSDIAL-MS2.mgf"))
    )

    return spectra, targeted_ions_df, reaction_df
