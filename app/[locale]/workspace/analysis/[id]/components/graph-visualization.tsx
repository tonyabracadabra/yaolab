"use client";

import { Slider } from "@/components/ui/slider";
import * as d3 from "d3-force";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ForceGraph2D } from "react-force-graph";
import type {
  EdgeKey,
  ForceGraphEdge,
  ForceGraphNode,
  GraphData,
  NodeKey,
} from "../types";
import { EdgeDetailsCard } from "./edge-details-card";
import { NodeDetailsCard } from "./node-details-card";

interface GraphVisualizationProps {
  graphData: GraphData;
  nodeLabel: NodeKey;
  edgeLabel: EdgeKey;
  nodeIdtoSizes: Map<string, number>;
  ratioModeEnabled: boolean;
  ratioColColors?: { col: string; color: string }[];
  highlightRedundant: boolean;
  connectedComponents: string[][];
  highlightIsf: boolean;
}

export function GraphVisualization({
  graphData,
  nodeLabel,
  edgeLabel,
  nodeIdtoSizes,
  ratioModeEnabled,
  ratioColColors,
  highlightRedundant,
  connectedComponents,
  highlightIsf,
}: GraphVisualizationProps) {
  const { theme } = useTheme();
  const fgRef = useRef<any>();
  const [selectedNode, setSelectedNode] = useState<ForceGraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ForceGraphEdge | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [minimapCanvas, setMinimapCanvas] = useState<HTMLCanvasElement | null>(
    null
  );

  // Memoize graph data transformation
  const processedGraphData = useMemo(
    () => ({
      nodes: graphData.nodes.map((node) => ({
        ...node,
        x: 0,
        y: 0,
      })) as ForceGraphNode[],
      links: graphData.edges.map((edge) => ({
        ...edge,
        source: graphData.nodes.find(
          (n) => n.id === edge.id1
        ) as ForceGraphNode,
        target: graphData.nodes.find(
          (n) => n.id === edge.id2
        ) as ForceGraphNode,
      })) as ForceGraphEdge[],
    }),
    [graphData]
  );

  // Cache for node sizes to avoid recalculation
  const nodeSizesCache = useMemo(() => {
    const cache = new Map<string, number>();
    processedGraphData.nodes.forEach((node) => {
      const baseSize = nodeIdtoSizes?.get(node.id) || 8;
      cache.set(node.id, baseSize);
    });
    return cache;
  }, [processedGraphData.nodes, nodeIdtoSizes]);

  // Memoize font sizes for labels
  const fontSizesCache = useMemo(() => {
    const cache = new Map<string, number>();
    processedGraphData.nodes.forEach((node) => {
      const baseSize = nodeIdtoSizes?.get(node.id) || 8;
      const fontSize = Math.max(6, baseSize * 0.7);
      cache.set(node.id, fontSize);
    });
    return cache;
  }, [processedGraphData.nodes, nodeIdtoSizes]);

  // Memoize node rendering function to avoid recreating it on every render
  const nodeCanvasObject = useCallback(
    (
      node: ForceGraphNode,
      ctx: CanvasRenderingContext2D,
      globalScale: number
    ) => {
      if (!nodeIdtoSizes) return;

      const size = nodeSizesCache.get(node.id) || 8;
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const isSelected = selectedNode?.id === node.id;

      if (ratioModeEnabled && ratioColColors) {
        let startAngle = 0;

        // Calculate total value once per node
        const totalValue = ratioColColors.reduce(
          (sum, { col }) => sum + Number(node[col] || 0),
          0
        );

        // Draw segments
        ratioColColors.forEach(({ col, color }) => {
          const value = Number(node[col] || 0);
          if (value > 0) {
            const sliceAngle = (value / totalValue) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arc(x, y, size, startAngle, startAngle + sliceAngle);
            ctx.closePath();

            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = theme === "dark" ? "#1e293b" : "#f8fafc";
            ctx.lineWidth = 0.5;
            ctx.stroke();

            startAngle += sliceAngle;
          }
        });
      } else {
        // Regular node drawing with glow effect for selected nodes
        if (isSelected) {
          // Create intense pulsing glow effect with multiple layers
          const time = Date.now() * 0.001; // Convert to seconds
          const pulseIntensity = Math.sin(time * 3) * 8 + 25; // Pulsing between 17 and 33

          // First glow layer - intense blue
          ctx.shadowColor = "#4f46e5";
          ctx.shadowBlur = pulseIntensity * 1.5;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Second glow layer - lighter blue
          ctx.shadowColor = "#818cf8";
          ctx.shadowBlur = pulseIntensity;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Third glow layer - white core
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = pulseIntensity * 0.5;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);

        ctx.fillStyle = isSelected
          ? "#4f46e5"
          : theme === "dark"
            ? "#ffffff"
            : "#f8fafc";
        ctx.strokeStyle = isSelected
          ? "#818cf8"
          : theme === "dark"
            ? "#94a3b8"
            : "#64748b";

        ctx.fill();
        ctx.lineWidth = isSelected ? 2 : 1.5;
        ctx.stroke();

        // Reset shadow
        if (isSelected) {
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }
      }

      // Prototype indicator
      if (node.isPrototype) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Node label with fixed size
      const label =
        typeof node[nodeLabel] === "number"
          ? Number(node[nodeLabel]).toFixed(2)
          : String(node[nodeLabel]);

      const fontSize = fontSizesCache.get(node.id) || 6;
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.strokeStyle = theme === "dark" ? "#000000" : "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.strokeText(label, x, y);
      ctx.fillStyle = theme === "dark" ? "#ffffff" : "#000000";
      ctx.fillText(label, x, y);
    },
    [
      nodeIdtoSizes,
      ratioModeEnabled,
      ratioColColors,
      selectedNode,
      theme,
      nodeLabel,
      nodeSizesCache,
      fontSizesCache,
    ]
  );

  // Memoize pointer area painting
  const nodePointerAreaPaint = useCallback(
    (node: ForceGraphNode, color: string, ctx: CanvasRenderingContext2D) => {
      const size = (nodeSizesCache.get(node.id) || 8) + 2;
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    [nodeSizesCache]
  );

  const handleRenderMinimap = useCallback(() => {
    if (!minimapCanvas || !fgRef.current) return;

    const ctx = minimapCanvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    // Set background
    ctx.fillStyle = theme === "dark" ? "#1e293b" : "#f8fafc";
    ctx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    // Get graph boundaries
    const graphBounds = fgRef.current.getGraphBbox();
    if (!graphBounds) return;

    // Calculate scale to fit minimap
    const scale =
      Math.min(
        minimapCanvas.width / (graphBounds.x[1] - graphBounds.x[0]),
        minimapCanvas.height / (graphBounds.y[1] - graphBounds.y[0])
      ) * 0.9;

    // Draw edges first
    processedGraphData.links.forEach((link) => {
      if (!link.source || !link.target) return;
      ctx.beginPath();
      const x1 =
        ((link.source.x ?? 0) - graphBounds.x[0]) * scale +
        minimapCanvas.width * 0.05;
      const y1 =
        ((link.source.y ?? 0) - graphBounds.y[0]) * scale +
        minimapCanvas.height * 0.05;
      const x2 =
        ((link.target.x ?? 0) - graphBounds.x[0]) * scale +
        minimapCanvas.width * 0.05;
      const y2 =
        ((link.target.y ?? 0) - graphBounds.y[0]) * scale +
        minimapCanvas.height * 0.05;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle =
        theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";
      ctx.stroke();
    });

    // Draw nodes on top
    processedGraphData.nodes.forEach((node) => {
      ctx.beginPath();
      const x =
        ((node.x ?? 0) - graphBounds.x[0]) * scale + minimapCanvas.width * 0.05;
      const y =
        ((node.y ?? 0) - graphBounds.y[0]) * scale +
        minimapCanvas.height * 0.05;
      ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = theme === "dark" ? "#ffffff" : "#000000";
      ctx.fill();
    });

    // Draw viewport rectangle
    const transform = fgRef.current.screen2GraphCoords(0, 0);
    const transform2 = fgRef.current.screen2GraphCoords(
      fgRef.current.width,
      fgRef.current.height
    );

    // Calculate viewport rectangle coordinates
    const viewX1 =
      (transform.x - graphBounds.x[0]) * scale + minimapCanvas.width * 0.05;
    const viewY1 =
      (transform.y - graphBounds.y[0]) * scale + minimapCanvas.height * 0.05;
    const viewX2 =
      (transform2.x - graphBounds.x[0]) * scale + minimapCanvas.width * 0.05;
    const viewY2 =
      (transform2.y - graphBounds.y[0]) * scale + minimapCanvas.height * 0.05;

    // Draw viewport rectangle
    ctx.beginPath();
    ctx.rect(
      Math.min(viewX1, viewX2),
      Math.min(viewY1, viewY2),
      Math.abs(viewX2 - viewX1),
      Math.abs(viewY2 - viewY1)
    );
    ctx.strokeStyle = theme === "dark" ? "#60a5fa" : "#3b82f6"; // Blue color
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [minimapCanvas, processedGraphData, theme]);

  useEffect(() => {
    if (!fgRef.current) return;

    // Configure forces for a more natural and clustered layout
    fgRef.current.d3Force("charge").strength(-200).distanceMax(200);

    fgRef.current
      .d3Force("link")
      .distance((link: ForceGraphEdge) => {
        return link.redundantData || link.isIsf ? 40 : 60;
      })
      .strength((link: ForceGraphEdge) => {
        return link.redundantData || link.isIsf ? 2 : 1;
      });

    fgRef.current.d3Force("center").strength(1);

    fgRef.current.d3Force(
      "collision",
      d3
        .forceCollide()
        .radius((node: any) => (nodeIdtoSizes?.get(node.id) || 8) * 1.2)
        .strength(0.8)
    );

    // Wrap the initial zoom in both setTimeout and requestAnimationFrame
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(400, 50);
          handleRenderMinimap();
        }
      });
    }, 500); // Increased timeout to ensure graph is ready

    return () => clearTimeout(timer);
  }, [graphData, handleRenderMinimap, nodeIdtoSizes]);

  // Add zoom level control
  useEffect(() => {
    if (!fgRef.current) return;
    fgRef.current.zoom(zoomLevel);
  }, [zoomLevel]);

  const handleNodeClick = useCallback(
    (node: ForceGraphNode, event: MouseEvent) => {
      if (!node.id || !fgRef.current) return;

      setSelectedNode(node);
      setSelectedEdge(null);

      // Wrap zoom operation in requestAnimationFrame
      requestAnimationFrame(() => {
        if (!fgRef.current) return;

        const zoomDuration = 1000;
        const padding = 50;

        if (connectedComponents?.length) {
          const component = connectedComponents.find((cc) =>
            cc.includes(node.id)
          );
          fgRef.current.zoomToFit(zoomDuration, padding, (n: { id: string }) =>
            component?.includes(n.id)
          );
        } else {
          fgRef.current.zoomToFit(zoomDuration, padding);
        }
      });
    },
    [connectedComponents]
  );

  const getEdgeColor = (edge: ForceGraphEdge) => {
    if (edge.redundantData && highlightRedundant) {
      return theme === "dark" ? "#f87171" : "#dc2626"; // Brighter red for dark mode
    }
    if (edge.isIsf && highlightIsf) {
      return theme === "dark" ? "#a78bfa" : "#7c3aed"; // Brighter purple for dark mode
    }
    // Default edge color with better contrast in both modes
    return theme === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.5)";
  };

  const getEdgeStyle = (edge: ForceGraphEdge) => {
    if (edge.isIsf && highlightIsf) {
      return [10, 4]; // Dashed line for ISF
    }
    return undefined;
  };

  const getEdgeLabelBackground = () => {
    return theme === "dark" ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.9)";
  };

  const handleLinkClick = (link: ForceGraphEdge) => {
    setSelectedEdge(link);
    setSelectedNode(null);
  };

  const handleZoom = (transform: { k: number; x: number; y: number }) => {
    setZoomLevel(transform.k);
  };

  return (
    <div className="relative w-full h-full">
      <ForceGraph2D
        ref={fgRef}
        graphData={processedGraphData}
        onNodeClick={handleNodeClick}
        nodeId="id"
        linkSource="id1"
        linkTarget="id2"
        linkWidth={1.5}
        backgroundColor="transparent"
        onEngineStop={handleRenderMinimap}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        linkCanvasObject={(link: ForceGraphEdge, ctx) => {
          if (!link.source || !link.target) return;

          const isSelected =
            selectedEdge?.id1 === link.id1 && selectedEdge?.id2 === link.id2;

          if (isSelected) {
            // Create intense pulsing glow effect with multiple layers
            const time = Date.now() * 0.001;
            const pulseIntensity = Math.sin(time * 3) * 5 + 15; // Pulsing between 10 and 20

            // Layer 1 - Outer glow
            ctx.shadowColor = "#4f46e5";
            ctx.shadowBlur = pulseIntensity * 2;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Layer 2 - Inner glow
            ctx.shadowColor = "#818cf8";
            ctx.shadowBlur = pulseIntensity;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Layer 3 - Core glow
            ctx.shadowColor = "#c7d2fe";
            ctx.shadowBlur = pulseIntensity * 0.5;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }

          ctx.beginPath();
          ctx.setLineDash(getEdgeStyle(link) || []);
          ctx.moveTo(link.source.x ?? 0, link.source.y ?? 0);
          ctx.lineTo(link.target.x ?? 0, link.target.y ?? 0);
          ctx.strokeStyle = isSelected ? "#4f46e5" : getEdgeColor(link);
          ctx.lineWidth = isSelected ? 2.5 : theme === "dark" ? 1.5 : 1;
          ctx.stroke();
          ctx.setLineDash([]); // Reset dash pattern

          // Reset shadow
          if (isSelected) {
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
          }

          // Edge label
          const label =
            typeof link[edgeLabel] === "number"
              ? link[edgeLabel].toFixed(2)
              : String(link[edgeLabel]);

          const midX = ((link.source.x ?? 0) + (link.target.x ?? 0)) / 2;
          const midY = ((link.source.y ?? 0) + (link.target.y ?? 0)) / 2;

          ctx.font = "3px Inter";
          const metrics = ctx.measureText(label);
          const padding = 2;

          // Label background with pulsing glow if selected
          ctx.fillStyle = getEdgeLabelBackground();
          if (isSelected) {
            const time = Date.now() * 0.001;
            const pulseIntensity = Math.sin(time * 2) * 2 + 6; // Pulsing between 4 and 8

            ctx.shadowColor = "#4f46e5";
            ctx.shadowBlur = pulseIntensity;
          }
          ctx.fillRect(
            midX - (metrics.width + padding) / 2,
            midY - (4 + padding) / 2,
            metrics.width + padding,
            4 + padding
          );

          // Reset shadow for text
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;

          // Label text
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = isSelected
            ? "#4f46e5"
            : theme === "dark"
              ? "#ffffff"
              : "#000000";
          ctx.fillText(label, midX, midY);
        }}
        onLinkClick={handleLinkClick}
        onZoom={handleZoom}
      />

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 flex items-center gap-4 flex-col">
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg border shadow-sm">
          <MinusIcon
            className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onClick={() => {
              const newZoom = Math.max(0.1, zoomLevel - 0.1);
              setZoomLevel(newZoom);
              fgRef.current?.zoom(newZoom);
            }}
          />
          <Slider
            value={[zoomLevel]}
            onValueChange={([value]) => {
              setZoomLevel(value);
              fgRef.current?.zoom(value);
            }}
            min={0.1}
            max={2}
            step={0.1}
            className="w-24"
          />
          <PlusIcon
            className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onClick={() => {
              const newZoom = Math.min(2, zoomLevel + 0.1);
              setZoomLevel(newZoom);
              fgRef.current?.zoom(newZoom);
            }}
          />
        </div>
      </div>

      {selectedNode && (
        <NodeDetailsCard
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
      {selectedEdge && (
        <EdgeDetailsCard
          edge={selectedEdge}
          onClose={() => {
            setSelectedEdge(null);
          }}
        />
      )}
    </div>
  );
}
