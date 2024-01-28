import { RawFileCreationInputSchema } from "./schema";
import { zMutation, zQuery } from "./utils";

export const createRawFile = zMutation({
  args: RawFileCreationInputSchema.shape,
  handler: async ({ db, user }, { name, file, fileType, sampleColumns }) => {
    const id = await db.insert("rawFiles", {
      name,
      user,
      file,
      fileType,
      sampleColumns,
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
