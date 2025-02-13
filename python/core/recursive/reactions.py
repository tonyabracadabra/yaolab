from pathlib import Path

import pandas as pd
from pydantic import BaseModel, Field


class ReactionData(BaseModel):
    reactants: list[str] = Field(..., alias="Reactants-Chemical Formula")
    products: list[str] = Field(..., alias="Products-Chemical Formula")
    mzdiff: float


def calculate_delta_mz(row: dict) -> float:
    """
    Calculate the mass difference (mzdiff) between products and reactants.

    Args:
        row (dict): A dictionary containing reaction data with molecular weights

    Returns:
        float: The mass difference (sum of product masses - sum of reactant masses)
    """
    try:
        reactants_mw_str = row["Reactants-Monoisotopic-Molecular-Weight"]
        products_mw_str = row["Products-Monoisotopic-Molecular-Weight"]

        if pd.isna(reactants_mw_str) or pd.isna(products_mw_str):
            return 0.0

        # Handle empty strings or missing data
        reactants_mw = []
        for mw in reactants_mw_str.split(" // "):
            try:
                if mw and not pd.isna(mw) and "d" in mw:
                    reactants_mw.append(float(mw.split("d")[0]))
            except (ValueError, IndexError):
                continue

        products_mw = []
        for mw in products_mw_str.split(" // "):
            try:
                if mw and not pd.isna(mw) and "d" in mw:
                    products_mw.append(float(mw.split("d")[0]))
            except (ValueError, IndexError):
                continue

        # Calculate total masses
        total_reactants_mass = sum(reactants_mw) if reactants_mw else 0.0
        total_products_mass = sum(products_mw) if products_mw else 0.0

        # Calculate mass difference (mzdiff)
        return total_products_mass - total_reactants_mass
    except Exception:
        # If anything goes wrong, return 0.0 to skip this reaction
        return 0.0


def _preprocess_reaction_row(row: dict) -> dict:
    """
    Preprocess a reaction row by splitting list fields on " // " and handling NaN values
    """
    # Calculate mzdiff first
    mzdiff = calculate_delta_mz(row)

    # Process formula fields
    formula_fields = [
        "Reactants-Chemical Formula",
        "Products-Chemical Formula",
    ]

    for field in formula_fields:
        if field in row:
            if pd.isna(row[field]):
                row[field] = []
            elif isinstance(row[field], str):
                # Split on " // " and filter out empty strings and whitespace-only strings
                row[field] = [
                    item.strip() for item in row[field].split(" // ") if item.strip()
                ]
            else:
                row[field] = []

    # Add mzdiff to the row
    row["mzdiff"] = mzdiff
    return row


def load_reactions_data() -> list[ReactionData]:
    """
    Load and parse the reactions data from the reactions.csv file.

    Returns:
        List[ReactionData]: A list of validated reaction data objects with properly parsed list fields
    """
    folder = Path(__file__).parents[2] / "asset"
    reactions_df = pd.read_csv(folder / "reactions.csv")

    # Convert DataFrame to list of dicts and preprocess each row
    reactions = [
        ReactionData(**_preprocess_reaction_row(row))
        for row in reactions_df.to_dict("records")
    ]
    return reactions


# Load reactions data on module import for direct use
reactions_data: list[ReactionData] = load_reactions_data()
