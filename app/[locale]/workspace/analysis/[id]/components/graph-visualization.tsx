import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
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
  onNodeClick: (nodeId: string) => void;
}

export function GraphVisualization({
  graphData,
  nodeLabel,
  edgeLabel,
  nodeIdtoSizes,
  ratioModeEnabled,
  ratioColColors,
  highlightRedundant,
  onNodeClick,
}: GraphVisualizationProps) {
  const { theme } = useTheme();
  const fgRef = useRef<any>();
  const [selectedNode, setSelectedNode] = useState<ForceGraphNode | null>(null);

  useEffect(() => {
    if (!fgRef.current) return;

    fgRef.current.d3Force("charge").strength(-50).distanceMax(50);
    fgRef.current.d3Force("link").distance(20);
  }, []);

  const handleNodeClick = (node: ForceGraphNode) => {
    if (!node.id) return;
    setSelectedNode(node);
    onNodeClick(node.id);
  };

  const getEdgeColor = (isRedundant: boolean) => {
    if (isRedundant && highlightRedundant) {
      return "#ef4444"; // red-500
    }
    return theme === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";
  };

  const getEdgeLabelBackground = () => {
    return theme === "dark" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)";
  };

  return (
    <div className="relative w-[calc(100vw-400px)] h-[calc(100vh-200px)]">
      <ForceGraph2D
        ref={fgRef}
        graphData={{
          nodes: graphData.nodes,
          links: graphData.edges.map((edge) => ({
            source: graphData.nodes.find((n) => n.id === edge.id1)!,
            target: graphData.nodes.find((n) => n.id === edge.id2)!,
            ...edge,
          })),
        }}
        onNodeClick={handleNodeClick}
        nodeId="id"
        linkSource="id1"
        linkTarget="id2"
        linkWidth={8}
        nodeCanvasObject={(node: ForceGraphNode, ctx, globalScale) => {
          if (!nodeIdtoSizes || !ratioColColors) return;

          const size = nodeIdtoSizes?.get(node.id) || 8;
          const ratio = ratioColColors?.map(
            (v) => node[v.col] || 0
          ) as number[];

          // Draw circle
          ctx.beginPath();
          const x = node.x ?? 0;
          const y = node.y ?? 0;

          ctx.arc(x, y, size, 0, 2 * Math.PI, false);

          if (!ratioModeEnabled) {
            // Highlight selected node
            if (selectedNode?.id === node.id) {
              ctx.fillStyle = "#4f46e5"; // Indigo color for selected node
              ctx.strokeStyle = "#818cf8"; // Lighter indigo for the border
            } else {
              ctx.fillStyle = "white";
              ctx.strokeStyle = "#ADD8E6";
            }
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          if (node.isPrototype) {
            ctx.strokeStyle = "yellow";
            ctx.stroke();
          }

          // Draw label
          const label =
            typeof node[nodeLabel] === "number"
              ? node[nodeLabel].toFixed(2)
              : String(node[nodeLabel]);
          ctx.font = `4px Sans-Serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "black";
          ctx.fillText(label, x, y);
        }}
        nodePointerAreaPaint={(node: ForceGraphNode, color, ctx) => {
          ctx.beginPath();
          const x = node.x ?? 0;
          const y = node.y ?? 0;
          ctx.arc(x, y, 5, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkCanvasObject={(link: ForceGraphEdge, ctx) => {
          if (!link.source || !link.target) return;

          // Draw edge line
          ctx.beginPath();
          ctx.moveTo(link.source.x ?? 0, link.source.y ?? 0);
          ctx.lineTo(link.target.x ?? 0, link.target.y ?? 0);
          ctx.strokeStyle = getEdgeColor(!!link.redundantData);
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw edge label
          const label =
            typeof link[edgeLabel] === "number"
              ? link[edgeLabel].toFixed(2)
              : String(link[edgeLabel]);
          ctx.font = `3px Sans-Serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const textWidth = ctx.measureText(label).width;
          const textHeight = 4;
          const padding = 2;

          // Draw label background
          ctx.fillStyle = getEdgeLabelBackground();
          ctx.fillRect(
            ((link.source.x ?? 0) + (link.target.x ?? 0)) / 2 -
              (textWidth + padding) / 2,
            ((link.source.y ?? 0) + (link.target.y ?? 0)) / 2 -
              (textHeight + padding) / 2,
            textWidth + padding,
            textHeight + padding
          );

          // Draw label text
          ctx.fillStyle =
            theme === "dark"
              ? "rgba(255, 255, 255, 0.9)"
              : "rgba(0, 0, 0, 0.9)";
          ctx.fillText(
            label,
            ((link.source.x ?? 0) + (link.target.x ?? 0)) / 2,
            ((link.source.y ?? 0) + (link.target.y ?? 0)) / 2
          );
        }}
      />

      {selectedNode && (
        <NodeDetailsCard
          nodeId={selectedNode.id}
          ms2Data={selectedNode.ms2Spectrum}
        />
      )}
    </div>
  );
}
