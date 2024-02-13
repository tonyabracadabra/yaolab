from typing import Any, Callable

import numpy as np
import pandas as pd
from app.models.analysis import Analysis
from app.utils.constants import ID_COL, SAMPLE_COL, SOURCE_COL, TARGET_COL
from pydantic import BaseModel
from scipy.sparse import coo_matrix

from convex import ConvexClient


class AnalysisWorker(BaseModel):
    id: str
    convex: ConvexClient
    analysis: Analysis

    class Config:
        arbitrary_types_allowed = True

    def _convex_mutation_wrapper(self, step: str, action: str) -> None:
        mutation = f"analyses:{action}Step"
        self.convex.mutation(mutation, {"id": self.id, "step": step})

    async def _run_step(self, func: Callable[..., Any], *args, **kwargs) -> Any:
        """
        Executes a step function with the provided arguments, automatically inferring the step name from the function name.
        Handles the Convex mutations for step start and completion.
        """
        step_name = func.__name__
        self._convex_mutation_wrapper(step_name, "start")
        result = await func(*args, **kwargs)
        self._convex_mutation_wrapper(step_name, "complete")
        return result

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

        spectra, targeted_ions_df, reaction_df = await self._run_step(
            load_data, self.analysis, convex=self.convex
        )

        samples_df = targeted_ions_df[SAMPLE_COL]
        targeted_ions_df = targeted_ions_df[""]
        ids: np.ndarray = targeted_ions_df[ID_COL].values

        ion_interaction_matrix: coo_matrix = await self._run_step(
            create_ion_interaction_matrix,
            targeted_ions_df,
            reaction_df,
            mz_error_threshold=config.mzErrorThreshold,
        )

        similarity_matrix: coo_matrix = await self._run_step(
            create_similarity_matrix,
            spectra,
            ids,
        )

        edges: pd.DataFrame = await self._run_step(
            combine_matrices_and_extract_edges,
            ion_interaction_matrix,
            similarity_matrix,
            ids,
            ms2_similarity_threshold=config.ms2SimilarityThreshold,
        )

        await self._run_step(
            calculate_edge_metrics,
            samples_df,
            targeted_ions_df,
            edges,
        )

        await self._run_step(
            edge_value_matching,
            edges,
            reaction_df,
            rt_time_window=config.rtTimeWindow,
            mz_error_threshold=config.mzErrorThreshold,
            correlation_threshold=config.correlationThreshold,
        )

        nodes: pd.DataFrame = pd.concat([targeted_ions_df, samples_df], axis=1)
        # filter out nodes that are not in the edges
        nodes = nodes[
            nodes[ID_COL].isin(edges[[TARGET_COL, SOURCE_COL]].values.flatten())
        ]

        self.convex.mutation(
            "analyses:startStep", {"id": self.id, "step": "upload_result"}
        )
        await upload_result(id=self.id, nodes=nodes, edges=edges, convex=self.convex)
        self.convex.mutation(
            "analyses:completeStep", {"id": self.id, "step": "upload_result"}
        )
