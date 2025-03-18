import copy
import logging
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional

import networkx as nx
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st
from matchms.importing import load_from_mgf
from matchms.Spectrum import Spectrum

# Add python directory to Python path
current_dir = Path(__file__).resolve().parent
python_dir = current_dir.parent
sys.path.append(str(python_dir))

from core.models.analysis import MSTool
from core.preprocess import preprocess_targeted_ions_file
from core.recursive.run import (
    AnalysisConstants,
    RecursiveAnalysisConfig,
    RecursiveAnalyzer,
)
from core.utils.constants import TargetIonsColumn

# Page config
st.set_page_config(
    layout="wide",
    page_title="Recursive Analysis",
    page_icon="🧬",
    initial_sidebar_state="collapsed",
)

# Custom CSS for refined dark mode styling
st.markdown(
    """
    <style>
    /* Color Variables */
    :root {
        --bg-primary: #0e1117;
        --bg-secondary: #1e2329;
        --bg-tertiary: #262b33;
        --text-primary: #fafafa;
        --text-secondary: #e0e0e0;
        --text-muted: #a3a8b4;
        --border-color: rgba(250, 250, 250, 0.1);
        --accent-primary: #ff4b4b;
        --accent-secondary: #ff2b2b;
        --accent-gradient: linear-gradient(45deg, #ff4b4b, #ff2b2b);
        --hover-overlay: rgba(255, 255, 255, 0.05);
    }

    /* Global Styles */
    .main {
        background-color: var(--bg-primary);
        color: var(--text-primary);
        padding: 0 1rem;
    }
    .block-container {
        padding: 3rem 2rem;
    }
    
    /* Panel Styles */
    .control-panel, .results-panel {
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 1rem;
        padding: 2rem;
        height: 100%;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    /* Button Styles */
    .stButton>button {
        width: 100%;
        margin-top: 1.5rem;
        padding: 0.875rem 1.5rem;
        background: var(--accent-primary);
        color: var(--text-primary);
        border: none;
        border-radius: 0.75rem;
        font-weight: 500;
        font-size: 0.9375rem;
        letter-spacing: 0.025em;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .stButton>button:hover {
        background: var(--accent-secondary);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 75, 75, 0.2);
    }
    
    /* Progress Styles */
    .stProgress {
        margin: 1rem 0;
    }
    .stProgress > div > div > div > div {
        background: var(--accent-primary);
        border-radius: 1rem;
    }
    .stProgress > div > div > div {
        background-color: var(--bg-tertiary);
        border-radius: 1rem;
        height: 0.5rem;
    }
    
    /* Results Panel Styles */
    .results-panel {
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 1rem;
        padding: 1.5rem;
        height: 100%;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    /* Metrics Grid */
    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }
    
    .metric-card {
        background-color: var(--bg-tertiary);
        padding: 1.25rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border-color);
    }
    
    .metric-value {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
    }
    
    .metric-label {
        font-size: 0.875rem;
        color: var(--text-muted);
    }
    
    /* Tab Container */
    .stTabs {
        background: transparent;
        padding: 0;
        margin-top: 0;
    }
    
    .stTabs [data-baseweb="tab-list"] {
        background-color: transparent;
        padding: 0;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid var(--border-color);
        border-radius: 0;
    }
    
    .stTabs [data-baseweb="tab"] {
        padding: 0.75rem 1rem;
        margin: 0 1rem 0 0;
        border-radius: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
    }
    
    .stTabs [data-baseweb="tab"]:hover {
        background: transparent;
        border-bottom: 2px solid var(--text-muted);
    }
    
    .stTabs [data-baseweb="tab"][aria-selected="true"] {
        background: transparent;
        border-bottom: 2px solid var(--text-primary);
        color: var(--text-primary);
    }
    
    /* Content Sections */
    .content-section {
        background-color: var(--bg-tertiary);
        border-radius: 0.75rem;
        padding: 1.25rem;
        margin-bottom: 1.5rem;
    }
    
    /* DataFrame Styles */
    .dataframe {
        background-color: var(--bg-tertiary);
        border: none;
        border-radius: 0.5rem;
        margin-top: 1rem;
    }
    
    .dataframe th {
        background-color: var(--bg-secondary);
        padding: 0.75rem !important;
        font-size: 0.813rem;
    }
    
    .dataframe td {
        padding: 0.75rem !important;
        font-size: 0.813rem;
    }
    
    /* Plot Container */
    .plot-container {
        background-color: var(--bg-tertiary);
        border-radius: 0.75rem;
        padding: 1.25rem;
        margin-bottom: 1.5rem;
    }
    
    .js-plotly-plot {
        padding: 0;
        background: transparent;
        border: none;
        margin: 0;
    }
    
    .js-plotly-plot:hover {
        transform: none;
        box-shadow: none;
    }
    
    /* Section Headers */
    h2 {
        color: var(--text-primary);
        font-weight: 600;
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
        letter-spacing: -0.025em;
    }
    h3 {
        color: var(--text-muted);
        font-weight: 500;
        font-size: 1.125rem;
        margin: 2rem 0 1rem;
        letter-spacing: -0.025em;
    }
    
    /* Info Messages */
    .stAlert {
        background-color: var(--bg-secondary);
        color: var(--text-muted);
        border: 1px solid var(--border-color);
        border-radius: 0.75rem;
        padding: 1rem;
        font-size: 0.875rem;
    }
    
    /* Input Styles */
    .stTextInput > div {
        margin-top: 0.5rem;
    }
    .stTextInput > div > div > input {
        background-color: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 0.75rem;
        color: var(--text-primary);
        font-size: 0.875rem;
        padding: 0.75rem 1rem;
        transition: all 0.2s ease;
    }
    .stTextInput > div > div > input:focus {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    
    /* Slider Styles */
    .stSlider > div > div > div {
        background-color: var(--bg-tertiary);
    }
    .stSlider > div > div > div > div {
        background: var(--accent-gradient);
    }
    </style>
""",
    unsafe_allow_html=True,
)


def create_network_graph(
    neighbors_df: pd.DataFrame, node_products_map: Dict
) -> go.Figure:
    """Create an interactive network visualization."""
    G = nx.Graph()

    # Add nodes
    for node_id in node_products_map.keys():
        G.add_node(node_id)

    # Add edges from neighbors_df
    for _, row in neighbors_df.iterrows():
        G.add_edge(str(row["source"]), str(row["target"]), weight=row["similarity"])

    # Calculate layout
    pos = nx.spring_layout(G, k=1 / np.sqrt(len(G.nodes())), iterations=50)

    # Create edge trace
    edge_x = []
    edge_y = []
    edge_text = []

    for edge in G.edges(data=True):
        x0, y0 = pos[edge[0]]
        x1, y1 = pos[edge[1]]
        edge_x.extend([x0, x1, None])
        edge_y.extend([y0, y1, None])
        edge_text.append(f"Similarity: {edge[2]['weight']:.2f}")

    edge_trace = go.Scatter(
        x=edge_x,
        y=edge_y,
        line=dict(width=0.5, color="#888"),
        hoverinfo="none",
        mode="lines",
        showlegend=False,
    )

    # Create node trace
    node_x = []
    node_y = []
    node_text = []
    node_size = []

    for node in G.nodes():
        x, y = pos[node]
        node_x.append(x)
        node_y.append(y)
        degree = G.degree(node)
        node_size.append(10 + degree * 2)
        node_text.append(f"ID: {node}<br>Connections: {degree}")

    node_trace = go.Scatter(
        x=node_x,
        y=node_y,
        mode="markers",
        hoverinfo="text",
        text=node_text,
        marker=dict(
            showscale=True,
            colorscale="Reds",
            size=node_size,
            color=[G.degree(node) for node in G.nodes()],
            line_width=2,
            line=dict(color="#fff", width=0.5),
        ),
        showlegend=False,
    )

    # Create figure
    fig = go.Figure(
        data=[edge_trace, node_trace],
        layout=go.Layout(
            template="plotly_dark",
            plot_bgcolor="rgba(0,0,0,0)",
            paper_bgcolor="rgba(0,0,0,0)",
            showlegend=False,
            hovermode="closest",
            margin=dict(b=20, l=5, r=5, t=40),
            xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            title=dict(
                text="Metabolic Network Visualization",
                x=0.5,
                y=0.95,
                font=dict(size=16, color="#e0e0e0"),
            ),
        ),
    )

    return fig


def create_similarity_distribution(neighbors_df: pd.DataFrame) -> go.Figure:
    """Create a histogram of similarity scores."""
    fig = go.Figure()

    fig.add_trace(
        go.Histogram(
            x=neighbors_df["similarity"],
            nbinsx=30,
            name="Similarity Distribution",
            marker_color="#ff4b4b",
        )
    )

    fig.update_layout(
        template="plotly_dark",
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        title=dict(
            text="Similarity Score Distribution",
            x=0.5,
            y=0.95,
            font=dict(size=16, color="#e0e0e0"),
        ),
        xaxis_title="Similarity Score",
        yaxis_title="Count",
        bargap=0.1,
    )

    return fig


def create_degree_distribution(neighbors_df: pd.DataFrame) -> go.Figure:
    """Create a visualization of node degree distribution."""
    # Calculate node degrees from the ID column
    all_nodes = neighbors_df[TargetIonsColumn.ID]
    degree_counts = all_nodes.value_counts()

    fig = go.Figure()

    fig.add_trace(
        go.Bar(x=degree_counts.index, y=degree_counts.values, marker_color="#ff4b4b")
    )

    fig.update_layout(
        template="plotly_dark",
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        title=dict(
            text="Node Degree Distribution",
            x=0.5,
            y=0.95,
            font=dict(size=16, color="#e0e0e0"),
        ),
        xaxis_title="Node ID",
        yaxis_title="Number of Connections",
        showlegend=False,
    )

    return fig


class RecursiveAnalysisUI:
    def __init__(self):
        self.ms2_spectra: Optional[list[Spectrum]] = None
        self.ms1_df: Optional[pd.DataFrame] = None
        self.analyzer: Optional[RecursiveAnalyzer] = None
        self.current_layer: int = 0
        self.total_nodes: int = 0
        self.processed_nodes: int = 0
        self.layer_stats: List[Dict] = []
        self.progress_container = None
        self.log_placeholder = None
        self.current_log = []
        self.is_running: bool = False
        self.stop_analysis: bool = False
        
        # 添加列名映射
        self.COLUMN_MAPPING = {
            'Precursor m/z': 'mz',
            'Peak ID': 'id',
            'RT (min)': 'rt',
            'Height': 'height',
            'Area': 'area'
        }

    def load_ms1_data(self, file_path: Path) -> pd.DataFrame:
        """加载MS1数据"""
        try:
            # 直接读取文本文件
            ms1_df = pd.read_csv(file_path, sep='\t')
            
            # 重命名列
            ms1_df = ms1_df.rename(columns=self.COLUMN_MAPPING)
            
            # 确保必要的列存在
            required_columns = ['mz', 'id']
            missing_columns = [col for col in required_columns if col not in ms1_df.columns]
            if missing_columns:
                raise KeyError(f"缺少必要的列: {', '.join(missing_columns)}")
            
            # 转换ID列为字符串类型
            ms1_df['id'] = ms1_df['id'].astype(str)
            
            return ms1_df
            
        except Exception as e:
            st.error(f"加载MS1数据失败: {str(e)}")
            return pd.DataFrame()

    def parse_ms2_peaks(self, peaks_str: str) -> List[Dict[str, float]]:
        """解析MS2峰信息"""
        peaks = []
        for peak_str in peaks_str.split():
            parts = peak_str.strip().split(":")
            if len(parts) == 2:
                try:
                    mz = float(parts[0])
                    intensity = float(parts[1])
                    peaks.append({"mz": mz, "intensity": intensity})
                except ValueError:
                    continue
        
        # 按强度降序排序
        peaks = sorted(peaks, key=lambda x: x["intensity"], reverse=True)
        return peaks

    def render_controls(self):
        # Create main layout
        control_col, results_col = st.columns([1, 2])

        with control_col:
            with st.container():
                st.markdown(
                    """
                    <div class="control-panel">
                        <h2>🧬 代谢网络分析</h2>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

                # Create a form to disable all inputs during analysis
                with st.form("analysis_form"):
                    # Input Files Section
                    with st.expander("📁 输入文件", expanded=True):
                        # Default test files
                        default_ms2 = (
                            current_dir.parent.parent
                            / "asset/test/Mgf_LAJ01-POS_fixed.mgf"
                        )
                        default_ms1 = (
                            current_dir.parent.parent
                            / "asset/test/LAJ01-POS.txt"
                        )

                        ms2_file = st.text_input(
                            "MS2 MGF文件",
                            value=str(default_ms2),
                            help="选择MS2 MGF格式文件",
                        )
                        ms1_file = st.text_input(
                            "MS1列表文件",
                            value=str(default_ms1),
                            help="选择MS1列表格式文件",
                        )

                    # 母核参数设置
                    st.markdown("### 🎯 母核参数设置")
                    with st.expander("母核信息", expanded=True):
                        parent_mz = st.number_input(
                            "母核m/z值",
                            value=166.086255,
                            format="%.6f",
                            help="输入母核的精确m/z值",
                        )
                        
                        parent_ms2_peaks = st.text_area(
                            "母核MS2峰 (格式: mz1:intensity1 mz2:intensity2 ...)",
                            value="120.0807:999 166.0856:481 121.084:73 149.0591:16 103.054:11",
                            help="输入母核的前五个MS2峰，格式为'm/z:强度'，用空格分隔",
                        )
                        
                        ms1_tolerance = st.number_input(
                            "MS1匹配容差 (Da)",
                            value=0.01,
                            format="%.4f",
                            help="MS1匹配的质量误差容差",
                        )
                        
                        ms2_tolerance = st.number_input(
                            "MS2匹配容差 (Da)",
                            value=0.02,
                            format="%.4f",
                            help="MS2峰匹配的质量误差容差",
                        )
                        
                        min_ms2_peaks = st.number_input(
                            "最小MS2匹配峰数",
                            value=2,
                            min_value=1,
                            help="要求至少匹配的MS2峰数",
                        )
                        
                        ms2_similarity = st.number_input(
                            "MS2相似度阈值",
                            value=0.3,
                            format="%.2f",
                            help="MS2谱图匹配的最小相似度阈值",
                        )

                    # 网络分析参数
                    with st.expander("网络分析参数", expanded=True):
                        min_cosine = st.slider(
                            "最小余弦相似度",
                            0.0,
                            1.0,
                            AnalysisConstants.MODCOS_THRESHOLD,
                            help="谱图匹配的最小余弦相似度阈值",
                        )
                        max_mass_diff = st.number_input(
                            "最大质量差异 (Da)",
                            0.0,
                            100.0,
                            AnalysisConstants.DELTA_MZ_THRESHOLD,
                            help="特征之间允许的最大质量差异",
                        )
                        max_iterations = st.number_input(
                            "最大迭代次数",
                            1,
                            10,
                            AnalysisConstants.DEFAULT_MAX_ITERATIONS,
                            help="递归分析的最大迭代次数",
                        )

                    with st.expander("高级设置", expanded=False):
                        batch_size = st.number_input(
                            "批处理大小",
                            10,
                            1000,
                            AnalysisConstants.MAX_BATCH_SIZE,
                            help="并行处理的节点批次大小",
                        )
                        max_workers = st.number_input(
                            "最大工作进程数",
                            1,
                            32,
                            min(
                                AnalysisConstants.MAX_WORKERS,
                                (os.cpu_count() or 1) * 2,
                            ),
                            help="并行处理使用的最大工作进程数",
                        )

                    # Run Analysis Button
                    submitted = st.form_submit_button(
                        "🚀 开始分析",
                        use_container_width=True,
                        disabled=self.is_running,
                    )

                    if submitted:
                        try:
                            # 解析MS2峰信息
                            parent_ms2_peaks_list = self.parse_ms2_peaks(parent_ms2_peaks)
                            if not parent_ms2_peaks_list:
                                st.error("无法解析MS2峰信息，请检查输入格式")
                                return
                                
                            # 创建配置对象
                            config = RecursiveAnalysisConfig(
                                parent_mz_list=[parent_mz],
                                parent_mz_error=ms1_tolerance,
                                enable_ms2_validation=True,
                                parent_ms2_peaks={parent_mz: parent_ms2_peaks_list},
                                ms2_match_tolerance=ms2_tolerance,
                                min_ms2_matched_peaks=min_ms2_peaks,
                                ms2_similarity_threshold=ms2_similarity,
                                modcos_threshold=min_cosine,
                                delta_mz_threshold=max_mass_diff,
                                max_iterations=max_iterations,
                                batch_size=batch_size,
                                max_workers=max_workers,
                            )

                            # Run analysis in the results column
                            with results_col:
                                self.run_analysis_with_progress(
                                    ms2_file, ms1_file, config
                                )

                        except Exception as e:
                            st.error(f"❌ 错误: {str(e)}")
                            st.info(
                                "请检查输入文件和参数设置后重试。"
                            )

    def render_layer_results(self, network_data, layer_stats):
        """渲染每一层的分析结果"""
        st.markdown("### 📊 层级分析结果")
        
        # 创建层级统计表格
        layer_df = pd.DataFrame(layer_stats)
        if not layer_df.empty:
            # 确保使用存在的列名
            display_columns = []
            column_renames = {}
            
            # 检查哪些列存在并创建重命名字典
            if 'layer' in layer_df.columns:
                display_columns.append('layer')
                column_renames['layer'] = '层级'
                
            if 'total' in layer_df.columns:
                display_columns.append('total')
                column_renames['total'] = '总节点数'
                
            if 'processed' in layer_df.columns:
                display_columns.append('processed')
                column_renames['processed'] = '已处理节点数'
                
            if 'new_neighbors' in layer_df.columns:
                display_columns.append('new_neighbors')
                column_renames['new_neighbors'] = '新邻居数'
                
            if 'new_products' in layer_df.columns:
                display_columns.append('new_products')
                column_renames['new_products'] = '新产物数'
            
            # 显示数据表格，只使用存在的列
            if display_columns:
                st.dataframe(
                    layer_df[display_columns].rename(columns=column_renames),
                    use_container_width=True
                )
            else:
                st.dataframe(layer_df, use_container_width=True)
            
            # 为每一层创建节点和边的详细信息
            for layer in layer_df['layer'].unique():
                with st.expander(f"第 {layer} 层详细信息", expanded=False):
                    # 获取该层的节点
                    layer_nodes = [n for n in network_data.nodes if n.get('layer') == layer]
                    layer_node_ids = {n['id'] for n in layer_nodes}
                    
                    # 获取该层的边
                    layer_edges = [e for e in network_data.edges 
                                 if e.get('layer') == layer]
                    
                    # 创建节点DataFrame
                    nodes_df = pd.DataFrame(layer_nodes)
                    if not nodes_df.empty:
                        st.markdown("#### 节点信息")
                        st.dataframe(nodes_df, use_container_width=True)
                    
                    # 创建边DataFrame
                    edges_df = pd.DataFrame(layer_edges)
                    if not edges_df.empty:
                        st.markdown("#### 边信息")
                        st.dataframe(edges_df, use_container_width=True)
                    
                    # 显示该层的产物信息 - 修改为仅显示MS1表中的信息
                    if layer_node_ids and self.ms1_df is not None and not self.ms1_df.empty:
                        st.markdown("#### 产物信息")
                        
                        # 获取该层所有节点关联的产物ID
                        layer_product_ids = set()
                        for node_id in layer_node_ids:
                            if node_id in network_data.node_products_map:
                                layer_product_ids.update(network_data.node_products_map[node_id])
                        
                        # 从MS1数据中查找匹配的产物信息
                        if layer_product_ids:
                            # 仅保留在MS1表中的产物ID
                            valid_product_ids = layer_product_ids.intersection(set(self.ms1_df[TargetIonsColumn.ID].astype(str)))
                            
                            if valid_product_ids:
                                # 过滤MS1表以获取产物详细信息
                                products_df = self.ms1_df[self.ms1_df[TargetIonsColumn.ID].astype(str).isin(valid_product_ids)].copy()
                                st.dataframe(products_df, use_container_width=True)
                            else:
                                st.info("没有找到此层中的产物在MS1数据中的匹配信息")
                        else:
                            st.info("此层没有关联的产物")

    def run_analysis_with_progress(
        self, ms2_file: str, ms1_file: str, config: RecursiveAnalysisConfig
    ):
        """运行分析并显示进度"""
        self.is_running = True
        self.stop_analysis = False
        self.current_log = []

        try:
            # Create containers for status and results
            status_container = st.empty()
            progress_container = st.container()
            self.progress_container = progress_container

            # Load data with progress updates
            with st.spinner("加载MS2谱图..."):
                self.ms2_spectra = list(load_from_mgf(ms2_file))
                self.add_log_message(f"✅ 加载了 {len(self.ms2_spectra)} 个MS2谱图")

            with st.spinner("加载MS1数据..."):
                self.ms1_df = self.load_ms1_data(Path(ms1_file))
                if self.ms1_df.empty:
                    raise ValueError("MS1数据加载失败")
                self.add_log_message(f"✅ 加载了 {len(self.ms1_df)} 条MS1特征")

            # Initialize analyzer
            self.analyzer = RecursiveAnalyzer(
                config=config,
                ms2_spectra=self.ms2_spectra,
                ms1_df=self.ms1_df,
            )

            # Show running status
            status_container.markdown(
                """
                <div class="analysis-status-container">
                    <div class="running-status">
                        <div style="text-align: center;">
                            <span class="spinner"></span>
                            正在运行网络分析...
                        </div>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

            # 运行分析
            network_data = self.analyze()

            if network_data is not None:
                # Clear the status container
                status_container.empty()
                progress_container.empty()
                
                # 显示结果
                st.markdown("## 🎯 分析结果")
                
                # 显示母核代谢物信息
                st.markdown("### 母核代谢物")
                seed_metabolites = [node for node in network_data.nodes if node.get('layer') == 0]
                if seed_metabolites:
                    seed_df = pd.DataFrame(seed_metabolites)
                    st.dataframe(seed_df, use_container_width=True)
                
                # 显示网络统计信息
                st.markdown("### 📊 网络统计")
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("总节点数", len(network_data.nodes))
                with col2:
                    st.metric("总边数", len(network_data.edges))
                with col3:
                    st.metric("总产物数", len(set(network_data.products)))
                
                # 显示层级分析结果
                self.render_layer_results(network_data, self.layer_stats)
                
                # 导出数据
                st.markdown("### 💾 导出数据")
                
                # 创建下载按钮
                col1, col2, col3 = st.columns(3)
                with col1:
                    nodes_df = pd.DataFrame(network_data.nodes)
                    st.download_button(
                        "⬇️ 下载节点数据",
                        nodes_df.to_csv(index=False),
                        "network_nodes.csv",
                        "text/csv",
                    )
                with col2:
                    edges_df = pd.DataFrame(network_data.edges)
                    st.download_button(
                        "⬇️ 下载边数据",
                        edges_df.to_csv(index=False),
                        "network_edges.csv",
                        "text/csv",
                    )
                with col3:
                    products_df = pd.DataFrame({"product": list(set(network_data.products))})
                    st.download_button(
                        "⬇️ 下载产物数据",
                        products_df.to_csv(index=False),
                        "products.csv",
                        "text/csv",
                    )

        except Exception as e:
            st.error(f"❌ 错误: {str(e)}")
        finally:
            self.is_running = False
            if "status_container" in locals():
                status_container.empty()

    def analyze(self):
        """Run the metabolic network analysis with live progress tracking."""
        if not self.analyzer:
            return None

        try:
            self.add_log_message("Starting analysis...")

            # Set up logging handler to capture detailed statistics
            class ProgressHandler(logging.Handler):
                def __init__(self, ui_instance):
                    super().__init__()
                    self.ui = ui_instance

                def emit(self, record):
                    msg = record.getMessage()
                    if "Layer" in msg and "processed=" in msg:
                        try:
                            layer_num = int(msg.split("Layer ")[1].split(":")[0])
                            processed = int(msg.split("processed=")[1].split(",")[0])
                            new_neighbors = int(
                                msg.split("new_neighbors=")[1].split(",")[0]
                            )
                            new_products = int(
                                msg.split("new_products=")[1].split(")")[0]
                            )

                            # Add the log message
                            self.ui.add_log_message(
                                f"Layer {layer_num}: processed={processed}, "
                                f"new_neighbors={new_neighbors}, new_products={new_products}"
                            )

                            # Update progress
                            self.ui.update_progress(
                                layer_num,
                                "Processing",
                                processed + new_neighbors,
                                processed,
                                new_neighbors,
                                new_products,
                            )
                        except (ValueError, IndexError):
                            self.ui.add_log_message(msg)

            # Add the custom handler to the logger
            logger = logging.getLogger("core.recursive.run")
            progress_handler = ProgressHandler(self)
            logger.addHandler(progress_handler)

            # Run the analysis
            network_data = self.analyzer.explore_metabolic_network()

            # Remove the custom handler
            logger.removeHandler(progress_handler)

            if network_data is not None:
                self.add_log_message("✅ Analysis complete!")

            return network_data

        except Exception as e:
            error_msg = f"❌ Error during analysis: {str(e)}"
            self.add_log_message(error_msg)
            st.error(error_msg)
            return None

    def create_cytoscape_files(self, network_data) -> tuple[str, str]:
        """Create Cytoscape-compatible node and edge CSV files."""
        # Create nodes CSV content
        nodes_data = []
        for node in network_data.nodes:
            node_data = {
                "id": node.get("id", ""),
                "mz": node.get("mz", ""),
                "layer": node.get("layer", ""),
                "products": ",".join(
                    network_data.node_products_map.get(str(node.get("id", "")), [])
                ),
            }
            nodes_data.append(node_data)
        nodes_df = pd.DataFrame(nodes_data)
        nodes_csv = nodes_df.to_csv(index=False)

        # Create edges CSV content
        edges_data = []
        for edge in network_data.edges:
            edge_data = {
                "source": edge.get("source", ""),
                "target": edge.get("target", ""),
                "products": ",".join(edge.get("products", [])),
                "layer": edge.get("layer", ""),
            }
            edges_data.append(edge_data)
        edges_df = pd.DataFrame(edges_data)
        edges_csv = edges_df.to_csv(index=False)

        return nodes_csv, edges_csv

    def render_results(self, network_data=None):
        """Render results in a grid layout without tabs."""
        # If no data is provided, show only the progress log
        if network_data is None:
            self.render_progress_log(st)
            return

        # Create a deep copy of network data to avoid modifying the original
        network_data_copy = copy.deepcopy(network_data)

        # Calculate node positions using a spring layout
        G = nx.Graph()

        # Add nodes to the graph
        for node in network_data_copy.nodes:
            node_id = node.get("id", "")
            G.add_node(node_id, **{k: v for k, v in node.items() if k != "id"})

        # Add edges to the graph
        for edge in network_data_copy.edges:
            source = edge.get("source", "")
            target = edge.get("target", "")
            G.add_edge(
                source,
                target,
                **{k: v for k, v in edge.items() if k not in ["source", "target"]},
            )

        # Show metrics grid
        st.markdown(
            """
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">{}</div>
                    <div class="metric-label">MS1 Features</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{}</div>
                    <div class="metric-label">Connections</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{}</div>
                    <div class="metric-label">Unique Products</div>
                </div>
            </div>
            """.format(
                len(G.nodes()),
                len(G.edges()),
                len(network_data_copy.products) if network_data_copy.products else 0,
            ),
            unsafe_allow_html=True,
        )

        # Network Export Section
        st.markdown("### 🔬 Network Export")

        # Create Cytoscape files
        nodes_csv, edges_csv = self.create_cytoscape_files(network_data_copy)

        # Create columns for download buttons
        col1, col2 = st.columns(2)

        with col1:
            st.download_button(
                "⬇️ Download Nodes (CSV)",
                nodes_csv,
                "network_nodes.csv",
                "text/csv",
                use_container_width=True,
            )

        with col2:
            st.download_button(
                "⬇️ Download Edges (CSV)",
                edges_csv,
                "network_edges.csv",
                "text/csv",
                use_container_width=True,
            )

        st.markdown(
            """
        <div class="info-box" style="background-color: var(--bg-tertiary); padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
            <p style="margin: 0; color: var(--text-muted);">
                ℹ️ The network files are in Cytoscape-compatible CSV format. To import in Cytoscape:
                <ol style="margin-top: 0.5rem; color: var(--text-muted);">
                    <li>Import nodes.csv first using File > Import > Network from File</li>
                    <li>Then import edges.csv using File > Import > Network from File</li>
                    <li>Use the 'source' and 'target' columns for edge mapping</li>
                </ol>
            </p>
        </div>
        """,
            unsafe_allow_html=True,
        )

        # Products Table
        st.markdown("### 📊 Products")
        if network_data_copy.products:
            products_df = pd.DataFrame({"product_id": network_data_copy.products})
            st.download_button(
                "⬇️ Download Products (CSV)",
                products_df.to_csv(index=False),
                "products.csv",
                "text/csv",
                use_container_width=True,
            )
            st.dataframe(
                products_df,
                use_container_width=True,
                height=300,
            )

        # Matched MS1 Ions
        if self.analyzer:
            st.markdown("### 🎯 Matched MS1 Ions")
            matched_ions = self.analyzer.ms1_df[
                self.analyzer.ms1_df[TargetIonsColumn.ID]
                .astype(str)
                .isin(
                    network_data_copy.node_products_map.keys()
                    if network_data_copy.node_products_map
                    else []
                )
            ]
            st.download_button(
                "⬇️ Download Matched MS1 Ions (CSV)",
                matched_ions.to_csv(index=False),
                "matched_ms1_ions.csv",
                "text/csv",
                use_container_width=True,
            )
            st.dataframe(
                matched_ions,
                use_container_width=True,
                height=300,
            )

    def render_progress_log(self, container):
        """Render the progress log with live updates."""
        # Overall progress
        if self.total_nodes > 0:
            progress = self.processed_nodes / self.total_nodes
            container.progress(progress)

        # Update the log display
        log_html = ""
        for msg in self.current_log:
            log_html += f"""
            <div class="log-entry">
                <span class="log-time">{msg.get("time", "")}</span>
                <span class="log-message">{msg.get("message", "")}</span>
            </div>
            """

        if self.log_placeholder is None:
            self.log_placeholder = container.empty()

        self.log_placeholder.markdown(
            f"""
            <div class="log-container">
                {log_html}
            </div>
            """,
            unsafe_allow_html=True,
        )

    def add_log_message(self, message: str):
        """Add a new log message and update the display."""
        timestamp = pd.Timestamp.now().strftime("%H:%M:%S")

        # Format layer information if present
        if "Layer" in message:
            try:
                layer_num = message.split("Layer ")[1].split(":")[0]
                processed_info = message.split(": ")[1]
                formatted_message = (
                    f'<span class="log-layer">Layer {layer_num}</span> {processed_info}'
                )
            except:
                formatted_message = message
        else:
            formatted_message = message

        self.current_log.append({"time": timestamp, "message": formatted_message})
        if self.progress_container and self.log_placeholder:
            self.render_progress_log(self.progress_container)

    def update_progress(
        self,
        layer: int,
        status: str,
        total: int,
        processed: int = 0,
        new_neighbors: int = 0,
        new_products: int = 0,
    ):
        """Update progress information for the current layer with detailed statistics."""
        self.current_layer = layer
        progress = (processed / total * 100) if total > 0 else 0

        # Update or add layer statistics with detailed information
        layer_info = {
            "layer": layer,
            "status": status,
            "total": total,
            "processed": processed,
            "progress": progress,
            "new_neighbors": new_neighbors,
            "new_products": new_products,
        }

        # Update existing layer or add new one
        layer_exists = False
        for i, existing_layer in enumerate(self.layer_stats):
            if existing_layer["layer"] == layer:
                self.layer_stats[i] = layer_info
                layer_exists = True
                break

        if not layer_exists:
            self.layer_stats.append(layer_info)

        # Update overall progress
        self.total_nodes = sum(layer["total"] for layer in self.layer_stats)
        self.processed_nodes = sum(layer["processed"] for layer in self.layer_stats)


def main():
    app = RecursiveAnalysisUI()
    app.render_controls()


if __name__ == "__main__":
    main()
