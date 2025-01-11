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

  // Add cache ref to avoid recomputation
  const computationCacheRef = useRef<{
    components?: string[][];
    graphsWithPrototype?: GraphData;
    lastFilteredData?: GraphData;
    parsedData: { [key: string]: GraphData };
  }>({
    parsedData: {},
  });

  const processGraphData = useCallback(
    async (edgesText: string, nodesText: string): Promise<GraphData> => {
      // Add parsing cache
      const cacheKey = `${edgesText.length}-${nodesText.length}`;
      if (computationCacheRef.current.parsedData[cacheKey]) {
        return computationCacheRef.current.parsedData[cacheKey];
      }

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

      // Cache the result
      computationCacheRef.current.parsedData[cacheKey] = {
        nodes: Array.from(nodesMap.values()),
        edges: validatedEdges,
      };

      return computationCacheRef.current.parsedData[cacheKey];
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

  // Memoize connectedComponents computation
  const connectedComponents = useMemo(() => {
    if (!state.filtered?.nodes || !state.filtered?.edges) return [];

    // Return cached result if filtered data hasn't changed
    if (
      computationCacheRef.current.components &&
      computationCacheRef.current.lastFilteredData === state.filtered
    ) {
      return computationCacheRef.current.components;
    }

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

    // Cache the result
    computationCacheRef.current.components = components;
    computationCacheRef.current.lastFilteredData = state.filtered;
    return components;
  }, [state.filtered]);

  // Add this helper function for component layout
  const layoutComponents = (
    components: string[][],
    nodes: Node[]
  ): Map<string, { x: number; y: number; forceStrength: number }> => {
    const positions = new Map<
      string,
      { x: number; y: number; forceStrength: number }
    >();
    const spacing = 600; // Increased spacing between components

    const sortedComponents = [...components].sort(
      (a, b) => b.length - a.length
    );
    const cols = Math.ceil(Math.sqrt(sortedComponents.length));
    const rows = Math.ceil(sortedComponents.length / cols);

    sortedComponents.forEach((component, componentIndex) => {
      const row = Math.floor(componentIndex / cols);
      const col = componentIndex % cols;
      const centerX = (col - cols / 2) * spacing;
      const centerY = (row - rows / 2) * spacing;

      // Position prototype nodes with very light constraints
      const prototypeNodes = component.filter(
        (id) => nodes.find((n) => n.id === id)?.isPrototype
      );

      prototypeNodes.forEach((nodeId, index) => {
        // More random initial positions for prototypes
        const angle = (index / prototypeNodes.length) * 2 * Math.PI;
        const radius = 30 + Math.random() * 20;
        positions.set(nodeId, {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          forceStrength: 0.2, // Light fixing for prototypes
        });
      });

      // Position other nodes with very weak constraints
      const remainingNodes = component.filter(
        (id) => !prototypeNodes.includes(id)
      );
      remainingNodes.forEach((nodeId) => {
        const connectedProtos = prototypeNodes.filter((protoId) =>
          state.filtered!.edges.some(
            (e) =>
              (e.id1 === nodeId && e.id2 === protoId) ||
              (e.id2 === nodeId && e.id1 === protoId)
          )
        );

        if (connectedProtos.length > 0) {
          // Position near connected prototypes with more randomness
          const avgPos = connectedProtos.reduce(
            (acc, protoId) => {
              const pos = positions.get(protoId)!;
              return { x: acc.x + pos.x, y: acc.y + pos.y };
            },
            { x: 0, y: 0 }
          );

          positions.set(nodeId, {
            x: avgPos.x / connectedProtos.length + (Math.random() - 0.5) * 40,
            y: avgPos.y / connectedProtos.length + (Math.random() - 0.5) * 40,
            forceStrength: 0.1, // Very weak fixing for connected nodes
          });
        } else {
          // Random position within component area
          const radius = 50 + Math.random() * 30;
          const angle = Math.random() * 2 * Math.PI;
          positions.set(nodeId, {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            forceStrength: 0.05, // Almost no fixing for unconnected nodes
          });
        }
      });
    });

    return positions;
  };

  // Update graphsWithPrototype to use force strengths
  const graphsWithPrototype = useMemo(() => {
    if (!state.filtered?.nodes || !state.filtered?.edges) return;

    if (
      computationCacheRef.current.graphsWithPrototype &&
      computationCacheRef.current.lastFilteredData === state.filtered
    ) {
      return computationCacheRef.current.graphsWithPrototype;
    }

    const componentsWithPrototype = connectedComponents.filter((component) =>
      state.filtered!.nodes.some(
        (node) => component.includes(node.id) && node.isPrototype
      )
    );

    if (componentsWithPrototype.length === 0) {
      computationCacheRef.current.graphsWithPrototype = state.filtered;
      return state.filtered;
    }

    const positions = layoutComponents(
      componentsWithPrototype,
      state.filtered.nodes
    );
    const nodeIds = new Set(componentsWithPrototype.flat());

    const result = {
      nodes: state.filtered.nodes
        .map((node) => {
          const pos = positions.get(node.id);
          return {
            ...node,
            x: pos?.x ?? 0,
            y: pos?.y ?? 0,
            // Only very lightly fix positions
            fx: pos?.forceStrength ? pos.x : undefined,
            fy: pos?.forceStrength ? pos.y : undefined,
            // Add very weak force strength
            forceStrength: pos?.forceStrength ?? 0.05,
          };
        })
        .filter((node) => nodeIds.has(node.id)),
      edges: state.filtered.edges.filter(
        (edge) => nodeIds.has(edge.id1) && nodeIds.has(edge.id2)
      ),
    };

    computationCacheRef.current.graphsWithPrototype = result;
    return result;
  }, [state.filtered, connectedComponents]);

  // Reset cache when data changes
  useEffect(() => {
    computationCacheRef.current = {
      parsedData: {},
    };
  }, [result]);

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
