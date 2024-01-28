import os

import pandas as pd
from matchms.importing import load_from_mgf
from matchms.Spectrum import Spectrum
from app.utils.convex import download_file
from app.models.analysis import Task
import tempfile

from .update_metabolic_reaction_database import ReactionInput

current_dir = os.path.dirname(__file__)


def load_data(task: Task) -> (
    tuple[list[Spectrum], pd.DataFrame, pd.DataFrame, ReactionInput]
):
    raw_file = download_file(task.rawFile.file)
    reaction_db = download_file(task.reactionDatabase.file)

    # Create a temporary file to save the content
    with tempfile.NamedTemporaryFile(suffix=".mgf", delete=False) as temp_file:
        temp_file.write(raw_file)
        temp_file_path = temp_file.name

    # Load the file with load_from_mgf
    spectra = load_from_mgf(temp_file_path)

    # Create a temporary file to save the content
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as temp_file:
        temp_file.write(reaction_db)
        temp_file_path = temp_file.name

    # Load the file with load_from_mgf
    metabolic_reaction_df = pd.read_csv(temp_file_path)

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
