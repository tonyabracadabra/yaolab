import { AnalysisStep, Progress } from "@/convex/schema";
import { useEffect, useMemo } from "react";
import ReactFlow, {
  Edge,
  Handle,
  MarkerType,
  Node,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "reactflow";

import { Loader2 } from "lucide-react";
import "reactflow/dist/style.css";
import { z } from "zod";
import { Card } from "../ui/card";

interface WorkflowInterface {
  progress: z.infer<typeof Progress>;
  log?: string;
}

const baseNodes: Node[] = [
  {
    id: AnalysisStep.Enum.load_data,
    type: "input",
    position: { x: 0, y: 0 },
    data: { label: "Load Data" },
  },
  {
    id: AnalysisStep.Enum.create_ion_interaction_matrix,
    position: { x: 100, y: 75 },
    data: { label: "Create Ion Interaction Matrix" },
  },
  {
    id: AnalysisStep.Enum.create_similarity_matrix,
    position: { x: -100, y: 175 },
    data: { label: "Create Similarity Matrix" },
  },
  {
    id: AnalysisStep.Enum.combine_matrices_and_extract_edges,
    position: { x: 100, y: 250 },
    data: { label: "Combine Matrices & Extract Edges" },
  },
  {
    id: AnalysisStep.Enum.calculate_edge_metrics,
    position: { x: -100, y: 325 },
    data: { label: "Calculate Edge Metrics" },
  },
  {
    id: AnalysisStep.Enum.edge_value_matching,
    type: "output",
    position: { x: 0, y: 400 },
    data: { label: "Edge Value Matching" },
  },
  {
    id: AnalysisStep.Enum.upload_result,
    type: "output",
    position: { x: 0, y: 500 },
    data: { label: "Upload Result" },
  },
];

const baseEdges: Edge[] = [
  {
    id: "e1-2",
    source: AnalysisStep.Enum.load_data,
    target: AnalysisStep.Enum.create_ion_interaction_matrix,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e1-3",
    source: AnalysisStep.Enum.load_data,
    target: AnalysisStep.Enum.create_similarity_matrix,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e1-6",
    source: AnalysisStep.Enum.load_data,
    target: AnalysisStep.Enum.edge_value_matching,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e2-3",
    source: AnalysisStep.Enum.create_ion_interaction_matrix,
    target: AnalysisStep.Enum.create_similarity_matrix,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e2-4",
    source: AnalysisStep.Enum.create_ion_interaction_matrix,
    target: AnalysisStep.Enum.combine_matrices_and_extract_edges,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e3-4",
    source: AnalysisStep.Enum.create_similarity_matrix,
    target: AnalysisStep.Enum.combine_matrices_and_extract_edges,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e4-5",
    source: AnalysisStep.Enum.combine_matrices_and_extract_edges,
    target: AnalysisStep.Enum.calculate_edge_metrics,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e5-6",
    source: AnalysisStep.Enum.calculate_edge_metrics,
    target: AnalysisStep.Enum.edge_value_matching,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e6-7",
    source: AnalysisStep.Enum.edge_value_matching,
    target: AnalysisStep.Enum.upload_result,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
];

function RunningNode({ data }: { data: { label: string } }) {
  return (
    <>
      <Handle type="target" position={Position.Top} id="c" />
      <Handle type="target" position={Position.Top} id="d" />
      <Card className="bg-yellow-400 dark:bg-yellow-200 text-xs px-[4px] py-3 text-white dark:text-black relative">
        <Loader2
          className="animate-spin absolute right-[2px] top-[2px]"
          size={12}
        />
        {data.label}
      </Card>
      <Handle type="source" position={Position.Bottom} id="a" />
      <Handle type="source" position={Position.Bottom} id="b" />
    </>
  );
}

function CompleteNode({ data }: { data: { label: string } }) {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Card className="bg-green-500/80 px-[4px] text-xs py-3 text-white">
        {data.label}
      </Card>
      <Handle type="source" position={Position.Bottom} id="a" />
      <Handle type="source" position={Position.Bottom} id="b" />
    </>
  );
}

function Flow({ progress, log }: WorkflowInterface) {
  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(baseEdges);

  const nodeTypes = useMemo(
    () => ({
      running: RunningNode,
      complete: CompleteNode,
    }),
    []
  );

  useEffect(() => {
    setNodes(
      nodes.map((node) => {
        const status = progress?.find((step) => step.step === node.id)?.status;
        return {
          ...node,
          type: status || "notStarted",
        };
      })
    );
    // set the animation for the edges
    setEdges(
      edges.map((edge) => {
        const targetStatus = progress?.find(
          (step) => step.step === edge.target
        )?.status;
        return {
          ...edge,
          animated: targetStatus === "running",
        };
      })
    );
  }, [edges, nodes, progress, setEdges, setNodes]);

  return (
    <div className="h-[60vh] w-[50vh] -left-2 pt-4">
      <ReactFlow
        nodeTypes={nodeTypes}
        panOnDrag={false}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        zoomOnScroll={false}
        panOnScroll={false}
      />
    </div>
  );
}

export function Workflow(props: WorkflowInterface) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
}
