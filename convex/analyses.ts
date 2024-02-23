import { zid } from "convex-helpers/server/zod";
import { z } from "zod";
import {
  AnalysisConfigSchema,
  AnalysisCreationInputSchema,
  AnalysisResultSchema,
  AnalysisStatus,
  AnalysisStep,
  Progress,
  ReactionSchema,
} from "./schema";
import { zInternalMutation, zMutation, zQuery } from "./utils";

export const create = zInternalMutation({
  args: AnalysisCreationInputSchema.shape,
  handler: async ({ db, user }, { config, reactionDb, rawFile }) => {
    const id = await db.insert("analyses", {
      progress: [],
      user,
      rawFile,
      reactionDb,
      config,
      status: "running",
    });

    return { id };
  },
});

export const get = zQuery({
  args: { id: zid("analyses") },
  handler: async ({ db }, { id }) => {
    const analysis = await db.get(id);
    if (!analysis) {
      throw new Error("Analysis not found");
    }

    const rawFile = await db.get(analysis.rawFile);
    if (!rawFile) {
      throw new Error("Raw file not found");
    }

    return {
      ...analysis,
      rawFile,
      reactionDb: analysis.reactionDb,
    };
  },
});

export const update = zMutation({
  args: {
    id: zid("analyses"),
    status: z.optional(AnalysisStatus),
    result: z.optional(AnalysisResultSchema),
    progress: z.optional(Progress),
    log: z.optional(z.string()),
  },
  handler: async ({ db }, { id, status, log, progress, result }) => {
    db.patch(id, {
      ...(status && { status }),
      ...(log && { log }),
      ...(progress && { progress }),
      ...(result && { result }),
    });
  },
});

export const updateStepStatus = zMutation({
  args: {
    id: zid("analyses"),
    step: AnalysisStep,
    status: AnalysisStatus,
  },
  handler: async ({ db }, { id, step, status }) => {
    const analysis = await db.get(id);
    if (!analysis) {
      throw new Error("Analysis not found");
    }

    const progress = !analysis.progress.find((p) => p.step === step)
      ? [...analysis.progress, { step, status }]
      : analysis.progress.map((p) => (p.step === step ? { ...p, status } : p));

    await db.patch(id, { progress });

    if (status === "failed") {
      await db.patch(id, { status });
    }
  },
});

export const AnalysisOutputSchema = z.object({
  id: zid("analyses"),
  user: z.string(),
  status: AnalysisStatus,
  rawFile: z.object({
    name: z.string(),
    tool: z.string(),
    mgf: z.string(),
    ions: z.string(),
    sampleCols: z.array(z.string()),
  }),
  reactionDb: z.union([
    z.literal("default-pos"),
    z.literal("default-neg"),
    z.object({
      name: z.string(),
      reactions: z.array(ReactionSchema),
    }),
  ]),
  creationTime: z.number(),
  config: AnalysisConfigSchema,
});

export const getAll = zQuery({
  args: { rawFile: z.optional(zid("rawFiles")) },
  handler: async ({ db, user }, { rawFile }) => {
    const analyses = await db
      .query("analyses")
      .withIndex("user", (q) => q.eq("user", user))
      .filter((q) => (rawFile ? q.eq(q.field("rawFile"), rawFile) : true))
      .order("desc")
      .collect();

    return await Promise.all(
      analyses.map(async (analysis) => {
        let finalReactionDb:
          | "default-pos"
          | "default-neg"
          | {
              name: string;
              reactions: z.infer<typeof ReactionSchema>[];
            } = "default-pos";
        if (
          analysis.reactionDb !== "default-pos" &&
          analysis.reactionDb !== "default-neg"
        ) {
          const reactionDb = await db.get(analysis.reactionDb);
          if (!reactionDb) {
            throw new Error("Reaction DB not found");
          }

          finalReactionDb = {
            name: reactionDb.name,
            reactions: reactionDb.reactions,
          };
        }
        const rawFile = await db.get(analysis.rawFile);
        if (!rawFile) {
          throw new Error("Raw file not found");
        }

        return {
          id: analysis._id,
          user: analysis.user,
          status: analysis.status,
          rawFile: {
            name: rawFile.name,
            tool: rawFile.tool,
            mgf: rawFile.mgf,
            ions: rawFile.targetedIons,
            sampleCols: rawFile.sampleCols,
          },
          reactionDb: finalReactionDb,
          config: analysis.config,
          creationTime: analysis._creationTime,
        };
      })
    );
  },
  output: z.array(AnalysisOutputSchema),
});

export const remove = zMutation({
  args: { id: zid("analyses") },
  handler: async ({ db }, { id }) => {
    await db.delete(id);
  },
});
