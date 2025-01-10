import pandas as pd

from convex import ConvexClient
from core.models.analysis import AnalysisStatus
from core.utils.convex import upload_csv
from core.utils.logger import log


@log("Uploading result")
async def upload_result(
    id: str, nodes: pd.DataFrame, edges: pd.DataFrame, convex: ConvexClient
):
    edges_storage_id = upload_csv(edges, file_name="edges", convex=convex)
    nodes_storage_id = upload_csv(nodes, file_name="nodes", convex=convex)

    convex.mutation(
        "analyses:update",
        {
            "id": id,
            "result": {
                "nodes": nodes_storage_id,
                "edges": edges_storage_id,
            },
            "status": AnalysisStatus.COMPLETE,
        },
    )
