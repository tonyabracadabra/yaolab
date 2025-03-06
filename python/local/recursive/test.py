import argparse
import asyncio
import io
import sys
import unittest
from pathlib import Path

from matchms.importing import load_from_mgf
from matchms.Spectrum import Spectrum

# Add python directory to Python path
current_dir = Path(__file__).resolve().parent
python_dir = current_dir.parent
sys.path.append(str(python_dir))

import pandas as pd
from core.models.analysis import MSTool
from core.preprocess import preprocess_targeted_ions_file
from core.recursive.run import RecursiveAnalysisConfig, RecursiveAnalyzer


def load_ms1_data(file_path: Path) -> pd.DataFrame:
    """Load and preprocess MS1 data with index fixing through temporary parquet.

    Args:
        file_path: Path to the MS1 data file

    Returns:
        pd.DataFrame: Processed MS1 data with correct index and column structure
    """
    # Load and preprocess MS1 data
    with open(file_path, "rb") as f:
        ms1_data = f.read()

    # Process MS1 data using MSDIAL preprocessor
    ms1_df, _ = preprocess_targeted_ions_file(ms1_data, MSTool.MSDial)

    # Reset index to make sure we have a clean index
    ms1_df = ms1_df.reset_index(drop=True)

    # Use BytesIO buffer for parquet conversion
    buffer = io.BytesIO()
    ms1_df.to_parquet(buffer, index=True)
    buffer.seek(0)  # Reset buffer's pointer to the beginning

    # Read back from buffer
    ms1_df = pd.read_parquet(buffer)

    # Convert columns to regular Index instead of MultiIndex
    if isinstance(ms1_df.columns, pd.MultiIndex):
        ms1_df.columns = [
            col[1] if col[0] == "" else f"{col[0]}_{col[1]}" for col in ms1_df.columns
        ]

    return ms1_df


class TestRecursiveAnalyzer(unittest.TestCase):
    async def asyncSetUp(self):
        # Load MS2 spectra from MGF file
        ms2_spectra: list[Spectrum] = list(
            load_from_mgf(
                str(
                    current_dir.parent.parent / "asset/test/S2_FreshGinger_MS2_File.mgf"
                )
            )
        )

        # Load MS1 data using the new function
        ms1_df = load_ms1_data(
            current_dir.parent.parent / "asset/test/S2_FreshGinger_MS1_List.txt"
        )

        # Initialize the analyzer with the first metabolite as seed
        self.analyzer = RecursiveAnalyzer(
            config=RecursiveAnalysisConfig(),
            ms2_spectra=ms2_spectra,
            ms1_df=ms1_df,
            seed_metabolites=[
                str(ms1_df["id"].iloc[0])  # Now using regular column name
            ],  # Using the first metabolite as seed
        )

    def setUp(self):
        # Run async setup
        asyncio.run(self.asyncSetUp())

    def test_analyze(self):
        async def run_test():
            # Get results
            network_data = self.analyzer.explore_metabolic_network()
            print(f"neighbors_df: {network_data.neighbors_df}")
            print(
                f"n products: {len(network_data.products)} on {len(network_data.node_products_map)} nodes"
            )
            print(
                "matched ms1 ions",
                self.analyzer.ms1_df[
                    self.analyzer.ms1_df["id"]
                    .astype(str)
                    .isin(network_data.node_products_map.keys())
                ].head(),
            )
            # Basic checks
            self.assertIsInstance(network_data.neighbors_df, pd.DataFrame)
            self.assertIsInstance(network_data.products, list)

            # Additional assertions to verify the results
            self.assertGreater(
                len(network_data.neighbors_df), 0, "Should find at least one neighbor"
            )
            self.assertGreater(
                len(network_data.products), 0, "Should find at least one product"
            )

        # Run the async test
        asyncio.run(run_test())


async def run_analysis(ms1_file: Path, ms2_file: Path):
    """Run the analysis with specified MS1 and MS2 files.

    Args:
        ms1_file (Path): Path to the MS1 data file
        ms2_file (Path): Path to the MS2 MGF file
    """
    # Load MS2 spectra
    ms2_spectra: list[Spectrum] = list(load_from_mgf(str(ms2_file)))
    print(f"Loaded {len(ms2_spectra)} MS2 spectra")

    # Load MS1 data
    ms1_df = load_ms1_data(ms1_file)
    print(f"Loaded {len(ms1_df)} MS1 features")

    # Initialize analyzer
    analyzer = RecursiveAnalyzer(
        config=RecursiveAnalysisConfig(),
        ms2_spectra=ms2_spectra,
        ms1_df=ms1_df,
        seed_metabolites=[str(ms1_df["id"].iloc[0])],
    )

    # Run analysis
    network_data = analyzer.explore_metabolic_network()

    # Print results
    print(f"neighbors_df: {network_data.neighbors_df}")
    print(
        f"n products: {len(network_data.products)} on {len(network_data.node_products_map)} nodes"
    )
    print(
        "matched ms1 ions",
        analyzer.ms1_df[
            analyzer.ms1_df["id"]
            .astype(str)
            .isin(network_data.node_products_map.keys())
        ].head(),
    )


def main():
    parser = argparse.ArgumentParser(
        description="Run recursive analysis on MS1 and MS2 data"
    )
    parser.add_argument("--test", action="store_true", help="Run unit tests")
    parser.add_argument("--ms1", type=str, help="Path to MS1 data file")
    parser.add_argument("--ms2", type=str, help="Path to MS2 MGF file")

    args = parser.parse_args()

    if args.test:
        # Run unit tests
        unittest.main(argv=["dummy"])
    elif args.ms1 and args.ms2:
        # Run analysis with provided files
        asyncio.run(run_analysis(Path(args.ms1), Path(args.ms2)))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
