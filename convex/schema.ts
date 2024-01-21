import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const TaskConfigSchema = v.object({
  fileType: v.union(v.literal("MZine"), v.literal("MDial")),
  maxResponseThreshold: v.number(),
  minResponseRatio: v.number(),
  ms2SimilarityThreshold: v.number(),
  mzErrorThreshold: v.number(),
  rtTimeWindow: v.number(),
  experimentGroups: v.array(
    v.object({
      name: v.string(),
      sampleGroups: v.array(v.string()),
      blankGroups: v.array(v.string()),
    })
  ),
});

export default defineSchema({
  tasks: defineTable({
    user: v.string(),
    file: v.id("_storage"),
    config: TaskConfigSchema,
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("complete")
    ),
    result: v.optional(
      v.array(
        v.object({
          node: v.string(),
          score: v.number(),
          edge: v.string(),
        })
      )
    ),
  }),
});
