import { AnalysisStep, Progress } from "@/convex/schema";
import { useEffect } from "react";
import ReactFlow, {
  Node,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "reactflow";

import "reactflow/dist/style.css";
import { z } from "zod";

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
];

const baseEdges = [
  {
    id: "e1-2",
    source: AnalysisStep.Enum.load_data,
    target: AnalysisStep.Enum.create_ion_interaction_matrix,
    animated: true,
  },
  {
    id: "e1-3",
    source: AnalysisStep.Enum.load_data,
    target: AnalysisStep.Enum.create_similarity_matrix,
    animated: true,
  },
  {
    id: "e1-6",
    source: AnalysisStep.Enum.load_data,
    target: AnalysisStep.Enum.edge_value_matching,
    animated: true,
  },
  {
    id: "e2-3",
    source: AnalysisStep.Enum.create_ion_interaction_matrix,
    target: AnalysisStep.Enum.create_similarity_matrix,
    animated: true,
  },
  {
    id: "e2-4",
    source: AnalysisStep.Enum.create_ion_interaction_matrix,
    target: AnalysisStep.Enum.combine_matrices_and_extract_edges,
    animated: true,
  },
  {
    id: "e3-4",
    source: AnalysisStep.Enum.create_similarity_matrix,
    target: AnalysisStep.Enum.combine_matrices_and_extract_edges,
    animated: true,
  },
  {
    id: "e4-5",
    source: AnalysisStep.Enum.combine_matrices_and_extract_edges,
    target: AnalysisStep.Enum.calculate_edge_metrics,
    animated: true,
  },
  {
    id: "e5-6",
    source: AnalysisStep.Enum.calculate_edge_metrics,
    target: AnalysisStep.Enum.edge_value_matching,
    animated: true,
  },
];

function Flow({ progress, log }: WorkflowInterface) {
  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(baseEdges);

  useEffect(() => {
    setNodes(
      nodes.map((node) => {
        const status = progress?.find((step) => step.step === node.id)?.status;
        if (status === "done") {
          return {
            ...node,
            style: { background: "green" },
          };
        } else if (status === "running") {
          return {
            ...node,
            style: { background: "yellow" },
          };
        } else {
          return {
            ...node,
            style: { background: "white" },
          };
        }
      })
    );
  }, [nodes, progress, setNodes]);

  return (
    <div style={{ width: "30vh", height: "50vh" }}>
      <ReactFlow
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
