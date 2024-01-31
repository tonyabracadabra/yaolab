import { z } from "zod";
import { ReactionSchema } from "./schema";
import { zMutation, zQuery } from "./utils";

export const create = zMutation({
  args: {
    name: z.string(),
    reactions: z.array(ReactionSchema),
  },
  handler: async ({ db, user }, { reactions, name }) => {
    const id = await db.insert("reactionDatabases", {
      user,
      name,
      reactions,
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
