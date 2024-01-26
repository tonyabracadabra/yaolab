import { zid } from "convex-helpers/server/zod";
import { z } from "zod";
import { CustomReactionSchema } from "./schema";
import { zMutation, zQuery } from "./utils";

export const createReactionDatabase = zMutation({
  args: {
    file: zid("_storage"),
    name: z.string(),
    customReactions: z.array(CustomReactionSchema),
  },
  handler: async ({ db, user }, { customReactions, file, name }) => {
    const id = await db.insert("reactionDatabases", {
      user,
      name,
      file,
      customReactions,
    });

    return { id };
  },
});

export const getAllReactionDatabases = zQuery({
  handler: async ({ db, user }) => {
    return await db
      .query("reactionDatabases")
      .withIndex("user", (q) => q.eq("user", user))
      .collect();
  },
});
