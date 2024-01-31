import os

import pandas as pd
from app.models.analysis import Analysis, ReactionDatabase
from app.utils.convex import load_csv, load_mgf
from app.utils.logger import log
from matchms.Spectrum import Spectrum

current_dir = os.path.dirname(__file__)


def _load_reaction_db(reaction_db: ReactionDatabase) -> pd.DataFrame:
    reaction_df: pd.DataFrame = load_csv(reaction_db.file)

    # Check if customReactions is empty
    if not reaction_db.customReactions:
        return reaction_df

    # Convert customReactions to DataFrame
    custom_reactions_df = pd.DataFrame(
        [reaction.dict() for reaction in reaction_db.customReactions]
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


@log("Loading data")
def load_data(
    analysis: Analysis,
) -> tuple[list[Spectrum], pd.DataFrame, pd.DataFrame]:
    spectra = load_mgf(analysis.rawFile.mgf)
    targeted_ions_df = load_csv(analysis.rawFile.targetedIons)
    reaction_df = _load_reaction_db(analysis.reactionDb)

    return spectra, targeted_ions_df, reaction_df
