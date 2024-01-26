import { zid } from "convex-helpers/server/zod";
import { TaskCreationInputSchema } from "./schema";
import { zMutation, zQuery } from "./utils";

export const createTask = zMutation({
  args: TaskCreationInputSchema.shape,
  handler: async ({ db, user }, { config, reactionDb, rawFile }) => {
    const id = await db.insert("tasks", {
      user,
      rawFile,
      reactionDb,
      config,
      status: "pending",
    });

    return { id };
  },
});

export const getTask = zQuery({
  args: { id: zid("tasks") },
  handler: async ({ db }, args) => {
    return await db.get(args.id);
  },
});

export const getAllTasks = zQuery({
  handler: async ({ db, user }) => {
    const tasks = await db
      .query("tasks")
      .withIndex("user", (q) => q.eq("user", user))
      .collect();

    return tasks.map((task) => ({
      ...task,
      rawFile: db.get(task.rawFile),
      reactionDb: db.get(task.reactionDb),
    }));
  },
});
