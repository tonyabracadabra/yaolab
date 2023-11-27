from dagster import asset
import pandas as pd
import pyteomics.mass

from pydantic import BaseModel

class ReactionInput(BaseModel):
    formula_change: str
    reaction_description: str

@asset
def update_metabolic_reaction_database(metabolic_reaction_df: pd.DataFrame, reaction_input: ReactionInput) -> pd.DataFrame:
    # Calculate mass difference
    mass_difference = pyteomics.mass.calculate_mass(reaction_input.formula_change)

    # Add reaction to database
    next_id = 1 if metabolic_reaction_df.empty else metabolic_reaction_df['ID'].max() + 1
    new_row = {
        'ID': next_id, 
        'Reaction Description': "User_" + reaction_input.reaction_description, 
        'Mass Difference(Da)': mass_difference, 
        'Formula Change': reaction_input.formula_change
    }

    return pd.concat([metabolic_reaction_df, pd.DataFrame([new_row])], ignore_index=True)
