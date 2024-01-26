import { zid } from "convex-helpers/server/zod";
import { z } from "zod";
import { FileType } from "./schema";
import { zMutation, zQuery } from "./utils";

export const createRawFile = zMutation({
  args: { name: z.string(), file: zid("_storage"), fileType: FileType },
  handler: async ({ db, user }, { name, file, fileType }) => {
    const id = await db.insert("rawFiles", {
      name,
      user,
      file,
      fileType,
    });

    return { id };
  },
});

export const getAllRawFiles = zQuery({
  handler: async ({ db, user }) => {
    return await db
      .query("rawFiles")
      .withIndex("user", (q) => q.eq("user", user))
      .collect();
  },
});
