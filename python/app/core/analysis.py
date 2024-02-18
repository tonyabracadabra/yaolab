from typing import Any, Callable

import numpy as np
import pandas as pd
from app.models.analysis import Analysis, AnalysisStatus
from app.utils.constants import TargetIonsColumn
from pydantic import BaseModel
from scipy.sparse import coo_matrix

from convex import ConvexClient


class AnalysisWorker(BaseModel):
    id: str
    convex: ConvexClient
    analysis: Analysis

    class Config:
        arbitrary_types_allowed = True

    def _convex_mutation_wrapper(self, step: str, status: AnalysisStatus) -> None:
        self.convex.mutation(
            "analyses:updateStepStatus",
            {"id": self.id, "step": step, status: AnalysisStatus},
        )

    async def _run_step(self, func: Callable[..., Any], *args, **kwargs) -> Any:
        """
        Executes a step function with the provided arguments, automatically inferring the step name from the function name.
        Handles the Convex mutations for step start and completion.
        """
        step = func.__name__
        self._convex_mutation_wrapper(step=step, status=AnalysisStatus.RUNNING)
        try:
            result = await func(*args, **kwargs)
            self._convex_mutation_wrapper(step=step, status=AnalysisStatus.COMPLETE)
        except Exception as e:
            self._convex_mutation_wrapper(step=step, status=AnalysisStatus.FAILED)
            raise e
        return result

    async def run(self) -> None:
        from app.core.steps import (
            calculate_edge_metrics,
            combine_matrices_and_extract_edges,
            create_ion_interaction_matrix,
            create_similarity_matrix,
            edge_value_matching,
            load_data,
            postprocessing,
            upload_result,
        )

        config = self.analysis.config

        spectra, targeted_ions_df, reaction_df = await self._run_step(
            load_data, self.analysis, convex=self.convex
        )

        samples_df = targeted_ions_df[TargetIonsColumn.SAMPLE]
        targeted_ions_df = targeted_ions_df[""]
        ids: np.ndarray = targeted_ions_df[TargetIonsColumn.ID].values

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

        edges_raw: pd.DataFrame = await self._run_step(
            combine_matrices_and_extract_edges,
            ion_interaction_matrix,
            similarity_matrix,
            ids,
            ms2_similarity_threshold=config.ms2SimilarityThreshold,
        )

        edges_with_metrics = await self._run_step(
            calculate_edge_metrics,
            samples_df,
            targeted_ions_df,
            edges_raw,
        )

        edges = await self._run_step(
            edge_value_matching,
            edges_with_metrics,
            reaction_df,
            rt_time_window=config.rtTimeWindow,
            mz_error_threshold=config.mzErrorThreshold,
            correlation_threshold=config.correlationThreshold,
        )

        edges, nodes = await self._run_step(
            postprocessing,
            targeted_ions_df=targeted_ions_df,
            samples_df=samples_df,
            edges=edges,
            bio_samples=config.bioSamples,
            drug_sample=config.drugSample,
        )

        await self._run_step(upload_result, self.id, nodes, edges, convex=self.convex)
