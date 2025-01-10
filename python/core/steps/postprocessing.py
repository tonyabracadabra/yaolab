import pandas as pd
from core.models.analysis import BioSample, DrugSample
from core.utils.constants import SCANS_KEY, EdgeColumn, TargetIonsColumn
from core.utils.logger import log
from matchms.Spectrum import Spectrum
from pydantic import BaseModel


class MSMSPeak(BaseModel):
    mz: float
    intensity: float


def _create_msms_spectrum(spectrum: Spectrum) -> list[MSMSPeak]:
    """Convert matchms Spectrum to MSMSSpectrum model"""
    peaks = [
        MSMSPeak(mz=float(mz), intensity=float(intensity))
        for mz, intensity in zip(spectrum.peaks.mz, spectrum.peaks.intensities)
    ]

    return peaks


def _add_msms_data(nodes: pd.DataFrame, spectra: list[Spectrum]) -> pd.DataFrame:
    """
    Add MSMS data to nodes DataFrame.

    Args:
        nodes: DataFrame containing node information
        spectra: List of matchms Spectrum objects

    Returns:
        DataFrame with added MSMS spectrum information
    """
    # Get IDs from targeted ions
    ids = nodes[TargetIonsColumn.ID].values
    id_to_index = {id_: index for index, id_ in enumerate(ids)}

    # Create a mapping of ID to MSMS spectrum using the same approach as create_similarity_matrix
    msms_map = {}
    for spectrum in spectra:
        spectrum_id = int(spectrum.metadata[SCANS_KEY])
        if spectrum_id in id_to_index:
            msms_map[spectrum_id] = _create_msms_spectrum(spectrum)

    # Add MSMS data to nodes
    nodes[TargetIonsColumn.MSMS_SPECTRUM] = nodes[TargetIonsColumn.ID].map(msms_map)

    # Convert NaN to None for JSON serialization
    nodes[TargetIonsColumn.MSMS_SPECTRUM] = nodes[TargetIonsColumn.MSMS_SPECTRUM].where(
        pd.notna(nodes[TargetIonsColumn.MSMS_SPECTRUM]), None
    )

    return nodes


@log("post processing")
async def postprocessing(
    targeted_ions_df: pd.DataFrame,
    spectra: list[Spectrum],
    samples_df: pd.DataFrame,
    edges: pd.DataFrame,
    bio_samples: list[BioSample],
    drug_sample: DrugSample | None,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    nodes: pd.DataFrame = pd.concat([targeted_ions_df, samples_df], axis=1)
    # filter out nodes that are not in the edges
    nodes = nodes[
        nodes[TargetIonsColumn.ID].isin(
            edges[[EdgeColumn.ID1, EdgeColumn.ID2]].values.flatten()
        )
    ]

    # Calculate ratios
    exps = [e.name for e in bio_samples]
    if drug_sample:
        exps.append(drug_sample.name)
    ratios = [exp + "_ratio" for exp in exps]
    nodes[ratios] = nodes[exps].div(nodes[exps].sum(axis=1), axis=0)

    # Add MSMS data
    nodes = _add_msms_data(nodes, spectra)

    return edges, nodes
