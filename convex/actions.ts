import { internal } from "./_generated/api";
import { TaskCreationInputSchema } from "./schema";
import { zAction } from "./utils";

export const triggerTask = zAction({
  args: TaskCreationInputSchema.shape,
  handler: async ({ runMutation }, { config, reactionDb, rawFile }) => {
    const res: any = await runMutation(internal.tasks.create, {
      config,
      reactionDb,
      rawFile,
    });

    // const response = await fetch(`${process.env.FASTAPI_URL}/analysis`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(res),
    // });

    return res;
  },
});
