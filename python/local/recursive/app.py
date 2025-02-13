import io
from pathlib import Path
from typing import NamedTuple

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
            col[1] if col[0] == "" else f"{col[0]}_{col[1]}" for col in ms1_df.columns
        ]

    return ms1_df


class NetworkVisualizer:
    def __init__(self):
        self.G = nx.Graph()
        self.pos = None
        self.node_colors = {}
        self.node_sizes = {}
        self.layer_nodes = {}
        self.all_edges = []

    def update_graph(self, nodes, edges, current_layer: int):
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
        # Create a figure with two subplots
        fig = plt.figure(figsize=(16, 8))

        # Network graph subplot
        ax1 = plt.subplot2grid((1, 5), (0, 0), colspan=3)

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
                self.G,
                valid_nodes,
                font_size=8,
                font_weight="bold",
                ax=ax1,
            )

        # Add title and legend for network graph
        ax1.set_title(f"Network Evolution - Layer {layer_num}", fontsize=14, pad=20)
        ax1.legend(
            loc="center left",
            bbox_to_anchor=(1, 0.5),
            frameon=True,
            facecolor="white",
            edgecolor="gray",
        )

        # Statistics visualization subplot
        ax2 = plt.subplot2grid((1, 5), (0, 3), colspan=2)

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
        ax2.tick_params(axis="x", rotation=45)

        # Add value labels on top of bars
        for bar in bars:
            height = bar.get_height()
            ax2.text(
                bar.get_x() + bar.get_width() / 2.0,
                height,
                f"{int(height)}",
                ha="center",
                va="bottom",
            )

        # Adjust layout
        plt.tight_layout()
        return fig


def create_ms1_visualization(
    ms1_df: pd.DataFrame, node_products_map: dict
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
                color=ms1_df["intensity"],
                colorscale="Viridis",
                showscale=True,
                colorbar=dict(title="Intensity"),
            ),
            text=hover_text,
            hoverinfo="text",
        )
    )

    # Update layout
    fig.update_layout(
        title="MS1 Data Visualization",
        xaxis_title="Retention Time (min)",
        yaxis_title="m/z",
        template="plotly_white",
        hovermode="closest",
        width=800,
        height=600,
    )

    return fig


def analyze_network(
    use_default_files: bool = True,
    ms1_file=None,
    ms2_file=None,
    max_iterations: int = 3,
    modcos_threshold: float = 0.7,
    delta_mz_threshold: float = 0.01,
    progress=gr.Progress(),
):
    current_dir = Path(__file__).resolve().parent

    if use_default_files:
        ms1_path = current_dir.parent.parent / "asset/test/S2_FreshGinger_MS1_List.txt"
        ms2_path = current_dir.parent.parent / "asset/test/S2_FreshGinger_MS2_File.mgf"
    else:
        if not ms1_file or not ms2_file:
            raise ValueError(
                "Please provide both MS1 and MS2 files or use default files"
            )
        ms1_path = current_dir.parent.parent / "asset/test" / ms1_file.name
        ms2_path = current_dir.parent.parent / "asset/test" / ms2_file.name

    try:
        # Initialize data and configurations
        ms2_spectra = list(load_from_mgf(str(ms2_path)))
        ms1_df = load_ms1_data(ms1_path)

        config = RecursiveAnalysisConfig(
            max_iterations=max_iterations,
            modcos_threshold=modcos_threshold,
            delta_mz_threshold=delta_mz_threshold,
        )

        analyzer = RecursiveAnalyzer(
            config=config,
            ms2_spectra=ms2_spectra,
            ms1_df=ms1_df,
            seed_metabolites=[str(ms1_df["id"].iloc[0])],
        )

        visualizer = NetworkVisualizer()
        visited_nodes = set()
        nodes_to_process = set(analyzer.seed_metabolites)
        current_layer = 0
        node_products_map = {}

        # Process each layer
        while nodes_to_process and current_layer < config.max_iterations:
            current_layer += 1
            progress(
                current_layer / config.max_iterations,
                f"Processing layer {current_layer}/{config.max_iterations}",
            )

            initial_nodes = len(nodes_to_process)
            new_neighbors, products, processed, layer_products_map = (
                analyzer._process_layer(
                    nodes_to_process, visited_nodes, analyzer.config.max_iterations
                )
            )

            # Create layer statistics
            stats = LayerStats(
                layer=current_layer,
                initial_nodes=initial_nodes,
                new_neighbors=len(new_neighbors),
                processed=len(processed),
                total_visited=len(visited_nodes) + len(processed),
                new_products=len(set(products)),
            )

            # Update visualization
            current_nodes = list(visited_nodes | new_neighbors)
            edges = [
                (node, neighbor) for node in processed for neighbor in new_neighbors
            ]
            visualizer.update_graph(current_nodes, edges, current_layer)

            # Generate visualization
            plt.ioff()  # Turn off interactive mode
            fig = visualizer.draw_graph(current_layer, stats)

            # Create intermediate MS1 visualization
            ms1_plot = create_ms1_visualization(ms1_df, node_products_map)

            # Create intermediate products list
            all_products = []
            for products_list in node_products_map.values():
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

            # Update node_products_map
            node_products_map.update(layer_products_map)

            # Yield intermediate results
            yield fig, ms1_plot, products_markdown

            # Clean up matplotlib figure
            plt.close(fig)

            # Update state for next iteration
            visited_nodes.update(processed)
            nodes_to_process = new_neighbors

        # Return final results if no more iterations
        if not nodes_to_process or current_layer >= config.max_iterations:
            plt.ioff()  # Turn off interactive mode
            final_fig = visualizer.draw_graph(current_layer, stats)
            final_ms1_plot = create_ms1_visualization(ms1_df, node_products_map)
            yield final_fig, final_ms1_plot, products_markdown
            plt.close(final_fig)

    except Exception as e:
        import traceback

        error_msg = f"Error during analysis: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise gr.Error(error_msg)


def create_interface():
    # Custom CSS for better styling
    custom_css = """
    .gradio-container {
        max-width: 1400px !important;
    }
    #main-container {
        margin: 0 auto;
        padding: 2rem;
    }
    .header-text {
        text-align: center;
        margin-bottom: 2.5rem;
    }
    .header-text h1 {
        font-size: 2.2rem !important;
        margin-bottom: 0.5rem !important;
    }
    .header-text p {
        font-size: 1.1rem;
        opacity: 0.8;
    }
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
                        stop_btn = gr.Button(
                            "⏹ Stop",
                            variant="secondary",
                            scale=1,
                            min_width=100,
                            size="lg",
                            visible=False,
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
                                )
                            with gr.Tab("MS1 Data", id="ms1_tab"):
                                ms1_plot = gr.Plot(
                                    label="MS1 Data Visualization",
                                    show_label=True,
                                    every=1,
                                )
                            with gr.Tab("Products List", id="products_tab"):
                                products_md = gr.Markdown()

            # Footer
            gr.Markdown(
                "© 2024 Yao Lab - Metabolic Network Analysis Tool",
                elem_classes="footer-text",
            )

        def toggle_file_inputs(use_default):
            return gr.Column.update(visible=not use_default)

        def toggle_analysis_buttons(is_analyzing: bool):
            return {
                analyze_btn: gr.Button.update(interactive=not is_analyzing),
                stop_btn: gr.Button.update(visible=is_analyzing),
            }

        use_default.change(
            fn=toggle_file_inputs,
            inputs=[use_default],
            outputs=[file_inputs],
        )

        analyze_event = analyze_btn.click(
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
        )

        analyze_event.then(
            fn=lambda: toggle_analysis_buttons(True),
            outputs=[analyze_btn, stop_btn],
        )

        stop_btn.click(
            fn=lambda: None,
            cancels=[analyze_event],
        ).then(
            fn=lambda: toggle_analysis_buttons(False),
            outputs=[analyze_btn, stop_btn],
        )

    return app


if __name__ == "__main__":
    app = create_interface()
    app.launch(share=True)
