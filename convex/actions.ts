import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { zid } from "convex-helpers/server/zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import { api, internal } from "./_generated/api";
import { AnalysisCreationInputSchema } from "./schema";
import { s3Client, zAction } from "./utils";

export const triggerAnalysis = zAction({
  args: { ...AnalysisCreationInputSchema.shape, token: z.string() },
  handler: async ({ runMutation }, { config, reactionDb, rawFile, token }) => {
    const res: any = await runMutation(internal.analyses.create, {
      config,
      reactionDb,
      rawFile,
    });

    const response = await fetch(
      `${process.env.ANALYSIS_API_URL}/analysis/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(res),
      }
    );

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
      progress: [],
      log: "",
    });

    const response = await fetch(
      `${process.env.ANALYSIS_API_URL}/analysis/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
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
    const response = await fetch(
      `${process.env.ANALYSIS_API_URL}/analysis/mass`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ formulaChanges }),
      }
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();

    return data;
  },
  output: z.object({ masses: z.array(z.number()) }),
});

export const preprocessIons = zAction({
  args: {
    targetedIons: z.string(),
    tool: z.enum(["MZmine3", "MSDial"]),
    token: z.string(),
  },
  handler: async ({ runAction }, { tool, targetedIons, token }) => {
    const response = await fetch(
      `${process.env.ANALYSIS_API_URL}/analysis/preprocessIons`,
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
      await runAction(api.actions.removeFile, {
        storageId: targetedIons,
      });
      const errorText = await response.text();
      throw new Error(
        `Failed to preprocess ions: HTTP ${response.status} - ${errorText}`
      );
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

export const generateUploadUrl = zAction({
  args: { fileName: z.optional(z.string()), mimeType: z.string() },
  handler: async (_, { fileName, mimeType }) => {
    const storageId = `${nanoid(10)}${fileName ? `.${fileName}` : ""}`;
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME || "",
      Key: storageId,
      ContentType: mimeType,
      Metadata: {
        fileName: fileName || "",
      },
    });

    try {
      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 60 * 60,
      });
      return { signedUrl, storageId };
    } catch (error) {
      throw error;
    }
  },
});

export const generateDownloadUrl = zAction({
  args: { storageId: z.string() },
  handler: async (_, { storageId }) => {
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME || "",
      Key: storageId,
    });

    try {
      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 60,
      });
      return { signedUrl };
    } catch (error) {
      throw error;
    }
  },
});

export const removeAnalysis = zAction({
  args: { id: zid("analyses") },
  handler: async ({ runAction, runMutation, runQuery }, { id }) => {
    const analysis = await runQuery(api.analyses.get, { id });
    if (analysis.result) {
      await Promise.all([
        runAction(api.actions.removeFile, {
          storageId: analysis.result.edges,
        }),
        runAction(api.actions.removeFile, {
          storageId: analysis.result.nodes,
        }),
      ]);
    }

    await runMutation(api.analyses.remove, { id });
  },
});

export const removeRawFile = zAction({
  args: { id: zid("rawFiles") },
  handler: async ({ runMutation, runQuery, runAction }, { id }) => {
    const rawFile = await runQuery(api.rawFiles.get, { id });
    if (!rawFile) {
      throw new Error("Raw file not found");
    }

    const analyses = await runQuery(api.analyses.getAll, { rawFile: id });

    // Using Promise.all for concurrent execution
    await Promise.all([
      runAction(api.actions.removeFile, { storageId: rawFile.mgf }),
      runAction(api.actions.removeFile, { storageId: rawFile.targetedIons }),
      ...analyses.map((analysis) =>
        runAction(api.actions.removeAnalysis, { id: analysis.id })
      ),
    ]);

    await runMutation(api.rawFiles.remove, { id });
  },
});

export const uploadFile = zAction({
  args: {
    file: z.instanceof(ArrayBuffer),
    fileName: z.string(),
  },
  handler: async (
    { runAction },
    args: { file: ArrayBuffer; fileName: string }
  ): Promise<{ storageId: string }> => {
    // Determine mime type based on file extension
    const mimeType = args.fileName.endsWith(".parquet")
      ? "application/octet-stream"
      : "application/binary";

    // Generate signed URL for upload
    const { signedUrl, storageId } = await runAction(
      api.actions.generateUploadUrl,
      {
        fileName: args.fileName,
        mimeType,
      }
    );

    // Upload the binary data using the signed URL
    const response = await fetch(signedUrl, {
      method: "PUT",
      body: args.file,
      headers: {
        "Content-Type": mimeType,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    return { storageId };
  },
  output: z.object({
    storageId: z.string(),
  }),
});
