import io
from io import BytesIO
from typing import Callable

import pandas as pd
from app.models.analysis import MSTool
from app.utils.constants import ID_COL, MSMS_COL, MZ_COL, RT_COL


def _preprocess_mzmine3(bytesIO: BytesIO) -> tuple[pd.DataFrame, list[str]]:
    df = pd.read_csv(bytesIO)
    # Generate a dictionary that maps original column names to new column names
    rename_dict = {col: col.split(".")[0] for col in df.columns if ".raw Peak" in col}

    # Drop columns with all NaN values
    df.dropna(axis=1, how="all", inplace=True)

    # Normalize column names
    df = df.rename(
        columns={
            "row m/z": MZ_COL,
            "row retention time": RT_COL,
            "row ID": ID_COL,
        }
        | rename_dict
    )

    sample_cols = list(rename_dict.values())

    return df, sample_cols


def _preprocess_mdial(bytesIO: BytesIO) -> tuple[pd.DataFrame, list[str]]:
    # Read the first row to get the columns with NA values
    na_cols_mask = pd.read_csv(bytesIO, sep="\t", nrows=1).columns.str.contains(
        "NA", na=False
    )
    bytesIO.seek(0)
    df = pd.read_csv(bytesIO, sep="\t", skiprows=4)
    # Drop the selected columns
    df = df.drop(
        df.columns[
            # Drop columns with NA values and columns with all NaN or empty values
            na_cols_mask
            | (df.isna() | (df == "")).all()
        ],
        axis=1,
    )

    # Normalize column names
    df = df.rename(
        columns={
            "Average Mz": MZ_COL,
            "Average Rt(min)": RT_COL,
            "Alignment ID": ID_COL,
        }
    )

    # all columns after MS/MS Spectrum are sample columns
    sample_cols = df.columns[df.columns.get_loc(MSMS_COL) + 1 :].tolist()

    return df, sample_cols


preprocessors: dict[MSTool, Callable[[BytesIO], tuple[pd.DataFrame, list[str]]]] = {
    MSTool.MZmine3: _preprocess_mzmine3,
    MSTool.MDial: _preprocess_mdial,
}


def preprocess_targeted_ions_file(
    blob: bytes, tool: MSTool
) -> tuple[pd.DataFrame, list[str]]:
    df, sample_cols = preprocessors[tool](io.BytesIO(blob))
    print(f"df: {df.columns}")
    print(f"sample_cols: {sample_cols}")
    # create multi-index columns for sample columns, tag them with 'sample'
    df.columns = pd.MultiIndex.from_tuples(
        [("sample" if col in sample_cols else "", col) for col in df.columns]
    )

    return df, sample_cols
