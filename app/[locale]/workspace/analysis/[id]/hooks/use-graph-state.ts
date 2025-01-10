import { useEffect, useState } from "react";
import { kAvailableEdges, kAvailableNodes } from "../constants";
import type { EdgeKey, GraphData, NodeKey, RatioColorScheme } from "../types";

export function useGraphState(graphsWithPrototype: GraphData | undefined) {
  const [nodeLabel, setNodeLabel] = useState<NodeKey>(kAvailableNodes[0].key);
  const [edgeLabel, setEdgeLabel] = useState<EdgeKey>(kAvailableEdges[0].col);
  const [nodeSize, setNodeSize] = useState<NodeKey>(kAvailableNodes[1].key);
  const [ratioModeEnabled, setRatioModeEnabled] = useState(false);
  const [highlightRedundant, setHighlightRedundant] = useState(false);
  const [hideEndogenousSubgraphs, setHideEndogenousSubgraphs] = useState(true);
  const [colorScheme, setColorScheme] = useState<RatioColorScheme>("accent");
  const [graphData, setGraphData] = useState<GraphData>();

  useEffect(() => {
    if (hideEndogenousSubgraphs) {
      setGraphData(graphsWithPrototype);
    } else {
      setGraphData(graphsWithPrototype);
    }
  }, [hideEndogenousSubgraphs, graphsWithPrototype]);

  return {
    nodeLabel,
    setNodeLabel,
    edgeLabel,
    setEdgeLabel,
    nodeSize,
    setNodeSize,
    ratioModeEnabled,
    setRatioModeEnabled,
    highlightRedundant,
    setHighlightRedundant,
    hideEndogenousSubgraphs,
    setHideEndogenousSubgraphs,
    colorScheme,
    setColorScheme,
    graphData,
  };
}
