import app.core.steps as steps
import numpy as np
import pandas as pd
from app.models.analysis import Analysis
from app.utils.constants import ID_COL, SAMPLE_COL
from app.utils.logger import logger, with_logging_and_context
from pydantic import BaseModel
from scipy.sparse import coo_matrix

from convex import ConvexClient


class AnalysisWorker(BaseModel):
    id: str
    convex: ConvexClient
    analysis: Analysis

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        log_and_context = with_logging_and_context(self.convex, self.id)
        # Apply decorator to all functions in steps module
        for name in steps.__all__:
            func = getattr(steps, name, None)
            if callable(func):
                decorated_func = log_and_context(func)
                setattr(steps, name, decorated_func)
                logger.info(f"Decorated {name} with log_and_context, {decorated_func}")

    class Config:
        arbitrary_types_allowed = True

    async def run(self) -> None:
        from app.core.steps import (
            calculate_edge_metrics,
            combine_matrices_and_extract_edges,
            create_ion_interaction_matrix,
            create_similarity_matrix,
            edge_value_matching,
            load_data,
            upload_result,
        )

        config = self.analysis.config
        spectra, targeted_ions_df, reaction_df = await load_data(
            self.analysis, convex=self.convex
        )
        samples_df = targeted_ions_df[SAMPLE_COL]
        targeted_ions_df = targeted_ions_df[""]
        ids: np.ndarray = targeted_ions_df[ID_COL].values

        ion_interaction_matrix: coo_matrix = await create_ion_interaction_matrix(
            targeted_ions_df,
            reaction_df,
            mz_error_threshold=self.analysis.config.mzErrorThreshold,
        )

        similarity_matrix: coo_matrix = await create_similarity_matrix(
            spectra,
            ids,
        )

        edges: pd.DataFrame = await combine_matrices_and_extract_edges(
            ion_interaction_matrix,
            similarity_matrix,
            ids,
            ms2_similarity_threshold=config.ms2SimilarityThreshold,
        )

        await calculate_edge_metrics(
            samples_df, targeted_ions_df, edges
        )

        await edge_value_matching(
            edges,
            reaction_df,
            rt_time_window=config.rtTimeWindow,
            mz_error_threshold=config.mzErrorThreshold,
            correlation_threshold=config.correlationThreshold,
        )
        nodes: pd.DataFrame = pd.concat([targeted_ions_df, samples_df], axis=1)

        await upload_result(id=self.id, nodes=nodes, edges=edges, convex=self.convex)
