import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { httpAction } from "./_generated/server";
import { s3Client } from "./utils";

export const getDownloadUrl = httpAction(async (ctx, request) => {
  const { key, fileType } = await request.json();

  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME || "",
    Key: key,
  });

  const signedUrl = getSignedUrl(s3Client, command, {
    expiresIn: 60 * 60 * 24,
  });

  return new Response(JSON.stringify({ signedUrl, fileType }), {
    headers: { "Content-Type": "application/json" },
  });
});
