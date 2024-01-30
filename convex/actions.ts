import { zid } from "convex-helpers/server/zod";
import { z } from "zod";
import { internal } from "./_generated/api";
import { AnalysisCreationInputSchema } from "./schema";
import { zAction } from "./utils";

export const triggerAnalysis = zAction({
  args: AnalysisCreationInputSchema.shape,
  handler: async ({ runMutation }, { config, reactionDb, rawFile }) => {
    const res: any = await runMutation(internal.tasks.create, {
      config,
      reactionDb,
      rawFile,
    });

    // const response = await fetch(`${process.env.FASTAPI_URL}/analysis`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(res),
    // });

    return res;
  },
  output: z.object({
    id: zid("analyses"),
    status: z.enum(["success", "error"]),
  }),
});

export const calculateMass = zAction({
  args: {
    formula: z.string(),
  },
  handler: async (_, { formula }) => {
    const response = await fetch(
      `${process.env.FASTAPI_URL}/mass?formula=${formula}`
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();

    return data;
  },
  output: z.object({
    mass: z.number(),
    formula: z.string(),
  }),
});
