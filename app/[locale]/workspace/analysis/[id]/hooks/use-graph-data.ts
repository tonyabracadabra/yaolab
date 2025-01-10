import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import Papa from "papaparse";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Edge, GraphData, Node } from "../types";

interface GraphDataState {
  original: GraphData | undefined;
  filtered: GraphData | undefined;
  error: Error | null;
}

export function useGraphData(
  result: { edges: string; nodes: string } | undefined
) {
  const [state, setState] = useState<GraphDataState>({
    original: undefined,
    filtered: undefined,
    error: null,
  });
  const processingRef = useRef(false);
  const generateDownloadUrl = useAction(api.actions.generateDownloadUrl);
  const [highlightIsf, setHighlightIsf] = useState(false);

  const processGraphData = useCallback(
    async (edgesText: string, nodesText: string): Promise<GraphData> => {
      const parseConfig = {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transform: (value: string, field: string) => {
          if (!value) return value;

          if (field === "msmsSpectrum") {
            const cleanStr = value.trim().replace(/\s+/g, "");
            return JSON.parse(cleanStr) as Array<[number, number]>;
          }

          // Simplified boolean conversion
          return ["true", "false"].includes(value.toLowerCase())
            ? value.toLowerCase() === "true"
            : value;
        },
      };

      // Parse both files concurrently
      const [{ data: edgesRaw }, { data: nodesRaw }] = await Promise.all([
        Papa.parse<Edge>(edgesText, parseConfig),
        Papa.parse<Node>(nodesText, parseConfig),
      ]);

      if (!edgesRaw.length || !nodesRaw.length) {
        throw new Error("Empty graph data received");
      }

      // Create nodes map with string IDs
      const nodesMap = new Map(
        nodesRaw
          .filter((n): n is Node => Boolean(n?.id))
          .map((n) => [`${n.id}`, { ...n, id: `${n.id}` }])
      );

      // Process edges to identify ISF edges
      const validatedEdges = edgesRaw
        .filter((e): e is Edge => {
          const id1 = `${e?.id1}`;
          const id2 = `${e?.id2}`;
          return Boolean(id1 && id2 && nodesMap.has(id1) && nodesMap.has(id2));
        })
        .map((e) => {
          const source = nodesMap.get(`${e.id1}`);
          const target = nodesMap.get(`${e.id2}`);

          // Check ISF conditions
          const isIsf =
            source &&
            target &&
            Math.abs(source.rt - target.rt) <= 0.02 && // RT diff ≤ 0.02 min
            source.mz < target.mz && // smaller m/z appears in larger m/z MS2
            target.msmsSpectrum.some(
              ([mz]) => Math.abs(mz - source.mz) <= 0.01
            ); // tolerance of 0.01

          return {
            ...e,
            id1: `${e.id1}`,
            id2: `${e.id2}`,
            isIsf,
          };
        });

      return {
        nodes: Array.from(nodesMap.values()),
        edges: validatedEdges,
      };
    },
    []
  );

  const fetchAndProcessData = useCallback(async () => {
    if (!result || processingRef.current) return;
    processingRef.current = true;

    try {
      // Fetch URLs concurrently
      const [edgesUrl, nodesUrl] = await Promise.all([
        generateDownloadUrl({ storageId: result.edges }),
        generateDownloadUrl({ storageId: result.nodes }),
      ]).then((urls) => urls.map((url) => url.signedUrl));

      if (!edgesUrl || !nodesUrl) {
        throw new Error("Failed to generate download URLs");
      }

      // Fetch data with error handling
      const [edgesResponse, nodesResponse] = await Promise.all([
        fetch(edgesUrl),
        fetch(nodesUrl),
      ]);

      if (!edgesResponse.ok || !nodesResponse.ok) {
        throw new Error("Failed to fetch graph data");
      }

      const [edgesText, nodesText] = await Promise.all([
        edgesResponse.text(),
        nodesResponse.text(),
      ]);

      const processedData = await processGraphData(edgesText, nodesText);

      setState({
        original: processedData,
        filtered: processedData,
        error: null,
      });
    } catch (error) {
      console.error("Graph data processing error:", error);
      setState((prev) => ({ ...prev, error: error as Error }));
      toast.error(
        error instanceof Error ? error.message : "Failed to process graph data"
      );
      setState({ original: undefined, filtered: undefined, error: null });
    } finally {
      processingRef.current = false;
    }
  }, [result, generateDownloadUrl, processGraphData]);

  useEffect(() => {
    fetchAndProcessData();
  }, [fetchAndProcessData]);

  const connectedComponents = useMemo(() => {
    if (!state.filtered?.nodes || !state.filtered?.edges) return [];

    const adjList = new Map<string, Set<string>>();
    const visited = new Set<string>();
    const components: string[][] = [];

    // Initialize adjacency list
    state.filtered.nodes.forEach((node) => {
      adjList.set(node.id, new Set());
    });

    // Build undirected graph
    state.filtered.edges.forEach((edge) => {
      if (!edge.id1 || !edge.id2) return;
      adjList.get(edge.id1)?.add(edge.id2);
      adjList.get(edge.id2)?.add(edge.id1);
    });

    // Optimized BFS implementation
    const bfs = (startId: string): string[] => {
      const component: string[] = [];
      const queue = [startId];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;

        visited.add(current);
        component.push(current);

        adjList.get(current)?.forEach((neighbor) => {
          if (!visited.has(neighbor)) queue.push(neighbor);
        });
      }

      return component;
    };

    // Find all components
    state.filtered.nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        components.push(bfs(node.id));
      }
    });

    return components;
  }, [state.filtered]);

  const graphsWithPrototype = useMemo(() => {
    if (!state.filtered?.nodes || !state.filtered?.edges) return;

    // Find components with prototype nodes
    const componentsWithPrototype = connectedComponents.filter((component) =>
      state.filtered!.nodes.some(
        (node) => component.includes(node.id) && node.isPrototype
      )
    );

    if (componentsWithPrototype.length === 0) return state.filtered;

    // Create efficient lookup for nodes to keep
    const nodeIds = new Set(componentsWithPrototype.flat());

    return {
      nodes: state.filtered.nodes.filter((node) => nodeIds.has(node.id)),
      edges: state.filtered.edges.filter(
        (edge) => nodeIds.has(edge.id1) && nodeIds.has(edge.id2)
      ),
    };
  }, [connectedComponents, state.filtered]);

  const setGraphData = useCallback((newData: GraphData | undefined) => {
    setState((prev) => ({
      original: prev.original,
      filtered: newData,
      error: null,
    }));
  }, []);

  return {
    oriGraphData: state.original,
    graphData: state.filtered,
    setGraphData,
    connectedComponents,
    graphsWithPrototype,
    error: state.error,
    highlightIsf,
    setHighlightIsf,
  };
}
