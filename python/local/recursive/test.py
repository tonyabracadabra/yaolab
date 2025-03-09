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
import numpy as np


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
        
        # Store MS1 data for parent m/z tests
        self.ms1_df = ms1_df
        self.ms2_spectra = ms2_spectra
        
        # Default parent m/z values
        self.default_parent_mz_values = [
            174.0528234,
            165.0789786,
            148.0524295,
            164.0473441,
            913.1519897,
            272.0684735
        ]

        # Initialize the analyzer with the default parent m/z list
        self.analyzer = RecursiveAnalyzer(
            config=RecursiveAnalysisConfig(
                parent_mz_list=self.default_parent_mz_values,
                parent_mz_error=0.01
            ),
            ms2_spectra=ms2_spectra,
            ms1_df=ms1_df,
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
        
    def test_parent_mz_filtering(self):
        async def run_test():
            # Use the default parent m/z values
            config = RecursiveAnalysisConfig(
                parent_mz_list=self.default_parent_mz_values,
                parent_mz_error=0.01
            )
            
            # Initialize analyzer with parent m/z filtering
            analyzer = RecursiveAnalyzer(
                config=config,
                ms2_spectra=self.ms2_spectra,
                ms1_df=self.ms1_df
            )
            
            # Check if seed metabolites were correctly selected
            seed_metabolites = analyzer._select_seed_metabolites()
            self.assertIsNotNone(seed_metabolites)
            
            # Print the number of seed metabolites found for each parent m/z
            print(f"Testing with {len(self.default_parent_mz_values)} parent m/z values:")
            for mz in self.default_parent_mz_values:
                mask = np.abs(analyzer.mz_array - mz) <= config.parent_mz_error
                match_count = np.sum(mask)
                print(f"  - Parent m/z {mz:.4f}: {match_count} matches")
            
            # Run analysis with parent m/z filtering
            network_data = analyzer.explore_metabolic_network()
            
            # Basic checks
            self.assertIsInstance(network_data.neighbors_df, pd.DataFrame)
            self.assertIsInstance(network_data.products, list)
            
            print(f"Parent m/z filtering - neighbors_df: {network_data.neighbors_df}")
            print(
                f"Parent m/z filtering - n products: {len(network_data.products)} on {len(network_data.node_products_map)} nodes"
            )
            
        # Run the async test
        asyncio.run(run_test())


async def run_analysis(ms1_file: Path, ms2_file: Path, parent_mz_list: list, parent_mz_error: float = 0.01):
    """Run the analysis with specified MS1 and MS2 files.

    Args:
        ms1_file (Path): Path to the MS1 data file
        ms2_file (Path): Path to the MS2 MGF file
        parent_mz_list (list): List of parent m/z values to use as seeds.
        parent_mz_error (float, optional): Maximum error threshold for matching parent m/z values. Defaults to 0.01.
    """
    # Load MS2 spectra
    ms2_spectra: list[Spectrum] = list(load_from_mgf(str(ms2_file)))
    print(f"Loaded {len(ms2_spectra)} MS2 spectra")

    # Load MS1 data
    ms1_df = load_ms1_data(ms1_file)
    print(f"Loaded {len(ms1_df)} MS1 features")

    # Create config with parent m/z filtering
    print(f"Using parent m/z filtering with {len(parent_mz_list)} values and error threshold {parent_mz_error}")
    
    # Initialize analyzer
    analyzer = RecursiveAnalyzer(
        config=RecursiveAnalysisConfig(
            parent_mz_list=parent_mz_list,
            parent_mz_error=parent_mz_error
        ),
        ms2_spectra=ms2_spectra,
        ms1_df=ms1_df,
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
    # Default parent m/z values
    default_parent_mz_values = [
        174.0528234,
        165.0789786,
        148.0524295,
        164.0473441,
        913.1519897,
        272.0684735
    ]
    
    parser = argparse.ArgumentParser(
        description="Run recursive analysis on MS1 and MS2 data"
    )
    parser.add_argument("--test", action="store_true", help="Run unit tests")
    parser.add_argument("--ms1", type=str, help="Path to MS1 data file")
    parser.add_argument("--ms2", type=str, help="Path to MS2 MGF file")
    parser.add_argument("--parent-mz", type=float, nargs="+", help="List of parent m/z values to use as seeds (defaults to predefined values if not provided)")
    parser.add_argument("--parent-mz-error", type=float, default=0.01, help="Maximum error threshold for matching parent m/z values")

    args = parser.parse_args()
    
    # Use default parent m/z values if none provided
    parent_mz_list = args.parent_mz if args.parent_mz else default_parent_mz_values

    if args.test:
        # For tests, we'll use the default parent m/z values
        # This is handled in the test class itself
        unittest.main(argv=["dummy"])
    elif args.ms1 and args.ms2:
        # Run analysis with provided files
        asyncio.run(run_analysis(
            Path(args.ms1), 
            Path(args.ms2),
            parent_mz_list=parent_mz_list,
            parent_mz_error=args.parent_mz_error
        ))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
