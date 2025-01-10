import modal
from core.analysis import AnalysisWorker
from core.models.analysis import AnalysisResult, AnalysisTriggerInput
from core.utils.convex import ConvexClient, get_convex
from core.utils.rprint import rlog as log
from remote.image import image

app = modal.App("analysis-worker")

TIMEOUT_MINUTES = 60


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("yaolab")],
    timeout=60 * TIMEOUT_MINUTES,
)
async def run_analysis_workflow(
    input: AnalysisTriggerInput, convex_token: str
) -> AnalysisResult:
    """
    Process the analysis workflow.

    This function orchestrates the analysis pipeline:
    1. Load data
    2. Create ion interaction matrix
    3. Create similarity matrix
    4. Combine matrices and extract edges
    5. Calculate edge metrics
    6. Edge value matching
    7. Postprocessing
    8. Upload results

    Args:
        input: Parameters for analysis processing

    Returns:
        AnalysisResult containing nodes and edges
    """
    try:
        convex: ConvexClient = get_convex(convex_token)
        worker = AnalysisWorker(
            id=input.id,
            convex=convex,
        )
        await worker.run()
        log("Analysis completed successfully")
        return AnalysisResult(nodes=worker.nodes, edges=worker.edges)

    except Exception as e:
        log(f"Analysis workflow failed: {str(e)}")
        raise
