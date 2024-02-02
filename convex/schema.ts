import { zid, zodToConvexFields } from "convex-helpers/server/zod";
import { defineSchema, defineTable } from "convex/server";
import { z } from "zod";

export const ExperimentSchema = z.object({
  name: z.string(),
  sampleGroups: z.array(z.string()),
  blankGroups: z.array(z.string()),
});

export const ReactionSchema = z.object({
  formulaChange: z.string(),
  description: z.string(),
  massDiff: z.number(),
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
  reactionDb: z.union([zid("reactionDatabases"), z.literal("default")]),
  config: AnalysisConfigSchema,
});

export const AnalysisStatus = z.enum([
  "pending",
  "running",
  "complete",
  "failed",
]);

export const AnalysisSchema = z.object({
  ...AnalysisCreationInputSchema.shape,
  user: z.string(),
  status: AnalysisStatus,
  log: z.optional(z.string()),
  result: z.optional(zid("_storage")),
});

export const MSTool = z.enum(["MZmine3", "MDial"]);

export const ReactionDatabaseSchema = z.object({
  user: z.string(),
  name: z.string(),
  reactions: z.array(ReactionSchema),
});

export const RawFileCreationInputSchema = z.object({
  name: z.string(),
  tool: MSTool,
  mgf: zid("_storage"),
  targetedIons: zid("_storage"),
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
