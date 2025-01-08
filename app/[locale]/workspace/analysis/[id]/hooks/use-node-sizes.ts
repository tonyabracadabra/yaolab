import { useMemo } from "react";
import type { GraphData } from "../types";

export function useNodeSizes(
  graphData: GraphData | undefined,
  nodeSize: string
) {
  return useMemo(() => {
    if (!graphData) return;

    const nodeSizes = graphData.nodes
      .map((node) => node[nodeSize as "mz" | "rt"])
      .filter((size): size is number => size !== undefined);

    const minSize = Math.min(...nodeSizes);
    const maxSize = Math.max(...nodeSizes);
    const res = new Map<string, number>();

    for (const node of graphData.nodes) {
      const value = node[nodeSize as "rt" | "mz"];
      if (typeof value !== "number") continue;

      const normalized = (value - minSize) / (maxSize - minSize);
      res.set(node.id, normalized * 10 + 5);
    }

    return res;
  }, [graphData, nodeSize]);
}
