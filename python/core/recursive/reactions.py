from pathlib import Path

import pandas as pd
from pydantic import BaseModel, Field


class ReactionData(BaseModel):
    reactant: str = Field(..., alias="First Reactant")
    product: str = Field(..., alias="First Product") 
    mzdiff: float = Field(..., alias="MW Difference")


def load_reactions_data() -> list[ReactionData]:
    """
    Load and parse the reactions data from the deduplicated_reactions.csv file.

    Returns:
        List[ReactionData]: A list of validated reaction data objects
    """
    folder = Path(__file__).parents[2] / "asset"
    reactions_df = pd.read_csv(folder / "deduplicated_reactions.csv")

    # Convert DataFrame to list of ReactionData objects
    reactions = [
        ReactionData(**row) for row in reactions_df.to_dict("records")
    ]
    return reactions


# Load reactions data on module import for direct use
reactions_data: list[ReactionData] = load_reactions_data()
