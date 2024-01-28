import { zid, zodToConvexFields } from "convex-helpers/server/zod";
import { defineSchema, defineTable } from "convex/server";
import { z } from "zod";

export const ExperimentSchema = z.object({
  name: z.string(),
  sampleGroups: z.array(z.string()),
  blankGroups: z.array(z.string()),
});

export const CustomReactionSchema = z.object({
  formulaChange: z.string(),
  reactionDescription: z.string(),
});

export const TaskConfigSchema = z.object({
  maxResponseThreshold: z.number(),
  minResponseRatio: z.number().default(0.1),
  ms2SimilarityThreshold: z.number().default(0.7),
  mzErrorThreshold: z.number().default(10),
  rtTimeWindow: z.number().default(0.02),
  experimentGroups: z.array(ExperimentSchema),
});

export const TaskCreationInputSchema = z.object({
  rawFile: zid("rawFiles"),
  reactionDb: zid("reactionDatabases"),
  config: TaskConfigSchema,
});

export const TaskStatus = z.enum(["pending", "running", "complete", "failed"]);

export const TaskResultSchema = z.array(
  z.object({
    node: z.string(),
    score: z.number(),
    edge: z.string(),
  })
);

export const TaskSchema = z.object({
  ...TaskCreationInputSchema.shape,
  user: z.string(),
  status: TaskStatus,
  log: z.optional(z.string()),
  result: z.optional(TaskResultSchema),
});

export const FileType = z.enum(["MZine", "MDial"]);

export const ReactionDatabaseSchema = z.object({
  user: z.string(),
  name: z.string(),
  file: zid("_storage"),
  customReactions: z.array(CustomReactionSchema),
});

export const RawFileCreationInputSchema = z.object({
  name: z.string(),
  file: zid("_storage"),
  fileType: FileType,
  sampleColumns: z.array(z.string()),
});

export const RawFileSchema = z.object({
  ...RawFileCreationInputSchema.shape,
  user: z.string(),
});

export default defineSchema({
  tasks: defineTable(zodToConvexFields(TaskSchema.shape)).index("user", [
    "user",
  ]),
  reactionDatabases: defineTable(
    zodToConvexFields(ReactionDatabaseSchema.shape)
  ).index("user", ["user"]),
  rawFiles: defineTable(zodToConvexFields(RawFileSchema.shape)).index("user", [
    "user",
  ]),
});
