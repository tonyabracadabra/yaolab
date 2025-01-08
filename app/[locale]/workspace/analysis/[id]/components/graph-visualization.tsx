"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { ForceGraph2D } from "react-force-graph";
import type {
  EdgeKey,
  ForceGraphEdge,
  ForceGraphNode,
  GraphData,
  NodeKey,
} from "../types";
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
}: GraphVisualizationProps) {
  const { theme } = useTheme();
  const fgRef = useRef<any>();
  const [selectedNode, setSelectedNode] = useState<ForceGraphNode | null>(null);

  // Memoize graph data transformation
  const processedGraphData = useMemo(
    () => ({
      nodes: graphData.nodes,
      links: graphData.edges.map((edge) => ({
        source: graphData.nodes.find((n) => n.id === edge.id1)!,
        target: graphData.nodes.find((n) => n.id === edge.id2)!,
        ...edge,
      })),
    }),
    [graphData]
  );

  useEffect(() => {
    if (!fgRef.current) return;

    // Optimize force simulation parameters
    fgRef.current
      .d3Force("charge")
      .strength(-80) // Increased repulsion
      .distanceMax(100); // Increased max distance

    fgRef.current
      .d3Force("link")
      .distance(40) // Increased link distance
      .strength(0.8); // Added link strength

    // Warm up simulation
    fgRef.current.d3ReheatSimulation();
  }, []);

  const handleNodeClick = (node: ForceGraphNode) => {
    if (!node.id || !fgRef.current) return;
    setSelectedNode(node);

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

  const getEdgeColor = (isRedundant: boolean) => {
    if (isRedundant && highlightRedundant) {
      return theme === "dark" ? "#ef4444" : "#dc2626"; // Adjusted red colors
    }
    return theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.2)";
  };

  const getEdgeLabelBackground = () => {
    return theme === "dark" ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.9)";
  };

  return (
    <div className="relative w-[calc(100vw-400px)] h-[calc(100vh-200px)] bg-background rounded-lg shadow-sm">
      <ForceGraph2D
        ref={fgRef}
        graphData={processedGraphData}
        onNodeClick={handleNodeClick}
        nodeId="id"
        linkSource="id1"
        linkTarget="id2"
        linkWidth={1.5}
        backgroundColor="transparent"
        nodeCanvasObject={(node: ForceGraphNode, ctx, globalScale) => {
          if (!nodeIdtoSizes || !ratioColColors) return;

          const size = nodeIdtoSizes?.get(node.id) || 8;
          const x = node.x ?? 0;
          const y = node.y ?? 0;

          // Draw node
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);

          if (!ratioModeEnabled) {
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
          }

          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Prototype indicator
          if (node.isPrototype) {
            ctx.strokeStyle = "#eab308";
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          // Node label with improved visibility
          const label =
            typeof node[nodeLabel] === "number"
              ? node[nodeLabel].toFixed(2)
              : String(node[nodeLabel]);

          // Set font properties with larger size
          const fontSize = Math.max(6, size * 0.7);
          ctx.font = `${fontSize}px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // Draw label with contrasting outline for better visibility
          ctx.strokeStyle = theme === "dark" ? "#000000" : "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.strokeText(label, x, y);
          ctx.fillStyle = theme === "dark" ? "#ffffff" : "#000000";
          ctx.fillText(label, x, y);
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

          // Edge line
          ctx.beginPath();
          ctx.moveTo(link.source.x ?? 0, link.source.y ?? 0);
          ctx.lineTo(link.target.x ?? 0, link.target.y ?? 0);
          ctx.strokeStyle = getEdgeColor(!!link.redundantData);
          ctx.lineWidth = 1;
          ctx.stroke();

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

          // Label background
          ctx.fillStyle = getEdgeLabelBackground();
          ctx.fillRect(
            midX - (metrics.width + padding) / 2,
            midY - (4 + padding) / 2,
            metrics.width + padding,
            4 + padding
          );

          // Label text
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = theme === "dark" ? "#ffffff" : "#000000";
          ctx.fillText(label, midX, midY);
        }}
      />

      {selectedNode && (
        <NodeDetailsCard
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
