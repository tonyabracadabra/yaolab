import pandas as pd
import pyteomics.mass

# Read the existing Metabolic Reaction Database CSV file
def read_database(filename):
    try:
        database = pd.read_csv(filename)
    except FileNotFoundError:
        print("Metabolic Reaction Database.csv not found. Creating a new database.")
        database = pd.DataFrame(columns=['ID', 'Reaction Description', 'Mass Difference(Da)', 'Formula Change'])
    return database

# Prompt the user for new Reaction information
def input_reaction_info():
    formula_change = input("Enter Formula Change (e.g., H2O): ")
    reaction_description = input("Enter Reaction Description (max 30 characters): ")[:30]
    reaction_description = "User_" + reaction_description
    return formula_change, reaction_description

# Calculate Mass Difference(Da) value
def calculate_mass_difference(formula_change):
    return pyteomics.mass.calculate_mass(formula=formula_change, charge=0)

# Add the new Reaction to the database
def add_reaction_to_database(database, formula_change, reaction_description, mass_difference):
    next_id = database['ID'].max() + 1 if not database.empty else 1
    new_row = {'ID': next_id, 'Reaction Description': reaction_description,
               'Mass Difference(Da)': mass_difference, 'Formula Change': formula_change}
    database = database.append(new_row, ignore_index=True)
    return database

# Save the updated database to a CSV file
def save_database(database, filename):
    database.to_csv(filename, index=False)
    print("Database updated and saved.")

def main():
    database_filename = "F3-Metabolic Reaction Database.csv"
    database = read_database(database_filename)

    formula_change, reaction_description = input_reaction_info()
    mass_difference = calculate_mass_difference(formula_change)
    database = add_reaction_to_database(database, formula_change, reaction_description, mass_difference)

    save_database(database, database_filename)

if __name__ == "__main__":
    main()
