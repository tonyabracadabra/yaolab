import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { zid } from "convex-helpers/server/zod";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { api, internal } from "./_generated/api";
import { AnalysisCreationInputSchema } from "./schema";
import { s3Client, zAction, zMutation } from "./utils";

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

export const retryAnalysis = zAction({
  args: { id: zid("analyses"), token: z.string() },
  handler: async ({ runMutation }, { id, token }) => {
    await runMutation(api.analyses.update, {
      id,
      status: "running",
    });

    const response = await fetch(
      `${process.env.FASTAPI_URL}/analysis/restart/${id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return { status: response.ok ? "success" : "error" };
  },
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

export const getFileUrl = zAction({
  args: {
    storageId: z.string(),
  },
  handler: async (ctx, { storageId }) => {
    const url = await ctx.storage.getUrl(storageId);

    return { url };
  },
});

export const downloadDefaultReactions = zAction({
  args: {},
  handler: async (_) => {
    const response = await fetch(
      `${process.env.FASTAPI_URL}/analysis/defaultReactions`
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  },
  output: z.object({ csv: z.string() }),
});

export const preprocessIons = zAction({
  args: {
    targetedIons: z.string(),
    tool: z.enum(["MZmine3", "MDial"]),
    token: z.string(),
  },
  handler: async ({ storage }, { tool, targetedIons, token }) => {
    const response = await fetch(
      `${process.env.FASTAPI_URL}/analysis/preprocessIons`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tool, targetedIons }),
      }
    );

    if (!response.ok) {
      await storage.delete(targetedIons);
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();

    return data;
  },
  output: z.object({
    storageId: z.string(),
    sampleCols: z.array(z.string()),
  }),
});

export const removeFile = zAction({
  args: {
    storageId: z.string(),
  },
  handler: async (_, { storageId }) => {
    const command = new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME || "",
      Key: storageId,
    });

    try {
      await s3Client.send(command);
    } catch (error) {
      console.error("Error removing file", error);
      throw error;
    }
  },
});

export const generateUploadUrl = zMutation({
  args: { key: z.optional(z.string()) },
  handler: async (_, { key }) => {
    const updatedKey = key || uuidv4();
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME || "",
      Key: updatedKey,
    });

    try {
      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      }); // URL expires in 1 hour
      return { signedUrl, key: updatedKey };
    } catch (error) {
      console.error("Error generating signed URL", error);
      throw error;
    }
  },
});
