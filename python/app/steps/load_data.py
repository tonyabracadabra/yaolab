import asyncio

import pandas as pd
from app.models.analysis import Analysis, Experiment, MSTool, ReactionDatabase
from app.utils.contants import ID_COL, MZ_COL, RT_COL
from app.utils.convex import load_csv, load_mgf
from app.utils.logger import log
from matchms.Spectrum import Spectrum


async def _load_reaction_db(reaction_db: ReactionDatabase) -> pd.DataFrame:
    return pd.DataFrame([reaction.dict() for reaction in reaction_db.reactions])


def _preprocess_mzmine3(targeted_ions_df: pd.DataFrame) -> pd.DataFrame:
    sample_columns = targeted_ions_df.columns[
        targeted_ions_df.columns.str.contains(".raw Peak")
    ]
    actual_sample_names = [col.split(".")[0] for col in sample_columns]

    # Drop columns with all NaN values
    df = targeted_ions_df.dropna(axis=1, how='all')
    # Normalize column names
    df = df.rename(
        columns={
            "row m/z": MZ_COL,
            "row retention time": RT_COL,
            "row ID": ID_COL,
        }
        | dict(zip(sample_columns, actual_sample_names))
    )

    return df


def _preprocess_mdial(targeted_ions_df: pd.DataFrame) -> pd.DataFrame:
    # Drop rows and columns with all NaN values
    df = (
        targeted_ions_df.rename(
            columns=targeted_ions_df.iloc[3][
                : targeted_ions_df.columns.get_loc("Class") + 1
            ].to_dict()
        )
        .drop(targeted_ions_df.index[0:4])
        .drop([col for col in targeted_ions_df.columns if col.startswith("NA")], axis=1)
        .drop(
            targeted_ions_df.columns[
                targeted_ions_df.iloc[1:].isna().all()
                | targeted_ions_df.iloc[1:].eq("").all()
            ],
            axis=1,
        )
    )
    # Normalize column names
    df = df.rename(
        columns={
            "Average Mz": MZ_COL,
            "Average Rt(min)": RT_COL,
            "Alignment ID": ID_COL,
        }
    )

    return df


preprocessors: dict[MSTool, callable] = {
    MSTool.MZmine3: _preprocess_mzmine3,
    MSTool.MDial: _preprocess_mdial,
}


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
    targeted_ions_df = preprocessors[analysis.rawFile.tool](targeted_ions_df)

    targeted_ions_df = _filter_metabolites(
        data=targeted_ions_df,
        experiments=analysis.config.experiments,
        minSignalThreshold=analysis.config.minSignalThreshold,
        signalEnrichmentFactor=analysis.config.signalEnrichmentFactor,
    )

    return spectra, targeted_ions_df, reaction_df
