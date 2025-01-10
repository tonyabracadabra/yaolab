import { colorSchemes, kAvailableEdges, kAvailableNodes } from "./constants";

export interface BioSample {
  name: string;
  blank: string[];
  sample: string[];
}

export interface DrugSample {
  name: string;
  groups: string[];
}

export interface AnalysisConfig {
  bioSamples: BioSample[];
  drugSample?: DrugSample;
  correlationThreshold: number;
  ms2SimilarityThreshold: number;
  mzErrorThreshold: number;
  rtTimeWindow: number;
  signalEnrichmentFactor: number;
  minSignalThreshold: number;
}

// Add this type for API response
export type AnalysisConfigResponse = Partial<
  Omit<AnalysisConfig, "bioSamples">
> & {
  bioSamples: BioSample[];
};

export type AnalysisStep =
  | "load_data"
  | "create_ion_interaction_matrix"
  | "create_similarity_matrix"
  | "combine_matrices_and_extract_edges"
  | "calculate_edge_metrics"
  | "edge_value_matching"
  | "postprocessing"
  | "upload_result";

export interface AnalysisProgress {
  step: AnalysisStep;
  status: "running" | "complete" | "failed";
  message?: string;
}

export type RatioColorScheme = (typeof colorSchemes)[number]["value"];

export interface Node {
  id: string;
  mz: number;
  rt: number;
  isPrototype?: boolean;
  msmsSpectrum: Array<[number, number]>;
}

export interface Edge {
  id1: string;
  id2: string;
  mzDiff: number;
  rtDiff: number;
  matchedMzDiff?: number;
  matchedFormulaChange?: string;
  matchedDescription?: string;
  correlation?: number;
  modCos?: number;
  redundantData?: boolean;
  isIsf?: boolean;
  [key: string]: unknown;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export interface GraphMLNode {
  id: string;
  mz: number;
  rt: number;
  isPrototype: boolean;
}

export interface GraphMLData {
  nodes: GraphMLNode[];
  edges: Edge[];
}

export function toGraphMLData(data: GraphData): GraphMLData {
  return {
    nodes: data.nodes.map((node) => ({
      ...node,
      isPrototype: node.isPrototype ?? false,
    })) as GraphMLNode[],
    edges: data.edges,
  };
}

export type NodeKey = (typeof kAvailableNodes)[number]["key"];
export type EdgeKey = (typeof kAvailableEdges)[number]["col"];

export interface ForceGraphNode extends Omit<Node, "mz" | "rt"> {
  x?: number;
  y?: number;
  mz?: number;
  rt?: number;
  isPrototype?: boolean;
  msmsSpectrum: Array<[number, number]>;
  ratios?: Record<string, number>;
  [key: string]: any;
}

export interface ForceGraphEdge extends Edge {
  source: ForceGraphNode;
  target: ForceGraphNode;
}

export interface ForceGraphData {
  nodes: ForceGraphNode[];
  links: ForceGraphEdge[];
}
