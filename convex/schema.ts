import { zid, zodToConvexFields } from "convex-helpers/server/zod";
import { defineSchema, defineTable } from "convex/server";
import { z } from "zod";

export const ExperimentSchema = z.object({
  name: z.string(),
  sampleGroups: z.array(z.string()),
  blankGroups: z.array(z.string()),
});

export const CustomReactionSchema = z.object({
  formula: z.string(),
  description: z.string(),
  mass: z.number(),
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
  experiments: z.array(ExperimentSchema),
});

export const AnalysisCreationInputSchema = z.object({
  rawFile: zid("rawFiles"),
  reactionDb: zid("reactionDatabases"),
  config: AnalysisConfigSchema,
});

export const AnalysisStatus = z.enum([
  "pending",
  "running",
  "complete",
  "failed",
]);

export const Edge = z.object({
  id1: z.string(),
  id2: z.string(),
  value: z.number(),
  correlation: z.number(),
  rtDiff: z.number(),
  mzDiff: z.number(),
  matchedMzDiff: z.number(),
  matchedFormulaChange: z.number(),
  matchedReactionDesc: z.number(),
  redundantData: z.number(),
  modCos: z.number(),
});

export const AnalysisResultSchema = z.object({
  edges: z.array(Edge),
});

export const AnalysisSchema = z.object({
  ...AnalysisCreationInputSchema.shape,
  user: z.string(),
  status: AnalysisStatus,
  log: z.optional(z.string()),
  result: z.optional(zid("_storage")),
});

export const MSTool = z.enum(["MZine", "MDial"]);

export const ReactionDatabaseSchema = z.object({
  user: z.string(),
  name: z.string(),
  file: zid("_storage"),
  customReactions: z.array(CustomReactionSchema),
});

export const RawFileCreationInputSchema = z.object({
  name: z.string(),
  tool: MSTool,
  mgf: zid("_storage"),
  targetedIons: zid("_storage"),
  sampleColumns: z.array(z.string()),
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
