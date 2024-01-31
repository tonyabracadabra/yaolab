import { zid } from "convex-helpers/server/zod";
import { z } from "zod";
import { internal } from "./_generated/api";
import { AnalysisCreationInputSchema } from "./schema";
import { zAction } from "./utils";

export const triggerAnalysis = zAction({
  args: { ...AnalysisCreationInputSchema.shape, token: z.string() },
  handler: async ({ runMutation }, { config, reactionDb, rawFile, token }) => {
    const res: any = await runMutation(internal.analyses.create, {
      config,
      reactionDb,
      rawFile,
    });

    const response = await fetch(`${process.env.FASTAPI_URL}/analysis/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(res),
    });

    return { ...res, status: response.ok ? "success" : "error" };
  },
  output: z.object({
    id: zid("analyses"),
    status: z.enum(["success", "error"]),
  }),
});

export const calculateMass = zAction({
  args: {
    formulaChanges: z.array(z.string()),
  },
  handler: async (_, { formulaChanges }) => {
    const response = await fetch(`${process.env.FASTAPI_URL}/analysis/mass`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ formulaChanges }),
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();

    return data;
  },
  output: z.object({ masses: z.array(z.number()) }),
});

export const download = zAction({
  args: {
    storageId: zid("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.get(storageId);
  },
});
