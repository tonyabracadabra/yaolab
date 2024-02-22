import { z } from "zod";
import { IonMode, ReactionSchema } from "./schema";
import { zMutation, zQuery } from "./utils";

export const create = zMutation({
  args: {
    name: z.string(),
    reactions: z.array(ReactionSchema),
    ionMode: IonMode,
  },
  handler: async ({ db, user }, { reactions, name, ionMode }) => {
    const id = await db.insert("reactionDatabases", {
      user,
      name,
      reactions,
      ionMode,
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
