import { zid } from "convex-helpers/server/zod";
import { RawFileCreationInputSchema } from "./schema";
import { zMutation, zQuery } from "./utils";

export const create = zMutation({
  args: RawFileCreationInputSchema.shape,
  handler: async (
    { db, user },
    { name, mgf, targetedIons, tool, sampleCols, desc }
  ) => {
    const id = await db.insert("rawFiles", {
      user,
      desc,
      name,
      mgf,
      targetedIons,
      tool,
      sampleCols,
    });

    return { id };
  },
});

export const getAll = zQuery({
  handler: async ({ db, user }) => {
    return await db
      .query("rawFiles")
      .withIndex("user", (q) => q.eq("user", user))
      .collect();
  },
});

export const remove = zMutation({
  args: { id: zid("rawFiles") },
  handler: async ({ db }, { id }) => {
    await db.delete(id);
  },
});

export const get = zQuery({
  args: { id: zid("rawFiles") },
  handler: async ({ user, db }, { id }) => {
    const rawFile = await db.get(id);

    if (!rawFile) {
      throw new Error("Raw File Not found");
    }

    if (rawFile.user !== user) {
      throw new Error("Unauthorized");
    }

    return rawFile;
  },
});
