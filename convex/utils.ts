import {
  zCustomAction,
  zCustomMutation,
  zCustomQuery,
} from "convex-helpers/server/zod";
import { Auth } from "convex/server";
import { action, internalMutation, mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

const getUser = async ({ auth }: { auth: Auth }) => {
  const identity = await auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Unauthenticated");
  }
  const { subject: user } = identity;

  return user;
};

export const zMutation = zCustomMutation(mutation, {
  // You could require arguments for all queries here.
  args: {},
  input: async ({ auth }, args) => {
    const user = await getUser({ auth });

    return { ctx: { user }, args };
  },
});

export const zInternalMutation = zCustomMutation(internalMutation, {
  // You could require arguments for all queries here.
  args: {},
  input: async ({ auth }, args) => {
    const user = await getUser({ auth });

    return { ctx: { user }, args };
  },
});

export const zQuery = zCustomQuery(query, {
  // You could require arguments for all queries here.
  args: {},
  input: async ({ auth }, args) => {
    const user = await getUser({ auth });

    return { ctx: { user }, args };
  },
});

export const zAction = zCustomAction(action, {
  // You could require arguments for all queries here.
  args: {},
  input: async ({ auth }, args) => {
    const user = await getUser({ auth });

    return { ctx: { user }, args };
  },
});
