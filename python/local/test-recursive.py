import asyncio
import sys
import unittest
from pathlib import Path

from matchms import load_from_mgf

# Add python directory to Python path
current_dir = Path(__file__).resolve().parent
python_dir = current_dir.parent
sys.path.append(str(python_dir))

import pandas as pd
from core.recursive.run import RecursiveAnalysisConfig, RecursiveAnalyzer


class TestRecursiveAnalyzer(unittest.TestCase):
    async def asyncSetUp(self):
        ms2_spectra = load_from_mgf(current_dir / "data/test.mgf")
        ms1_df = pd.read_parquet(current_dir / "data/test.parquet")

        self.analyzer = RecursiveAnalyzer(
            config=RecursiveAnalysisConfig(),
            ms2_spectra=ms2_spectra,
            ms1_df=ms1_df,
            seed_metabolites=[str(ms1_df["id"].iloc[2])],
        )

    def setUp(self):
        # Run async setup
        asyncio.run(self.asyncSetUp())

    def test_analyze(self):
        async def run_test():
            # Get results
            neighbors_df, products = await self.analyzer.analyze()
            print(f"neighbors_df: {neighbors_df}")
            print(f"products: {products}")

            # Basic checks
            self.assertIsInstance(neighbors_df, pd.DataFrame)
            self.assertIsInstance(products, list)

        # Run the async test
        asyncio.run(run_test())


if __name__ == "__main__":
    unittest.main()
