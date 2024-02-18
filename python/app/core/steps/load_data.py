import asyncio
from typing import Literal

import pandas as pd
from app.models.analysis import Analysis, BioSample, DrugSample, ReactionDatabase
from app.utils.constants import DEFAULT_REACTION_DF, TargetIonsColumn
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
        reaction_df[TargetIonsColumn.ID] = range(len(reaction_df)) + 1
        return reaction_df


def _filter_metabolites(
    data: pd.DataFrame,
    bio_samples: list[BioSample],
    drug_sample: DrugSample | None,
    min_signal_threshold: float,
    signal_enrichment_factor: float,
) -> pd.DataFrame:
    samples_df = data[TargetIonsColumn.SAMPLE]
    cond = pd.Series(False, index=data.index)
    for bio in bio_samples:
        sample_group, blank_group = (
            bio.sample,
            bio.blank,
        )

        blank_mean = samples_df[blank_group].mean(axis=1)
        sample_max = samples_df[sample_group].max(axis=1)

        filter_cond = (sample_max > min_signal_threshold) & (
            sample_max > signal_enrichment_factor * blank_mean
        )
        cond |= filter_cond

        data[(TargetIonsColumn.SAMPLE, bio.name)] = samples_df[sample_group].mean(
            axis=1
        )

    if drug_sample:
        data[(TargetIonsColumn.SAMPLE, drug_sample.name)] = samples_df[
            drug_sample.groups
        ].mean(axis=1)
        # If a specific m/z in the drug sample exceeds the minimum signal threshold and is more than the signal enrichment factor times the response of any blank sample,
        # it's flagged as a potential prototype compound
        data[("", TargetIonsColumn.IS_PROTOTYPE)] = cond & (
            data[(TargetIonsColumn.SAMPLE, drug_sample.name)] > min_signal_threshold
        )

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
        bio_samples=analysis.config.bioSamples,
        drug_sample=analysis.config.drugSample,
        min_signal_threshold=analysis.config.minSignalThreshold,
        signal_enrichment_factor=analysis.config.signalEnrichmentFactor,
    )
    # drop rows that has id of nan
    targeted_ions_df = targeted_ions_df.dropna(subset=[TargetIonsColumn.ID])

    return spectra, targeted_ions_df, reaction_df
