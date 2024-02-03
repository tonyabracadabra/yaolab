import { AnalysisStep } from "@/convex/schema";
import ReactFlow, {
  Node,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";

import "reactflow/dist/style.css";
import { z } from "zod";

interface WorkflowInterface {
  step: AnalysisStepType;
  log?: string;
}

type AnalysisStepType = z.infer<typeof AnalysisStep>;

const baseNodes: Node[] = [
  {
    id: AnalysisStep.Enum.load_data,
    type: "input",
    position: { x: 0, y: 0 },
    data: { label: "Load Data" },
  },
  {
    id: AnalysisStep.Enum.create_ion_interaction_matrix,
    position: { x: 200, y: 0 },
    data: { label: "Create Ion Interaction Matrix" },
  },
  {
    id: AnalysisStep.Enum.create_similarity_matrix,
    position: { x: 400, y: 0 },
    data: { label: "Create Similarity Matrix" },
  },
  {
    id: AnalysisStep.Enum.combine_matrices_and_extract_edges,
    position: { x: 600, y: 0 },
    data: { label: "Combine Matrices & Extract Edges" },
  },
  {
    id: AnalysisStep.Enum.calculate_edge_metrics,
    position: { x: 800, y: 0 },
    data: { label: "Calculate Edge Metrics" },
  },
  {
    id: AnalysisStep.Enum.edge_value_matching,
    type: "output",
    position: { x: 1000, y: 0 },
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

function Flow({ step, log }: WorkflowInterface) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(baseEdges);

  const getNodeStyle = (
    step: AnalysisStepType,
    currentStep: AnalysisStepType
  ): React.CSSProperties => {
    if (step < currentStep) {
      return { background: "#D3D3D3", color: "#000" }; // Completed steps
    } else if (step === currentStep) {
      return { background: "#0088cc", color: "#FFF" }; // Current step
    }
    return { background: "#FFF", color: "#000" }; // Future steps
  };

  // Function to determine edge style or animation
  const getEdgeStyle = (
    source: AnalysisStepType,
    target: AnalysisStepType,
    currentStep: AnalysisStepType
  ): { animated: boolean } => {
    // Simple example logic: animate edge if both source and target steps are completed or current
    return {
      animated: source <= currentStep && target <= currentStep,
    };
  };

  return (
    <div style={{ width: "30vh", height: "80vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
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
