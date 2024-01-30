import { zid } from "convex-helpers/server/zod";
import { httpRouter } from "convex/server";
import { z } from "zod";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";
import { AnalysisCreationInputSchema } from "./schema";
import { zAction } from "./utils";

const http = httpRouter();

http.route({
  path: "/downloadFile",
  method: "GET",
  handler: httpAction(async ({ storage }, request) => {
    const { searchParams } = new URL(request.url);
    const storageId = searchParams.get("storageId")!;
    if (!storageId) {
      return new Response("storageId is required", {
        status: 400,
      });
    }

    const blob = await storage.get(storageId as Id<"_storage">);
    if (blob === null) {
      return new Response("File not found", {
        status: 404,
      });
    }
    return new Response(blob);
  }),
});

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
    formula: z.string(),
  },
  handler: async (_, { formula }) => {
    const response = await fetch(
      `${process.env.FASTAPI_URL}/analysis/mass?formula=${formula}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
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
