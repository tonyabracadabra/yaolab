import asyncio
from typing import Literal

import pandas as pd
from app.models.analysis import Analysis, Experiment, ReactionDatabase
from app.utils.constants import DEFAULT_REACTION_DF, ID_COL, SAMPLE_COL
from app.utils.convex import load_mgf, load_parquet
from app.utils.logger import log
from matchms.Spectrum import Spectrum

from convex import ConvexClient


async def _load_reaction_db(
    reaction_db: ReactionDatabase | Literal["default"],
) -> pd.DataFrame:
    if reaction_db == "default":
        return DEFAULT_REACTION_DF
    else:
        reaction_df = pd.concat(
            [
                DEFAULT_REACTION_DF,
                pd.DataFrame([reaction.dict() for reaction in reaction_db.reactions]),
            ]
        )
        reaction_df[ID_COL] = range(len(reaction_df)) + 1
        return reaction_df


def _filter_metabolites(
    data: pd.DataFrame,
    experiments: list[Experiment],
    minSignalThreshold: float,
    signalEnrichmentFactor: float,
) -> pd.DataFrame:
    samples_df = data[SAMPLE_COL]
    cond = pd.Series(False, index=data.index)
    for experiment in experiments:
        sample_group, blank_group = (
            experiment.sampleGroups,
            experiment.blankGroups,
        )

        blank_mean = samples_df[blank_group].mean(axis=1)
        sample_max = samples_df[sample_group].max(axis=1)

        filter_cond = (sample_max > minSignalThreshold) & (
            sample_max > signalEnrichmentFactor * blank_mean
        )
        cond |= filter_cond

        data[(SAMPLE_COL, experiment.name)] = samples_df[sample_group].mean(axis=1)

    return data[cond].drop_duplicates()


@log("Loading data")
async def load_data(
    analysis: Analysis,
    convex: ConvexClient,
) -> tuple[list[Spectrum], pd.DataFrame, pd.DataFrame]:
    tasks = [
        load_mgf(analysis.rawFile.mgf, convex=convex),
        load_parquet(analysis.rawFile.targetedIons, convex=convex),
        _load_reaction_db(analysis.reactionDb),
    ]
    spectra, targeted_ions_df, reaction_df = await asyncio.gather(*tasks)

    targeted_ions_df = _filter_metabolites(
        data=targeted_ions_df,
        experiments=analysis.config.experiments,
        minSignalThreshold=analysis.config.minSignalThreshold,
        signalEnrichmentFactor=analysis.config.signalEnrichmentFactor,
    )

    return spectra, targeted_ions_df, reaction_df
