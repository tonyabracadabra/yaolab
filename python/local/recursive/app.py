import io
from pathlib import Path
from typing import Dict, List, NamedTuple, Optional, Set, Tuple

import gradio as gr
import matplotlib.pyplot as plt
import networkx as nx
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from core.models.analysis import MSTool
from core.preprocess import preprocess_targeted_ions_file
from core.recursive.run import RecursiveAnalysisConfig, RecursiveAnalyzer
from matchms.importing import load_from_mgf


class LayerStats(NamedTuple):
    """Statistics for each network layer."""

    layer: int
    initial_nodes: int
    new_neighbors: int
    processed: int
    total_visited: int
    new_products: int


class DataLoader:
    """Handles data loading and preprocessing operations."""

    @staticmethod
    def load_ms1_data(file_path: Path) -> pd.DataFrame:
        """Load and preprocess MS1 data with index fixing through temporary parquet."""
        with open(file_path, "rb") as f:
            ms1_data = f.read()

        ms1_df, _ = preprocess_targeted_ions_file(ms1_data, MSTool.MSDial)
        ms1_df = ms1_df.reset_index(drop=True)

        buffer = io.BytesIO()
        ms1_df.to_parquet(buffer, index=True)
        buffer.seek(0)
        ms1_df = pd.read_parquet(buffer)

        if isinstance(ms1_df.columns, pd.MultiIndex):
            ms1_df.columns = [
                col[1] if col[0] == "" else f"{col[0]}_{col[1]}"
                for col in ms1_df.columns
            ]

        return ms1_df

    @staticmethod
    def load_ms2_data(file_path: Path) -> List:
        """Load MS2 spectra from MGF file."""
        return list(load_from_mgf(str(file_path)))


class NetworkVisualizer:
    """Handles network visualization and updates."""

    def __init__(self):
        self.G = nx.Graph()
        self.pos = None
        self.node_colors = {}
        self.node_sizes = {}
        self.layer_nodes = {}
        self.all_edges = []

    def update_graph(
        self, nodes: List[str], edges: List[Tuple[str, str]], current_layer: int
    ) -> None:
        """Update graph with new nodes and edges, tracking layer information."""
        # Add new nodes and track their layer
        new_nodes = set(nodes) - set(self.G.nodes())
        self.G.add_nodes_from(nodes)
        self.layer_nodes[current_layer] = new_nodes

        # Update node colors and sizes based on layer
        for node in new_nodes:
            self.node_colors[node] = f"C{current_layer - 1}"
            self.node_sizes[node] = 800 - (current_layer * 50)

        # Filter and add valid edges
        valid_edges = [
            (src, tgt)
            for src, tgt in edges
            if src in self.G.nodes() and tgt in self.G.nodes()
        ]
        self.G.add_edges_from(valid_edges)
        self.all_edges.extend(valid_edges)

        # Update layout if needed
        if self.pos is None or len(new_nodes) > 0:
            self.pos = nx.spring_layout(
                self.G,
                k=1.5,
                iterations=50,
                pos=self.pos,
                weight=None,
                fixed=None if self.pos is None else list(self.G.nodes() - new_nodes),
            )

    def draw_graph(self, layer_num: int, stats: LayerStats) -> plt.Figure:
        """Draw the network graph with layer information and statistics."""
        plt.ioff()  # Turn off interactive mode
        fig = plt.figure(figsize=(16, 8), dpi=100, facecolor="white")
        fig.patch.set_facecolor("white")

        # Network graph subplot
        ax1 = plt.subplot2grid((1, 5), (0, 0), colspan=3)
        ax1.set_facecolor("white")

        # Draw valid edges first (lowest visual layer)
        valid_edges = [
            (src, tgt)
            for src, tgt in self.all_edges
            if src in self.pos and tgt in self.pos
        ]
        if valid_edges:
            edge_pos = np.asarray(
                [(self.pos[e[0]], self.pos[e[1]]) for e in valid_edges]
            )
            ax1.plot(
                edge_pos[:, :, 0].T,
                edge_pos[:, :, 1].T,
                "-",
                color="gray",
                alpha=0.5,
                linewidth=1,
            )

        # Draw nodes layer by layer (middle visual layer)
        for layer in range(1, layer_num + 1):
            layer_nodes = list(self.layer_nodes.get(layer, set()))
            if layer_nodes:
                valid_nodes = [n for n in layer_nodes if n in self.pos]
                if valid_nodes:
                    nx.draw_networkx_nodes(
                        self.G,
                        self.pos,
                        nodelist=valid_nodes,
                        node_color=f"C{layer - 1}",
                        node_size=[self.node_sizes[n] for n in valid_nodes],
                        alpha=0.7,
                        label=f"Layer {layer}",
                        ax=ax1,
                    )

        # Draw labels (top visual layer)
        valid_nodes = {n: p for n, p in self.pos.items() if n in self.G.nodes()}
        if valid_nodes:
            nx.draw_networkx_labels(
                self.G, valid_nodes, font_size=8, font_weight="bold", ax=ax1
            )

        # Add title and legend for network graph
        ax1.set_title(f"Network Evolution - Layer {layer_num}", fontsize=14, pad=20)
        legend = ax1.legend(
            loc="center left",
            bbox_to_anchor=(1, 0.5),
            frameon=True,
            facecolor="white",
            edgecolor="gray",
            fontsize=10,
        )

        # Remove axis for network plot
        ax1.set_xticks([])
        ax1.set_yticks([])

        # Statistics visualization subplot
        ax2 = plt.subplot2grid((1, 5), (0, 3), colspan=2)
        ax2.set_facecolor("white")

        # Create bar chart for statistics
        metrics = [
            "Initial Nodes",
            "New Neighbors",
            "Processed",
            "Total Visited",
            "New Products",
        ]
        values = [
            stats.initial_nodes,
            stats.new_neighbors,
            stats.processed,
            stats.total_visited,
            stats.new_products,
        ]
        colors = ["#2ecc71", "#3498db", "#e74c3c", "#f1c40f", "#9b59b6"]

        bars = ax2.bar(metrics, values, color=colors)
        ax2.set_title(f"Layer {stats.layer} Statistics", fontsize=14, pad=20)
        ax2.tick_params(axis="x", rotation=45, labelsize=8)
        ax2.tick_params(axis="y", labelsize=8)
        ax2.grid(True, axis="y", linestyle="--", alpha=0.3)

        # Add value labels on top of bars
        for bar in bars:
            height = bar.get_height()
            ax2.text(
                bar.get_x() + bar.get_width() / 2.0,
                height,
                f"{int(height)}",
                ha="center",
                va="bottom",
                fontsize=8,
            )

        # Adjust layout
        plt.tight_layout()
        return fig


class MS1Visualizer:
    """Handles MS1 data visualization."""

    @staticmethod
    def create_visualization(
        ms1_df: pd.DataFrame, node_products_map: Dict
    ) -> go.Figure:
        """Create an interactive MS1 visualization with product information."""
        # Prepare hover text with product information
        hover_text = []
        for idx, row in ms1_df.iterrows():
            ion_id = str(row["id"])
            products = node_products_map.get(ion_id, [])
            product_text = "<br>".join(products) if products else "No products found"
            hover_text.append(
                f"ID: {ion_id}<br>"
                f"m/z: {row['mz']:.4f}<br>"
                f"RT: {row['rt']:.2f}<br>"
                f"Products:<br>{product_text}"
            )

        # Create the scatter plot
        fig = go.Figure()

        fig.add_trace(
            go.Scatter(
                x=ms1_df["rt"],
                y=ms1_df["mz"],
                mode="markers",
                marker=dict(
                    size=8,
                    color=ms1_df["area"] if "area" in ms1_df.columns else None,
                    colorscale="Viridis",
                    showscale=True,
                    colorbar=dict(title="Area"),
                ),
                text=hover_text,
                hoverinfo="text",
                name="MS1 Data",
            )
        )

        # Update layout with better configuration for Gradio
        fig.update_layout(
            title=dict(text="MS1 Data Visualization", x=0.5, xanchor="center"),
            xaxis=dict(
                title="Retention Time (min)",
                showgrid=True,
                gridwidth=1,
                gridcolor="rgba(0,0,0,0.1)",
            ),
            yaxis=dict(
                title="m/z", showgrid=True, gridwidth=1, gridcolor="rgba(0,0,0,0.1)"
            ),
            template="plotly_white",
            hovermode="closest",
            width=800,
            height=600,
            showlegend=True,
            legend=dict(yanchor="top", y=0.99, xanchor="left", x=0.01),
            margin=dict(l=80, r=80, t=100, b=80),
            paper_bgcolor="white",
            plot_bgcolor="white",
        )

        # Add better interactivity configuration
        fig.update_traces(
            hoverlabel=dict(bgcolor="white", font_size=12, font_family="Arial")
        )

        return fig


class NetworkAnalyzer:
    """Handles network analysis and processing."""

    def __init__(
        self, config: RecursiveAnalysisConfig, ms1_df: pd.DataFrame, ms2_spectra: List
    ):
        self.analyzer = RecursiveAnalyzer(
            config=config,
            ms2_spectra=ms2_spectra,
            ms1_df=ms1_df,
            seed_metabolites=[str(ms1_df["id"].iloc[0])],
        )
        self.visualizer = NetworkVisualizer()
        self.visited_nodes: Set[str] = set()
        self.nodes_to_process: Set[str] = set(self.analyzer.seed_metabolites)
        self.current_layer = 0
        self.node_products_map: Dict[str, List[str]] = {}

    def process_layer(self) -> Tuple[plt.Figure, go.Figure, str]:
        """Process a single layer of the network and return visualizations."""
        self.current_layer += 1
        initial_nodes = len(self.nodes_to_process)

        new_neighbors, products, processed, layer_products_map = (
            self.analyzer._process_layer(
                self.nodes_to_process,
                self.visited_nodes,
                self.analyzer.config.max_iterations,
            )
        )

        # Create layer statistics
        stats = LayerStats(
            layer=self.current_layer,
            initial_nodes=initial_nodes,
            new_neighbors=len(new_neighbors),
            processed=len(processed),
            total_visited=len(self.visited_nodes) + len(processed),
            new_products=len(set(products)),
        )

        # Update visualization
        current_nodes = list(self.visited_nodes | new_neighbors)
        edges = [(node, neighbor) for node in processed for neighbor in new_neighbors]
        self.visualizer.update_graph(current_nodes, edges, self.current_layer)

        # Generate visualization
        network_fig = self.visualizer.draw_graph(self.current_layer, stats)

        # Update node_products_map and create visualizations
        self.node_products_map.update(layer_products_map)
        ms1_plot = MS1Visualizer.create_visualization(
            self.analyzer.ms1_df, self.node_products_map
        )
        products_markdown = self._create_products_markdown()

        # Update state for next iteration
        self.visited_nodes.update(processed)
        self.nodes_to_process = new_neighbors

        return network_fig, ms1_plot, products_markdown

    def _create_products_markdown(self) -> str:
        """Create markdown text for products list."""
        all_products = []
        for products_list in self.node_products_map.values():
            all_products.extend(products_list)
        unique_products = sorted(set(all_products))
        product_counts = {
            product: all_products.count(product) for product in unique_products
        }

        products_markdown = "### Discovered Products\n\n"
        products_markdown += "| Product | Count |\n|---------|-------|\n"
        for product, count in sorted(
            product_counts.items(), key=lambda x: (-x[1], x[0])
        ):
            products_markdown += f"| {product} | {count} |\n"

        return products_markdown

    @property
    def has_more_layers(self) -> bool:
        """Check if there are more layers to process."""
        return bool(
            self.nodes_to_process
            and self.current_layer < self.analyzer.config.max_iterations
        )


def analyze_network(
    use_default_files: bool = True,
    ms1_file: Optional[str] = None,
    ms2_file: Optional[str] = None,
    max_iterations: int = 3,
    modcos_threshold: float = 0.7,
    delta_mz_threshold: float = 0.01,
    progress=gr.Progress(),
) -> Tuple[plt.Figure, go.Figure, str]:
    """Main analysis function that processes the network and returns visualizations."""
    current_dir = Path(__file__).resolve().parent

    try:
        # Set up file paths
        if use_default_files:
            ms1_path = (
                current_dir.parent.parent / "asset/test/S2_FreshGinger_MS1_List.txt"
            )
            ms2_path = (
                current_dir.parent.parent / "asset/test/S2_FreshGinger_MS2_File.mgf"
            )
        else:
            if not ms1_file or not ms2_file:
                raise ValueError(
                    "Please provide both MS1 and MS2 files or use default files"
                )
            ms1_path = current_dir.parent.parent / "asset/test" / ms1_file.name
            ms2_path = current_dir.parent.parent / "asset/test" / ms2_file.name

        # Load data
        ms1_df = DataLoader.load_ms1_data(ms1_path)
        ms2_spectra = DataLoader.load_ms2_data(ms2_path)

        # Initialize analyzer
        config = RecursiveAnalysisConfig(
            max_iterations=max_iterations,
            modcos_threshold=modcos_threshold,
            delta_mz_threshold=delta_mz_threshold,
        )

        analyzer = NetworkAnalyzer(config, ms1_df, ms2_spectra)
        last_network_fig = None
        last_ms1_plot = None
        last_products_md = None

        # Process each layer
        while analyzer.has_more_layers:
            # Update progress before processing
            progress(
                analyzer.current_layer / max_iterations,
                f"Processing layer {analyzer.current_layer + 1}/{max_iterations}",
            )

            # Process layer and get results
            network_fig, ms1_plot, products_md = analyzer.process_layer()

            # Store results
            if last_network_fig is not None:
                plt.close(last_network_fig)
            last_network_fig = network_fig
            last_ms1_plot = ms1_plot
            last_products_md = products_md

            # Yield results
            yield network_fig, ms1_plot, products_md

        # Ensure final state is shown
        if last_network_fig is not None:
            progress(1.0, f"Analysis complete - {max_iterations} layers processed")
            yield last_network_fig, last_ms1_plot, last_products_md
            plt.close(last_network_fig)

    except Exception as e:
        import traceback

        error_msg = f"Error during analysis: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise gr.Error(error_msg)


def create_interface() -> gr.Blocks:
    """Create the Gradio interface."""

    # Custom CSS for better styling
    custom_css = """
    .gradio-container { max-width: 1400px !important; }
    #main-container { margin: 0 auto; padding: 2rem; }
    .header-text { text-align: center; margin-bottom: 2.5rem; }
    .header-text h1 { font-size: 2.2rem !important; margin-bottom: 0.5rem !important; }
    .header-text p { font-size: 1.1rem; opacity: 0.8; }
    .control-panel {
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .control-panel h3 {
        font-size: 1.2rem;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    .visualization-panel {
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        padding: 1.5rem;
        min-height: 700px;
    }
    .footer-text {
        text-align: center;
        margin-top: 2rem;
        opacity: 0.7;
        font-size: 0.9rem;
    }
    """

    with gr.Blocks(css=custom_css, theme=gr.themes.Default()) as app:
        with gr.Column(elem_id="main-container"):
            # Header
            with gr.Column(elem_classes="header-text"):
                gr.Markdown(
                    """
                    # Metabolic Network Analysis Visualizer
                    Interactive tool for exploring and visualizing metabolic networks with customizable parameters
                    """
                )

            with gr.Row(equal_height=True):
                # Left column - Controls
                with gr.Column(scale=1):
                    # File Selection Panel
                    with gr.Group(elem_classes="control-panel") as file_controls:
                        gr.Markdown("### Input Data Selection")
                        use_default = gr.Checkbox(
                            label="Use Default Test Files",
                            value=True,
                            info="Use S2_FreshGinger test files for demonstration",
                        )
                        with gr.Column(visible=False) as file_inputs:
                            ms1_file = gr.File(
                                label="MS1 Data File",
                                file_types=[".txt"],
                                interactive=True,
                                elem_classes="file-input",
                            )
                            ms2_file = gr.File(
                                label="MS2 Data File",
                                file_types=[".mgf"],
                                interactive=True,
                                elem_classes="file-input",
                            )

                    # Parameters Panel
                    with gr.Group(elem_classes="control-panel") as parameter_controls:
                        gr.Markdown("### Analysis Configuration")
                        with gr.Row():
                            max_iterations = gr.Slider(
                                minimum=1,
                                maximum=10,
                                value=3,
                                step=1,
                                label="Maximum Iterations",
                                info="Number of network exploration steps",
                            )
                        with gr.Row():
                            modcos_threshold = gr.Slider(
                                minimum=0.1,
                                maximum=1.0,
                                value=0.7,
                                step=0.1,
                                label="ModCos Threshold",
                                info="Modified Cosine Similarity threshold for matching",
                            )
                        with gr.Row():
                            delta_mz_threshold = gr.Slider(
                                minimum=0.001,
                                maximum=0.1,
                                value=0.01,
                                step=0.001,
                                label="Delta m/z Threshold",
                                info="Mass difference tolerance for matching",
                            )

                    # Analysis Button
                    with gr.Row(elem_classes="control-panel"):
                        analyze_btn = gr.Button(
                            "▶ Start Analysis",
                            variant="primary",
                            scale=1,
                            min_width=200,
                            size="lg",
                        )

                # Right column - Visualization
                with gr.Column(scale=2):
                    with gr.Group(elem_classes="visualization-panel") as visualization:
                        with gr.Tabs() as tabs:
                            with gr.Tab("Network Evolution", id="network_tab"):
                                network_plot = gr.Plot(
                                    label="Network Evolution Visualization",
                                    show_label=True,
                                    every=1,
                                    container=True,
                                )
                            with gr.Tab("MS1 Data", id="ms1_tab"):
                                ms1_plot = gr.Plot(
                                    label="MS1 Data Visualization",
                                    show_label=True,
                                    every=1,
                                    container=True,
                                )
                            with gr.Tab("Products List", id="products_tab"):
                                products_md = gr.Markdown()

            # Footer
            gr.Markdown(
                "© 2024 Yao Lab - Metabolic Network Analysis Tool",
                elem_classes="footer-text",
            )

        def toggle_file_inputs(use_default: bool) -> Dict:
            return gr.Column.update(visible=not use_default)

        use_default.change(
            fn=toggle_file_inputs,
            inputs=[use_default],
            outputs=[file_inputs],
        )

        analyze_btn.click(
            fn=analyze_network,
            inputs=[
                use_default,
                ms1_file,
                ms2_file,
                max_iterations,
                modcos_threshold,
                delta_mz_threshold,
            ],
            outputs=[network_plot, ms1_plot, products_md],
            show_progress=True,
            queue=True,  # Enable queuing for better handling of updates
        )

    return app


if __name__ == "__main__":
    app = create_interface()
    app.launch(share=True)
