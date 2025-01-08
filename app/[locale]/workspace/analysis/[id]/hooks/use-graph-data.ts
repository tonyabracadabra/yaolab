import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";
import type { Edge, GraphData, Node } from "../types";

export function useGraphData(
  result: { edges: string; nodes: string } | undefined
) {
  const [oriGraphData, setOriGraphData] = useState<GraphData>();
  const [graphData, setGraphData] = useState<GraphData>();
  const generateDownloadUrl = useAction(api.actions.generateDownloadUrl);

  useEffect(() => {
    const fetchAndProcessData = async (result: {
      edges: string;
      nodes: string;
    }) => {
      try {
        const [edgesUrl, nodesUrl] = await Promise.all([
          generateDownloadUrl({ storageId: result.edges }).then(
            (data) => data.signedUrl
          ),
          generateDownloadUrl({ storageId: result.nodes }).then(
            (data) => data.signedUrl
          ),
        ]);

        const [edgesText, nodesText] = await Promise.all([
          fetch(edgesUrl).then((response) => response.text()),
          fetch(nodesUrl).then((response) => response.text()),
        ]);

        const parseConfig = {
          header: true,
          dynamicTyping: true,
          transform: function (value: string, field: string): any {
            if (value.toLowerCase() === "true") return true;
            if (value.toLowerCase() === "false") return false;
            return value;
          },
        };

        const edgesRaw = Papa.parse<Edge>(edgesText, parseConfig).data;
        const nodesRaw = Papa.parse<Node>(nodesText, parseConfig).data;

        const nodesIds = new Set(nodesRaw.map((n) => n.id));
        const edgesRawFiltered = edgesRaw.filter(
          (e) => nodesIds.has(e.id1) && nodesIds.has(e.id2)
        );

        const processedData = {
          nodes: nodesRaw.map((n) => ({ ...n, id: `${n.id}` })),
          edges: edgesRawFiltered.map((e) => ({
            ...e,
            id1: `${e.id1}`,
            id2: `${e.id2}`,
          })),
        };

        setOriGraphData(processedData);
        setGraphData(processedData);
      } catch (error) {
        console.error("Failed to fetch and process data", error);
      }
    };

    if (result) {
      fetchAndProcessData(result);
    }
  }, [result, generateDownloadUrl]);

  const connectedComponents = useMemo(() => {
    if (!oriGraphData) return [];

    const nodes = oriGraphData.nodes;
    const edges = oriGraphData.edges;
    const connectedComponents: string[][] = [];
    const visited = new Set<string>();
    const adjList = new Map<string, string[]>();

    for (const node of nodes) {
      adjList.set(node.id, []);
    }

    for (const edge of edges) {
      if (!edge.id1 || !edge.id2) continue;
      adjList.get(edge.id1)?.push(edge.id2);
      adjList.get(edge.id2)?.push(edge.id1);
    }

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        const connectedComponent: string[] = [];
        const queue = [node.id];

        while (queue.length > 0) {
          const curr = queue.shift()!;
          if (!visited.has(curr)) {
            visited.add(curr);
            connectedComponent.push(curr);
            for (const neighbor of adjList.get(curr) || []) {
              queue.push(neighbor);
            }
          }
        }

        connectedComponents.push(connectedComponent);
      }
    }

    return connectedComponents;
  }, [oriGraphData]);

  const graphsWithPrototype = useMemo(() => {
    if (!oriGraphData) return;

    const newNodes = [];
    const newEdges = [];

    for (const connectedComponent of connectedComponents) {
      const subgraphNodes = oriGraphData.nodes.filter((node) =>
        connectedComponent.includes(node.id)
      );

      const prototypeNode = subgraphNodes.find((node) => node.isPrototype);
      if (prototypeNode) {
        newNodes.push(...subgraphNodes);
        const subgraphEdges = oriGraphData.edges.filter(
          (edge) =>
            connectedComponent.includes(edge.id1) &&
            connectedComponent.includes(edge.id2)
        );
        newEdges.push(...subgraphEdges);
      }
    }

    return {
      nodes: newNodes,
      edges: newEdges,
    };
  }, [connectedComponents, oriGraphData]);

  return {
    oriGraphData,
    graphData,
    setGraphData,
    connectedComponents,
    graphsWithPrototype,
  };
}
