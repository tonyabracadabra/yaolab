import asyncio

import pandas as pd
from app.models.analysis import Analysis, Experiment, ReactionDatabase
from app.utils.convex import load_csv, load_mgf
from app.utils.logger import log
from matchms.Spectrum import Spectrum

REACTION_COLUMNS = ["Reaction Description", "Mass Difference(Da)", "Formula Change"]


async def _load_reaction_db(reaction_db: ReactionDatabase) -> pd.DataFrame:
    reaction_df: pd.DataFrame = await load_csv(reaction_db.file)

    # Check if customReactions is empty
    if not reaction_db.customReactions:
        return reaction_df

    # Convert customReactions to DataFrame
    custom_reactions_df = pd.DataFrame(
        [reaction.dict() for reaction in reaction_db.customReactions]
    )
    custom_reactions_df.columns = REACTION_COLUMNS

    # Merge DataFrames
    merged_df = reaction_df.merge(
        custom_reactions_df,
        how="outer",
        on=REACTION_COLUMNS,
    )

    return merged_df


def _filter_metabolites(
    data: pd.DataFrame,
    experiments: list[Experiment],
    minSignalThreshold: float,
    signalEnrichmentFactor: float,
):
    cond = True
    for experiment in experiments:
        sample_group = experiment.sampleGroups
        blank_group = experiment.blankGroups
        cond &= (data[sample_group].max(axis=1) > minSignalThreshold) & (
            data[blank_group].mean(axis=1) > signalEnrichmentFactor
        )
        group_columns = sample_group + blank_group
        data[experiment.name] = data[group_columns].mean(axis=1).round().astype(int)

    return data[cond]


@log("Loading data")
async def load_data(
    analysis: Analysis,
) -> tuple[list[Spectrum], pd.DataFrame, pd.DataFrame]:
    tasks = [
        load_mgf(analysis.rawFile.mgf),
        load_csv(analysis.rawFile.targetedIons),
        _load_reaction_db(analysis.reactionDb),
    ]
    spectra, targeted_ions_df, reaction_df = await asyncio.gather(*tasks)
    targeted_ions_df = _filter_metabolites(
        analysis,
        targeted_ions_df,
        minSignalThreshold=analysis.config.minSignalThreshold,
        signalEnrichmentFactor=analysis.config.signalEnrichmentFactor,
    )

    return spectra, targeted_ions_df, reaction_df
