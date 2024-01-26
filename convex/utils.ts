import { zCustomMutation, zCustomQuery } from "convex-helpers/server/zod";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const zMutation = zCustomMutation(mutation, {
  // You could require arguments for all queries here.
  args: {},
  input: async ({ auth }, args) => {
    const identity = await auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated");
    }
    const { subject: user } = identity;

    return { ctx: { user }, args };
  },
});

export const zQuery = zCustomQuery(query, {
  // You could require arguments for all queries here.
  args: {},
  input: async ({ auth }, args) => {
    const identity = await auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated");
    }
    const { subject: user } = identity;

    return { ctx: { user }, args };
  },
});
