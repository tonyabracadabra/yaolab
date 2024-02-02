import { zid } from "convex-helpers/server/zod";
import { z } from "zod";
import {
  AnalysisConfigSchema,
  AnalysisCreationInputSchema,
  AnalysisStatus,
  ReactionSchema,
} from "./schema";
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
          : await db.get(analysis.reactionDb),
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

export const AnalysisOutputSchema = z.object({
  id: zid("analyses"),
  user: z.string(),
  status: AnalysisStatus,
  rawFile: z.object({
    name: z.string(),
    tool: z.string(),
    mgf: zid("_storage"),
    ions: zid("_storage"),
    sampleColumns: z.array(z.string()),
  }),
  reactionDb: z.union([
    z.literal("default"),
    z.object({
      name: z.string(),
      reactions: z.array(ReactionSchema),
    }),
  ]),
  creationTime: z.date(),
  config: AnalysisConfigSchema,
});

export const getAll = zQuery({
  args: {},
  handler: async ({ db, user }) => {
    const analyses = await db
      .query("analyses")
      .withIndex("user", (q) => q.eq("user", user))
      .collect();

    return await Promise.all(
      analyses.map(async (analysis) => {
        let finalReactionDb:
          | "default"
          | {
              name: string;
              reactions: z.infer<typeof ReactionSchema>[];
            } = "default";
        if (analysis.reactionDb !== "default") {
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
            sampleColumns: rawFile.sampleColumns,
          },
          reactionDb: finalReactionDb,
          config: analysis.config,
          creationTime: new Date(analysis._creationTime),
        };
      })
    );
  },
  output: z.array(AnalysisOutputSchema),
});
