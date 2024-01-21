import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { TaskConfigSchema } from "./schema";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const createTask = mutation({
  args: { file: v.id("_storage"), config: TaskConfigSchema },
  handler: async ({ db, auth }, { config, file }) => {
    const identity = await auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated call to mutation");
    }
    const { subject: user } = identity;

    await db.insert("tasks", {
      user,
      file,
      config,
      status: "pending",
    });
  },
});
