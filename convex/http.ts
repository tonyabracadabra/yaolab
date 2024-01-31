import { httpRouter } from "convex/server";
import { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";

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

export default http;
