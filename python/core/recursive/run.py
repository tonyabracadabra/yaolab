import logging
import os
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Any, Dict, List, NamedTuple, Optional, TypeAlias

import networkx as nx
import numpy as np
import pandas as pd
from core.recursive.reactions import ReactionData, reactions_data
from core.utils.constants import SCANS_KEY, TargetIonsColumn
from matchms import calculate_scores
from matchms.similarity import ModifiedCosine
from matchms.Spectrum import Spectrum
from numba import jit
from pydantic import BaseModel, Field
from tqdm import tqdm

# Enhanced logging setup
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create a custom formatter
formatter = logging.Formatter(
    "[%(asctime)s] %(levelname)-8s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
)

# Add console handler if not already present
if not logger.handlers:
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

# Type aliases for better readability
NodeId: TypeAlias = str
Products: TypeAlias = list[str]
NeighborProductsMap: TypeAlias = dict[NodeId, Products]


@dataclass
class NetworkData:
    """Data structure for network visualization."""

    nodes: List[Dict[str, Any]]  # List of nodes with their attributes
    edges: List[Dict[str, Any]]  # List of edges with their attributes
    neighbors_df: pd.DataFrame
    products: List[str]
    node_products_map: Dict[str, List[str]]


class AnalysisConstants:
    """Constants used in the recursive metabolic network analysis."""

    DEFAULT_MAX_ITERATIONS: int = 3
    MODCOS_THRESHOLD: float = 0.7
    DELTA_MZ_THRESHOLD: float = 0.01
    TOLERANCE: float = 0.005
    DEFAULT_SEED_SIZE: int = 10
    MAX_BATCH_SIZE: int = 100
    MAX_WORKERS: int = 32


@jit(nopython=True)
def _build_mz_diff_matrix_fast(mz_array: np.ndarray) -> np.ndarray:
    """JIT-compiled function to build mass difference matrix efficiently.

    Args:
        mz_array: Array of m/z values

    Returns:
        Matrix of pairwise mass differences
    """
    n = len(mz_array)
    mz_diff_matrix = np.zeros((n, n), dtype=np.float32)

    for i in range(n):
        # Compute differences for upper triangle only
        j_indices = np.arange(i, n)
        diffs = np.abs(mz_array[j_indices] - mz_array[i])
        mz_diff_matrix[i, j_indices] = diffs
        mz_diff_matrix[j_indices, i] = diffs  # Mirror the values

    return mz_diff_matrix


@jit(nopython=True)
def _find_matching_reactions_fast(
    mz_diff: float,
    reaction_mz_diffs: np.ndarray,
    reaction_indices: np.ndarray,
    delta_mz_threshold: float,
) -> np.ndarray:
    """JIT-compiled function to find matching reactions efficiently.

    Args:
        mz_diff: Mass difference to match
        reaction_mz_diffs: Array of reaction mass differences
        reaction_indices: Array of indices for valid reactions
        delta_mz_threshold: Threshold for mass difference matching

    Returns:
        Array of indices of matching reactions
    """
    matches = np.abs(reaction_mz_diffs - mz_diff) <= delta_mz_threshold
    return reaction_indices[matches]


@dataclass
class ProcessingResult:
    """Result from processing a batch of nodes."""

    new_neighbors: set[NodeId]
    neighbor_products: NeighborProductsMap
    processed_nodes: set[NodeId]


class BatchData(NamedTuple):
    """Data structure for batch processing."""

    node_batch: list[tuple[NodeId, float, np.ndarray]]
    mz_array: np.ndarray
    id_array: np.ndarray
    reactions: list[ReactionData]
    delta_mz_threshold: float
    spectrum_lookup: dict[NodeId, Spectrum]
    modcos_threshold: float
    tolerance: float
    visited_nodes: set[NodeId]
    mz_diff_matrix: np.ndarray
    id_to_index: dict[str, int]
    reaction_mz_diffs: np.ndarray  # New field for reaction mass differences
    reaction_indices: np.ndarray  # New field for reaction indices


def process_mass_differences(
    mz_diff: float,
    reactions: list[ReactionData],
    delta_mz_threshold: float,
) -> tuple[ReactionData, ...]:
    """Find reactions matching a mass difference within threshold.

    Args:
        mz_diff: Mass difference to match
        reactions: List of possible reactions
        delta_mz_threshold: Threshold for mass difference matching

    Returns:
        Tuple of matching reactions
    """
    return tuple(
        reaction
        for reaction in reactions
        if abs(reaction.mzdiff - mz_diff) <= delta_mz_threshold
    )


def calculate_modcos_scores(
    source_spectrum: Spectrum,
    target_spectra: list[Spectrum],
    modcos_threshold: float,
    tolerance: float,
) -> list[tuple[int, float]]:
    """Calculate ModifiedCosine scores between spectra.

    Args:
        source_spectrum: Source spectrum to compare
        target_spectra: List of target spectra
        modcos_threshold: Threshold for similarity scores
        tolerance: Tolerance for mass matching

    Returns:
        List of (index, score) tuples for scores above threshold
    """
    if not target_spectra:
        return []

    similarity_measure = ModifiedCosine(tolerance=tolerance)
    scores = calculate_scores(
        [source_spectrum],
        target_spectra,
        similarity_measure,
        is_symmetric=False,
    )

    filtered_scores = [
        (i, score)
        for i, score in enumerate(scores.scores.data["ModifiedCosine_score"])
        if score >= modcos_threshold
    ]

    if logger.isEnabledFor(logging.DEBUG):
        total_nodes = len(target_spectra)
        retained_nodes = len(filtered_scores)
        retention_percentage = (
            (retained_nodes / total_nodes * 100) if total_nodes > 0 else 0
        )
        logger.debug(
            f"ModCos filtering stats: retained={retained_nodes}, total={total_nodes}, "
            f"retention_rate={retention_percentage:.1f}%, threshold={modcos_threshold}"
        )

    return filtered_scores


def process_node_batch(batch_data: BatchData) -> ProcessingResult:
    """Process a batch of nodes to find their neighbors.

    Args:
        batch_data: Batch data containing all necessary information

    Returns:
        ProcessingResult containing new neighbors and their products
    """
    batch_neighbors = set()
    neighbor_products: NeighborProductsMap = {}
    processed_nodes = set()

    for current_node, _, unvisited_indices in batch_data.node_batch:
        # Get pre-computed mass differences for the current node
        node_idx = batch_data.id_to_index[current_node]
        mass_differences = batch_data.mz_diff_matrix[node_idx, unvisited_indices]
        potential_neighbors: NeighborProductsMap = {}

        # Find potential neighbors based on mass differences using vectorized operations
        for mz_diff, target_id in zip(
            mass_differences, batch_data.id_array[unvisited_indices]
        ):
            if target_id in batch_data.visited_nodes:
                continue

            # Use the JIT-compiled function to find matching reactions
            matching_indices = _find_matching_reactions_fast(
                float(mz_diff),
                batch_data.reaction_mz_diffs,
                batch_data.reaction_indices,
                batch_data.delta_mz_threshold,
            )

            if len(matching_indices) > 0:
                products = []
                for idx in matching_indices:
                    products.extend(batch_data.reactions[idx].products)
                potential_neighbors[target_id] = products

        # Validate neighbors using ModCos scores
        if potential_neighbors and current_node in batch_data.spectrum_lookup:
            source_spectrum = batch_data.spectrum_lookup[current_node]
            target_ids = list(potential_neighbors.keys())
            target_spectra = [
                batch_data.spectrum_lookup[target_id]
                for target_id in target_ids
                if target_id in batch_data.spectrum_lookup
            ]

            for i, _ in calculate_modcos_scores(
                source_spectrum,
                target_spectra,
                batch_data.modcos_threshold,
                batch_data.tolerance,
            ):
                neighbor_id = target_ids[i]
                if neighbor_id not in batch_data.visited_nodes:
                    batch_neighbors.add(neighbor_id)
                    neighbor_products[neighbor_id] = potential_neighbors[neighbor_id]

        processed_nodes.add(current_node)

    return ProcessingResult(batch_neighbors, neighbor_products, processed_nodes)


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
    tolerance: float = Field(
        default=AnalysisConstants.TOLERANCE,
        description="Tolerance for mass matching in spectral similarity calculation",
    )
    seed_size: int = Field(
        default=AnalysisConstants.DEFAULT_SEED_SIZE,
        description="Number of initial seed metabolites to start with",
    )
    batch_size: int = Field(
        default=AnalysisConstants.MAX_BATCH_SIZE,
        description="Maximum size of node batches for parallel processing",
    )
    max_workers: int = Field(
        default=AnalysisConstants.MAX_WORKERS,
        description="Maximum number of parallel workers for processing",
    )


class RecursiveAnalyzer(BaseModel):
    """Analyzer for recursive metabolic network analysis."""

    config: RecursiveAnalysisConfig
    ms2_spectra: list[Spectrum]
    ms1_df: pd.DataFrame
    seed_metabolites: Optional[list[NodeId]] = None
    spectrum_lookup: dict[NodeId, Spectrum] = Field(default_factory=dict)
    mz_array: np.ndarray = Field(default=None, exclude=True)
    id_array: np.ndarray = Field(default=None, exclude=True)
    batch_size: int = Field(default=1000, exclude=True)
    reactions: list[ReactionData] = Field(default_factory=list, exclude=True)
    # New fields for mz difference matrix
    mz_diff_matrix: np.ndarray = Field(default=None, exclude=True)
    id_to_index: dict[str, int] = Field(default_factory=dict, exclude=True)
    # New fields for reaction matching optimization
    reaction_mz_diffs: np.ndarray = Field(default=None, exclude=True)
    reaction_indices: np.ndarray = Field(default=None, exclude=True)

    class Config:
        arbitrary_types_allowed = True

    def __init__(self, **data):
        super().__init__(**data)
        self.reactions = reactions_data
        self._build_spectrum_lookup()
        self._prepare_arrays()
        self._build_mz_diff_matrix()
        self._prepare_reaction_arrays()

    def _prepare_arrays(self) -> None:
        """Prepare numpy arrays for faster mass difference calculations."""
        self.mz_array = self.ms1_df[TargetIonsColumn.MZ].to_numpy()
        self.id_array = self.ms1_df[TargetIonsColumn.ID].astype(str).to_numpy()

    def _build_spectrum_lookup(self) -> None:
        """Build a lookup dictionary for quick spectrum access by scan ID."""
        self.spectrum_lookup = {
            str(spectrum.metadata[SCANS_KEY]): spectrum for spectrum in self.ms2_spectra
        }

    def _prepare_reaction_arrays(self) -> None:
        """Prepare arrays for optimized reaction matching."""
        self.reaction_mz_diffs = np.array(
            [r.mzdiff for r in self.reactions], dtype=np.float32
        )
        self.reaction_indices = np.arange(len(self.reactions), dtype=np.int32)

    def _build_mz_diff_matrix(self) -> None:
        """Build a pre-computed mass difference matrix and id-to-index mapping."""
        self.id_to_index = {id_: idx for idx, id_ in enumerate(self.id_array)}
        self.mz_diff_matrix = _build_mz_diff_matrix_fast(self.mz_array)

    def _get_mass_differences(self, node_id: str) -> tuple[np.ndarray, np.ndarray]:
        """Get pre-computed mass differences for a given node ID.

        Args:
            node_id: The ID of the node to get mass differences for

        Returns:
            Tuple of (mass differences array, corresponding node IDs array)
        """
        if node_id not in self.id_to_index:
            return np.array([]), np.array([])

        node_idx = self.id_to_index[node_id]
        return self.mz_diff_matrix[node_idx], self.id_array

    def _prepare_node_batches(
        self, nodes: list[NodeId], visited_nodes: set[NodeId]
    ) -> list[tuple[NodeId, float, np.ndarray]]:
        """Prepare batches of nodes for processing.

        Args:
            nodes: List of nodes to process
            visited_nodes: Set of already visited nodes

        Returns:
            List of node batches with their mass and unvisited indices
        """
        node_batches = []
        for node_id in nodes:
            if node_id not in self.id_to_index:
                continue

            node_idx = self.id_to_index[node_id]
            current_mz = float(self.mz_array[node_idx])
            unvisited_mask = ~np.isin(self.id_array, list(visited_nodes | {node_id}))
            unvisited_indices = np.where(unvisited_mask)[0]

            if len(unvisited_indices) > 0:
                node_batches.append((node_id, current_mz, unvisited_indices))

        return node_batches

    def _initialize_seed_metabolites(self) -> None:
        """Initialize seed metabolites if not provided."""
        if self.seed_metabolites is None:
            self.seed_metabolites = (
                self.ms1_df.nlargest(self.config.seed_size, TargetIonsColumn.MZ)[
                    TargetIonsColumn.ID
                ]
                .astype(str)
                .tolist()
            )

    def _process_layer(
        self,
        nodes_to_process: set[NodeId],
        visited_nodes: set[NodeId],
        max_workers: int,
    ) -> tuple[set[NodeId], list[str], set[NodeId], dict[NodeId, list[str]]]:
        """Process a single layer of nodes.

        Args:
            nodes_to_process: Set of nodes to process in this layer
            visited_nodes: Set of already visited nodes
            max_workers: Maximum number of parallel workers

        Returns:
            Tuple of (new neighbors, products, processed nodes, neighbor products map)
        """
        current_layer_nodes = list(nodes_to_process.copy())
        node_batches = self._prepare_node_batches(current_layer_nodes, visited_nodes)

        if not node_batches:
            return set(), [], set(), {}

        batch_size = max(
            1, min(len(node_batches) // max_workers, self.config.batch_size)
        )

        all_neighbors = set()
        all_products = []
        processed_nodes = set()
        neighbor_products_map: dict[NodeId, list[str]] = {}

        with ProcessPoolExecutor(max_workers=self.config.max_workers) as executor:
            futures = []
            common_data = BatchData(
                node_batch=[],  # Will be replaced for each batch
                mz_array=self.mz_array,
                id_array=self.id_array,
                reactions=self.reactions,
                delta_mz_threshold=self.config.delta_mz_threshold,
                spectrum_lookup=self.spectrum_lookup,
                modcos_threshold=self.config.modcos_threshold,
                tolerance=self.config.tolerance,
                visited_nodes=visited_nodes.copy(),
                mz_diff_matrix=self.mz_diff_matrix,
                id_to_index=self.id_to_index,
                reaction_mz_diffs=self.reaction_mz_diffs,
                reaction_indices=self.reaction_indices,
            )

            for i in range(0, len(node_batches), batch_size):
                batch = node_batches[i : i + batch_size]
                batch_data = common_data._replace(node_batch=batch)
                futures.append(executor.submit(process_node_batch, batch_data))

            for future in as_completed(futures):
                result = future.result()
                valid_neighbors = result.new_neighbors - visited_nodes
                all_neighbors.update(valid_neighbors)
                processed_nodes.update(result.processed_nodes)

                # Update neighbor_products_map with products from this batch
                for neighbor_id, products in result.neighbor_products.items():
                    if neighbor_id in valid_neighbors:
                        if neighbor_id not in neighbor_products_map:
                            neighbor_products_map[neighbor_id] = []
                        neighbor_products_map[neighbor_id].extend(products)
                        all_products.extend(products)

        # Deduplicate products for each neighbor
        for neighbor_id in neighbor_products_map:
            neighbor_products_map[neighbor_id] = list(
                set(neighbor_products_map[neighbor_id])
            )

        return all_neighbors, all_products, processed_nodes, neighbor_products_map

    def explore_metabolic_network(
        self, visited_nodes: Optional[set[NodeId]] = None
    ) -> NetworkData:
        """
        Find neighbors by filtering on mass difference and calculating ModCos scores.

        This method implements a parallel breadth-first search through the metabolic network,
        where each layer represents metabolites that are one reaction step away
        from the previous layer.

        Args:
            visited_nodes: Set of already visited node IDs

        Returns:
            NetworkData containing network information for visualization
        """
        visited_nodes = visited_nodes or set()
        self._initialize_seed_metabolites()

        # Initialize NetworkX graph for internal processing
        G = nx.Graph()

        # Add seed metabolites as initial nodes
        for seed_id in self.seed_metabolites:
            if seed_id in self.id_to_index:
                node_idx = self.id_to_index[seed_id]
                G.add_node(seed_id, mz=float(self.mz_array[node_idx]), layer=0)

        all_neighbors: set[NodeId] = set()
        all_products: list[str] = []
        node_products_map: dict[NodeId, list[str]] = {}
        nodes_to_process = set(self.seed_metabolites) - visited_nodes
        max_workers = min(AnalysisConstants.MAX_WORKERS, (os.cpu_count() or 1) * 2)

        current_layer = 0
        logger.info(
            f"Starting analysis with {len(self.seed_metabolites)} seed metabolites "
            f"(workers={max_workers}, modcos_threshold={self.config.modcos_threshold}, "
            f"delta_mz={self.config.delta_mz_threshold})"
        )

        with tqdm(
            total=self.config.max_iterations, desc="Processing network layers"
        ) as pbar:
            layer_stats = []
            while nodes_to_process and current_layer < self.config.max_iterations:
                current_layer += 1
                initial_nodes = len(nodes_to_process)
                logger.info(f"Layer {current_layer}: Processing {initial_nodes} nodes")

                new_neighbors, products, processed, layer_products_map = (
                    self._process_layer(nodes_to_process, visited_nodes, max_workers)
                )

                # Update NetworkX graph with new nodes and edges
                for neighbor_id in new_neighbors:
                    if neighbor_id in self.id_to_index:
                        node_idx = self.id_to_index[neighbor_id]
                        # Add the new neighbor node with its properties
                        G.add_node(
                            neighbor_id,
                            mz=float(self.mz_array[node_idx]),
                            layer=current_layer,
                        )

                        # Add edges between the neighbor and its source nodes
                        for source_node in nodes_to_process:
                            if source_node in processed:
                                # Get the products associated with this edge
                                edge_products = layer_products_map.get(neighbor_id, [])
                                G.add_edge(
                                    source_node,
                                    neighbor_id,
                                    products=edge_products,
                                    layer=current_layer,
                                )

                # Update node_products_map with the products for each neighbor
                node_products_map.update(layer_products_map)

                # Collect layer statistics
                layer_stat = {
                    "layer": current_layer,
                    "initial_nodes": initial_nodes,
                    "new_neighbors": len(new_neighbors),
                    "processed": len(processed),
                    "total_visited": len(visited_nodes),
                    "new_products": len(set(products)),
                }
                layer_stats.append(layer_stat)

                all_neighbors.update(new_neighbors)
                all_products.extend(products)
                visited_nodes.update(processed)
                nodes_to_process = new_neighbors

                logger.info(
                    f"Layer {current_layer} complete: processed={layer_stat['processed']}, "
                    f"new_neighbors={layer_stat['new_neighbors']}, "
                    f"new_products={layer_stat['new_products']}"
                )
                pbar.update(1)

            # Final summary log with layer-by-layer breakdown
            logger.info("Analysis complete - Layer summary:")
            for stat in layer_stats:
                logger.info(
                    f"  Layer {stat['layer']}: processed={stat['processed']}, "
                    f"new_neighbors={stat['new_neighbors']}, "
                    f"new_products={stat['new_products']}"
                )
            logger.info(
                f"Final network size: {len(visited_nodes)} nodes, "
                f"{len(all_neighbors)} total neighbors, "
                f"{len(set(all_products))} unique products, "
                f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges"
            )

            # Convert NetworkX graph to node and edge lists for visualization
            nodes = [{"id": node, **data} for node, data in G.nodes(data=True)]
            edges = [
                {"source": source, "target": target, **data}
                for source, target, data in G.edges(data=True)
            ]

            return NetworkData(
                nodes=nodes,
                edges=edges,
                neighbors_df=pd.DataFrame(
                    list(all_neighbors), columns=[TargetIonsColumn.ID]
                ),
                products=list(set(all_products)),
                node_products_map=node_products_map,
            )
