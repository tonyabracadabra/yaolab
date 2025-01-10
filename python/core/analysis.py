from typing import Any, Callable

import numpy as np
import pandas as pd
from pydantic import BaseModel
from scipy.sparse import coo_matrix

from convex import ConvexClient
from core.models.analysis import Analysis, AnalysisStatus
from core.utils.constants import TargetIonsColumn


class AnalysisWorker(BaseModel):
    id: str
    convex: ConvexClient

    class Config:
        arbitrary_types_allowed = True

    def _convex_mutation_wrapper(self, step: str, status: AnalysisStatus) -> None:
        self.convex.mutation(
            "analyses:updateStepStatus",
            {"id": self.id, "step": step, "status": status},
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
        from core.steps import (
            calculate_edge_metrics,
            combine_matrices_and_extract_edges,
            create_ion_interaction_matrix,
            create_similarity_matrix,
            edge_value_matching,
            load_data,
            postprocessing,
            upload_result,
        )

        analysis_raw = self.convex.query("analyses:get", {"id": self.id})

        try:
            analysis = Analysis(**analysis_raw)
            config = analysis.config
            spectra, targeted_ions_df, samples_df, reaction_df = await self._run_step(
                load_data, analysis, convex=self.convex
            )

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

            await self._run_step(
                upload_result, self.id, nodes, edges, convex=self.convex
            )

        except Exception as e:
            print(f"Analysis workflow failed: {e}")
            raise
