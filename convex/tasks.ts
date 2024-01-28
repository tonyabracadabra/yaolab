import { zid } from "convex-helpers/server/zod";
import { z } from "zod";
import {
  TaskCreationInputSchema,
  TaskResultSchema,
  TaskStatus,
} from "./schema";
import { zInternalMutation, zMutation, zQuery } from "./utils";

export const create = zInternalMutation({
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

export const get = zQuery({
  args: { id: zid("tasks") },
  handler: async ({ db }, args) => {
    const task = await db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }

    return {
      ...task,
      rawFile: await db.get(task.rawFile),
      reactionDb: await db.get(task.reactionDb),
    };
  },
});

export const update = zMutation({
  args: {
    id: zid("tasks"),
    status: z.optional(TaskStatus),
    log: z.optional(z.string()),
    result: z.optional(TaskResultSchema),
  },
  handler: async ({ db }, { id, status, log, result }) => {
    db.patch(id, {
      ...(status && { status }),
      ...(log && { log }),
      ...(result && { result }),
    });
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
