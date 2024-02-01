import { zid } from "convex-helpers/server/zod";
import { z } from "zod";
import { AnalysisCreationInputSchema, AnalysisStatus } from "./schema";
import { zInternalMutation, zMutation, zQuery } from "./utils";

export const create = zInternalMutation({
  args: AnalysisCreationInputSchema.shape,
  handler: async ({ db, user }, { config, reactionDb, rawFile }) => {
    const id = await db.insert("analyses", {
      user,
      rawFile,
      reactionDb,
      config,
      status: "pending",
    });

    return { id };
  },
});

export const get = zQuery({
  args: { id: zid("analyses") },
  handler: async ({ db }, args) => {
    const analysis = await db.get(args.id);
    if (!analysis) {
      throw new Error("Analysis not found");
    }

    return {
      ...analysis,
      rawFile: await db.get(analysis.rawFile),
      reactionDb:
        analysis.reactionDb === "default"
          ? "default"
          : db.get(analysis.reactionDb),
    };
  },
});

export const update = zMutation({
  args: {
    id: zid("analyses"),
    status: z.optional(AnalysisStatus),
    result: z.optional(zid("_storage")),
    log: z.optional(z.string()),
  },
  handler: async ({ db }, { id, status, log, result }) => {
    db.patch(id, {
      ...(status && { status }),
      ...(log && { log }),
      ...(result && { result }),
    });
  },
});

export const getAll = zQuery({
  handler: async ({ db, user }) => {
    const analyses = await db
      .query("analyses")
      .withIndex("user", (q) => q.eq("user", user))
      .collect();

    return analyses.map((analysis) => ({
      ...analysis,
      rawFile: db.get(analysis.rawFile),
      reactionDb:
        analysis.reactionDb === "default"
          ? "default"
          : db.get(analysis.reactionDb),
    }));
  },
});
