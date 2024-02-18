import pandas as pd
from app.models.analysis import BioSample, DrugSample
from app.utils.constants import EdgeColumn, TargetIonsColumn
from app.utils.logger import log


@log("post processing")
async def postprocessing(
    targeted_ions_df: pd.DataFrame,
    samples_df: pd.DataFrame,
    edges: pd.DataFrame,
    bio_samples: list[BioSample],
    drug_sample: DrugSample | None,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    nodes: pd.DataFrame = pd.concat([targeted_ions_df, samples_df], axis=1)
    # filter out nodes that are not in the edges
    nodes = nodes[
        nodes[TargetIonsColumn.ID].isin(
            edges[[EdgeColumn.ID1, EdgeColumn.ID2]].values.flatten()
        )
    ]

    exps = [e.name for e in bio_samples]
    if drug_sample:
        exps.append(drug_sample.name)

    ratios = [exp + "_ratio" for exp in exps]
    nodes[ratios] = nodes[exps].div(nodes[exps].sum(axis=1), axis=0)

    return edges, nodes
