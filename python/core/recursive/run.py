from typing import Optional

import pandas as pd
from core.recursive.reactions import ReactionData, reactions_data
from core.utils.constants import SCANS_KEY, TargetIonsColumn
from matchms import calculate_scores
from matchms.similarity import ModifiedCosine
from matchms.Spectrum import Spectrum
from pydantic import BaseModel, Field


# Constants
class AnalysisConstants:
    DEFAULT_MAX_ITERATIONS: int = 10
    MODCOS_THRESHOLD: float = 0.7
    DELTA_MZ_THRESHOLD: float = 0.01
    TOLERANCE: float = 0.005
    DEFAULT_SEED_SIZE: int = 10


class RecursiveAnalysisConfig(BaseModel):
    """Configuration for recursive metabolic network analysis."""

    modcos_threshold: float = Field(
        default=AnalysisConstants.MODCOS_THRESHOLD,
        description="Threshold for MS2 spectral similarity",
    )
    delta_mz_threshold: float = Field(
        default=AnalysisConstants.DELTA_MZ_THRESHOLD,
        description="Threshold for mass difference matching (in Da)",
    )
    max_iterations: int = Field(
        default=AnalysisConstants.DEFAULT_MAX_ITERATIONS,
        description="Maximum number of recursive iterations",
    )


class RecursiveAnalyzer(BaseModel):
    """Analyzer for recursive metabolic network analysis."""

    config: RecursiveAnalysisConfig
    ms2_spectra: list[Spectrum]
    ms1_df: pd.DataFrame
    seed_metabolites: Optional[list[str]] = None
    spectrum_lookup: dict[str, Spectrum] = Field(default_factory=dict)

    class Config:
        arbitrary_types_allowed = True

    def __init__(self, **data):
        super().__init__(**data)
        self._reactions: list[ReactionData] = reactions_data
        self._build_spectrum_lookup()

    def _build_spectrum_lookup(self) -> None:
        """Build a lookup dictionary for quick spectrum access by scan ID."""
        self.spectrum_lookup = {
            str(spectrum.metadata[SCANS_KEY]): spectrum for spectrum in self.ms2_spectra
        }

    def _filter_reactions_by_mass_diff(self, mass_diff: float) -> list[ReactionData]:
        """
        Filter reactions based on mass difference within the threshold.

        Args:
            mass_diff: The mass difference to match against reactions

        Returns:
            List of matching reactions within the threshold
        """
        return [
            reaction
            for reaction in self._reactions
            if abs(reaction.mzdiff - mass_diff) <= self.config.delta_mz_threshold
        ]

    def _calculate_modcos(
        self, source_id: str, target_ids: list[str]
    ) -> dict[str, float]:
        """
        Calculate ModifiedCosine scores between source spectrum and target spectra.

        Args:
            source_id: ID of the source spectrum
            target_ids: List of target spectrum IDs

        Returns:
            Dictionary mapping target IDs to their ModCos scores
        """
        if source_id not in self.spectrum_lookup:
            return {}

        source_spectrum = self.spectrum_lookup[source_id]
        target_spectra = [
            self.spectrum_lookup[target_id]
            for target_id in target_ids
            if target_id in self.spectrum_lookup
        ]

        if not target_spectra:
            return {}

        similarity_measure = ModifiedCosine(tolerance=AnalysisConstants.TOLERANCE)
        scores = calculate_scores(
            [source_spectrum],
            target_spectra,
            similarity_measure,
            is_symmetric=False,
        )

        return {
            target_ids[i]: score
            for i, score in enumerate(scores.scores.data["ModifiedCosine_score"])
            if score >= self.config.modcos_threshold
        }

    def _initialize_seed_metabolites(self) -> None:
        """Initialize seed metabolites if not provided."""
        if self.seed_metabolites is None:
            self.seed_metabolites = (
                self.ms1_df.nlargest(
                    AnalysisConstants.DEFAULT_SEED_SIZE, TargetIonsColumn.MZ
                )[TargetIonsColumn.ID]
                .astype(str)
                .tolist()
            )

    def find_neighbors(
        self,
        visited_nodes: Optional[set[str]] = None,
    ) -> tuple[pd.DataFrame, list[str]]:
        """
        Find neighbors by filtering on mass difference and calculating ModCos scores.

        Args:
            visited_nodes: Set of already visited node IDs

        Returns:
            Tuple containing:
            - DataFrame of validated neighbors
            - List of unique products from ReactionData
        """
        visited_nodes = visited_nodes or set()
        self._initialize_seed_metabolites()

        all_neighbors: set[str] = set()
        all_products: list[str] = []
        nodes_to_process = set(self.seed_metabolites) - visited_nodes

        while nodes_to_process and len(visited_nodes) < self.config.max_iterations:
            current_node = nodes_to_process.pop()
            if current_node in visited_nodes:
                continue

            current_mz = float(
                self.ms1_df[
                    self.ms1_df[TargetIonsColumn.ID].astype(str) == current_node
                ][TargetIonsColumn.MZ].iloc[0]
            )
            potential_neighbors: list[str] = []

            # Find potential neighbors based on mass differences
            for _, target_row in self.ms1_df.iterrows():
                target_id = str(target_row[TargetIonsColumn.ID])
                if target_id in visited_nodes or target_id == current_node:
                    continue

                mz_diff = float(target_row[TargetIonsColumn.MZ]) - current_mz
                matching_reactions = self._filter_reactions_by_mass_diff(mz_diff)

                if matching_reactions:
                    potential_neighbors.append(target_id)
                    all_products.extend(
                        reaction.products for reaction in matching_reactions
                    )

            if potential_neighbors:
                modcos_scores = self._calculate_modcos(
                    current_node, potential_neighbors
                )
                for neighbor_id in modcos_scores:
                    all_neighbors.add(neighbor_id)
                    nodes_to_process.add(neighbor_id)

            visited_nodes.add(current_node)

        return pd.DataFrame(list(all_neighbors), columns=[TargetIonsColumn.ID]), list(
            set(all_products)
        )

    async def analyze(self) -> tuple[pd.DataFrame, list[str]]:
        """
        Analyze the metabolic network using mass difference filtering and ModCos calculation.

        Returns:
            Tuple containing:
            - DataFrame of validated neighbors
            - List of unique products from ReactionData
        """
        return self.find_neighbors()
