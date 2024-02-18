import { zid, zodToConvexFields } from "convex-helpers/server/zod";
import { defineSchema, defineTable } from "convex/server";
import { z } from "zod";

export const BioSampleSchema = z.object({
  name: z.string(),
  sample: z.array(z.string()),
  blank: z.array(z.string()),
});

export const DrugSampleSchema = z.object({
  name: z.string(),
  groups: z.array(z.string()),
});

export const ReactionSchema = z.object({
  formulaChange: z.string(),
  description: z.string(),
  mzDiff: z.number(),
});

export const AnalysisConfigSchema = z.object({
  minSignalThreshold: z.number().default(5e5),
  signalEnrichmentFactor: z.number().default(30),
  ms2SimilarityThreshold: z
    .number()
    .min(0.5, "Must be between 0.5 and 1")
    .max(1, "Must be between 0.5 and 1")
    .default(0.7),
  mzErrorThreshold: z.number().default(0.01),
  rtTimeWindow: z.number().default(0.02),
  correlationThreshold: z.number().default(0.95),
  bioSamples: z.array(BioSampleSchema),
  drugSample: z.optional(DrugSampleSchema),
});

export const AnalysisCreationInputSchema = z.object({
  rawFile: zid("rawFiles"),
  reactionDb: z.union([zid("reactionDatabases"), z.literal("default")]),
  config: AnalysisConfigSchema,
});

export const AnalysisStatus = z.enum(["running", "complete", "failed"]);

export const AnalysisStep = z.enum([
  "load_data",
  "create_ion_interaction_matrix",
  "create_similarity_matrix",
  "combine_matrices_and_extract_edges",
  "calculate_edge_metrics",
  "edge_value_matching",
  "postprocessing",
  "upload_result",
]);

export const Progress = z.array(
  z.object({
    step: AnalysisStep,
    status: AnalysisStatus,
  })
);

export const EdgeSchema = z.object({
  id1: z.string(),
  id2: z.string(),
  value: z.number(),
  correlation: z.number(),
  rtDiff: z.number(),
  mzDiff: z.number(),
  matchedMzDiff: z.number(),
  matchedFormulaChange: z.string(),
  matchedDescription: z.string(),
  redundantData: z.string(),
  modCos: z.number(),
});

export const NodeSchema = z.object({
  id: z.string(),
  mz: z.number(),
  rt: z.number(),
  isPrototype: z.boolean(),
});

export const AnalysisResultSchema = z.object({
  nodes: z.string(),
  edges: z.string(),
});

export const AnalysisSchema = z.object({
  ...AnalysisCreationInputSchema.shape,
  user: z.string(),
  status: AnalysisStatus,
  progress: Progress,
  log: z.optional(z.string()),
  result: z.optional(AnalysisResultSchema),
});

export const MSTool = z.enum(["MZmine3", "MDial"]);

export const ReactionDatabaseSchema = z.object({
  user: z.string(),
  name: z.string(),
  reactions: z.array(ReactionSchema),
});

export const RawFileCreationInputSchema = z.object({
  name: z.string(),
  desc: z.optional(z.string()),
  tool: MSTool,
  mgf: z.string(),
  targetedIons: z.string(),
  sampleCols: z.array(z.string()),
});

export const RawFileSchema = z.object({
  ...RawFileCreationInputSchema.shape,
  user: z.string(),
});

export default defineSchema({
  analyses: defineTable(zodToConvexFields(AnalysisSchema.shape)).index("user", [
    "user",
  ]),
  reactionDatabases: defineTable(
    zodToConvexFields(ReactionDatabaseSchema.shape)
  ).index("user", ["user"]),
  rawFiles: defineTable(zodToConvexFields(RawFileSchema.shape)).index("user", [
    "user",
  ]),
});
