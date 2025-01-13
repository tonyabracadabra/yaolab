// Migration to update "MDial" to "MSDial" in rawFiles table
export default async function (ctx) {
  const rawFiles = await ctx.db.query("rawFiles").collect();

  for (const rawFile of rawFiles) {
    if (rawFile.tool === "MDial") {
      await ctx.db.patch(rawFile._id, {
        tool: "MSDial",
      });
    }
  }
}
