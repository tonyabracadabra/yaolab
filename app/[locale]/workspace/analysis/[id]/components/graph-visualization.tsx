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
    fgRef.current
      .d3Force("charge")
      .strength(-200) // Stronger repulsion between nodes
      .distanceMax(200); // Larger max distance for better spread

    fgRef.current
      .d3Force("link")
      .distance((link: ForceGraphEdge) => {
        // Shorter distances for connected nodes
        return link.redundantData || link.isIsf ? 40 : 60;
      })
      .strength((link: ForceGraphEdge) => {
        // Stronger attraction for special edges
        return link.redundantData || link.isIsf ? 2 : 1;
      });

    // Stronger centering force
    fgRef.current.d3Force("center").strength(1);

    // Add collision force to prevent node overlap
    fgRef.current.d3Force(
      "collision",
      d3
        .forceCollide()
        .radius((node: any) => (nodeIdtoSizes?.get(node.id) || 8) * 1.2)
        .strength(0.8)
    );

    // Initial positioning
    setTimeout(() => {
      fgRef.current.zoomToFit(400, 50);
      handleRenderMinimap();
    }, 250);
  }, [graphData, handleRenderMinimap, nodeIdtoSizes]);

  // Add zoom level control
  useEffect(() => {
    if (!fgRef.current) return;
    fgRef.current.zoom(zoomLevel);
  }, [zoomLevel]);

  const handleNodeClick = (node: ForceGraphNode, event: MouseEvent) => {
    if (!node.id || !fgRef.current) return;

    setSelectedNode(node);
    setSelectedEdge(null);

    const zoomDuration = 1000;
    const padding = 50;

    if (connectedComponents?.length) {
      const component = connectedComponents.find((cc) => cc.includes(node.id));
      fgRef.current.zoomToFit(zoomDuration, padding, (n: { id: string }) =>
        component?.includes(n.id)
      );
    } else {
      fgRef.current.zoomToFit(zoomDuration, padding);
    }
  };

  const getEdgeColor = (edge: ForceGraphEdge) => {
    if (edge.redundantData && highlightRedundant) {
      return theme === "dark" ? "#ef4444" : "#dc2626";
    }
    if (edge.isIsf && highlightIsf) {
      return theme === "dark" ? "#8b5cf6" : "#7c3aed"; // Purple for ISF
    }
    return theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.2)";
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

  const getScaledValue = (baseValue: number, scale: number) => {
    return baseValue * (1 + (1 - Math.min(1, scale)) * 2);
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
        nodeCanvasObject={(node: ForceGraphNode, ctx, globalScale) => {
          if (!nodeIdtoSizes) return;

          // Scale node size based on zoom level
          const baseSize = nodeIdtoSizes?.get(node.id) || 8;
          const size = getScaledValue(baseSize, globalScale);
          const borderWidth = getScaledValue(1.5, globalScale);
          const x = node.x ?? 0;
          const y = node.y ?? 0;

          if (ratioModeEnabled && ratioColColors) {
            // Draw pie chart segments for ratio mode
            let startAngle = 0;
            let totalValue = 0;

            // Calculate total value for percentages
            ratioColColors.forEach(({ col }) => {
              totalValue += Number(node[col] || 0);
            });

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
            // Draw regular node
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);

            const isSelected = selectedNode?.id === node.id;
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
            ctx.lineWidth = borderWidth;
            ctx.stroke();
          }

          // Prototype indicator with scaled border
          if (node.isPrototype) {
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.strokeStyle = "#eab308";
            ctx.lineWidth = getScaledValue(2, globalScale);
            ctx.stroke();
          }

          // Only show labels when zoomed in enough
          if (globalScale > 0.4) {
            const label =
              typeof node[nodeLabel] === "number"
                ? Number(node[nodeLabel]).toFixed(2)
                : String(node[nodeLabel]);

            const fontSize = Math.max(
              6,
              getScaledValue(size * 0.7, globalScale)
            );
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.strokeStyle = theme === "dark" ? "#000000" : "#ffffff";
            ctx.lineWidth = 2;
            ctx.strokeText(label, x, y);
            ctx.fillStyle = theme === "dark" ? "#ffffff" : "#000000";
            ctx.fillText(label, x, y);
          }
        }}
        nodePointerAreaPaint={(node: ForceGraphNode, color, ctx) => {
          const size = (nodeIdtoSizes?.get(node.id) || 8) + 2;
          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, size, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkCanvasObject={(link: ForceGraphEdge, ctx) => {
          if (!link.source || !link.target) return;

          const scale = zoomLevel;
          const baseWidth = link.redundantData || link.isIsf ? 2 : 1.5;
          const lineWidth = getScaledValue(baseWidth, scale);
          const opacity = Math.min(1, getScaledValue(0.3, scale));

          ctx.beginPath();
          ctx.setLineDash(getEdgeStyle(link) || []);
          ctx.moveTo(link.source.x ?? 0, link.source.y ?? 0);
          ctx.lineTo(link.target.x ?? 0, link.target.y ?? 0);

          // Adjust edge color opacity based on zoom
          const color = getEdgeColor(link);
          if (color.startsWith("rgba")) {
            ctx.strokeStyle = color.replace(/[\d.]+\)$/g, `${opacity})`);
          } else {
            ctx.strokeStyle = color;
          }

          ctx.lineWidth = lineWidth;
          ctx.stroke();
          ctx.setLineDash([]);

          // Only show edge labels when zoomed in enough
          if (scale > 0.4) {
            const label =
              typeof link[edgeLabel] === "number"
                ? link[edgeLabel].toFixed(2)
                : String(link[edgeLabel]);

            const midX = ((link.source.x ?? 0) + (link.target.x ?? 0)) / 2;
            const midY = ((link.source.y ?? 0) + (link.target.y ?? 0)) / 2;

            const fontSize = getScaledValue(3, scale);
            ctx.font = `${fontSize}px Inter`;
            const metrics = ctx.measureText(label);
            const padding = getScaledValue(2, scale);

            ctx.fillStyle = getEdgeLabelBackground();
            ctx.fillRect(
              midX - (metrics.width + padding) / 2,
              midY - (fontSize + padding) / 2,
              metrics.width + padding,
              fontSize + padding
            );

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = theme === "dark" ? "#ffffff" : "#000000";
            ctx.fillText(label, midX, midY);
          }
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
