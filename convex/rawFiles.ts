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

export const getAllRawFiles = zQuery({
  handler: async ({ db, user }) => {
    return await db
      .query("rawFiles")
      .withIndex("user", (q) => q.eq("user", user))
      .collect();
  },
});
