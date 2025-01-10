"use server";

import fs from "fs/promises";
import Papa from "papaparse";
import path from "path";
import { z } from "zod";

const reactionSchema = z.object({
  kegg1: z.string(),
  kegg2: z.string(),
  smiles1: z.string(),
  smiles2: z.string(),
  mass1: z.string(),
  mass2: z.string(),
  formula1: z.string(),
  formula2: z.string(),
  "Δm/z": z.string(),
  mzDiff: z.string(),
  "REACTION ID": z.string(),
  "ENZYME ID": z.string(),
  COMMENT: z.string(),
  PATHWAY: z.string(),
});

type ReactionRecord = z.infer<typeof reactionSchema>;

interface MetabolicReactionResult {
  enzymes: string[];
  pathways: string[];
  mzToReactions: {
    [key: string]: {
      enzymes: string[];
      pathways: string[];
    };
  };
}

export async function queryMetabolicReactions(
  mz: number,
  tolerance: number | undefined = 0.01
): Promise<MetabolicReactionResult> {
  try {
    const filePath = path.join(
      process.cwd(),
      "public/files/kegg-pairs-enzyme-pathways.csv"
    );
    const fileContent = await fs.readFile(filePath, "utf-8");

    const { data } = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    const validatedData = data.map((record) => reactionSchema.parse(record));

    // If tolerance is undefined, return all data
    if (tolerance === undefined) {
      const mzToReactions: {
        [key: string]: { enzymes: string[]; pathways: string[] };
      } = {};

      validatedData.forEach((row: ReactionRecord) => {
        const rowMz = parseFloat(row["Δm/z"]).toFixed(4); // Convert to string with fixed precision
        const current = mzToReactions[rowMz] || {
          enzymes: [],
          pathways: [],
        };

        if (row["ENZYME ID"]) {
          current.enzymes = Array.from(
            new Set([...current.enzymes, row["ENZYME ID"]])
          );
        }

        if (row["PATHWAY"]) {
          const pathways = row["PATHWAY"]
            .split("///")
            .map((p) => p.trim().replace("rn", ""));
          current.pathways = Array.from(
            new Set([...current.pathways, ...pathways])
          );
        }

        mzToReactions[rowMz] = current;
      });

      // Create sets and convert to arrays for unique values
      const allEnzymes = new Set<string>();
      const allPathways = new Set<string>();

      validatedData.forEach((m) => {
        if (m["ENZYME ID"]) allEnzymes.add(m["ENZYME ID"]);
        if (m["PATHWAY"]) {
          m["PATHWAY"]
            .split("///")
            .map((p) => p.trim().replace("rn", ""))
            .forEach((p) => allPathways.add(p));
        }
      });

      return {
        enzymes: Array.from(allEnzymes),
        pathways: Array.from(allPathways),
        mzToReactions,
      };
    }

    // For specific mz value
    const mzToReactions: {
      [key: string]: { enzymes: string[]; pathways: string[] };
    } = {};
    const matches = validatedData.filter((row: ReactionRecord) => {
      const rowMz = parseFloat(row["Δm/z"]);
      return Math.abs(rowMz - mz) <= tolerance!;
    });

    // Create sets for unique values
    const matchedEnzymes = new Set<string>();
    const matchedPathways = new Set<string>();

    matches.forEach((m) => {
      if (m["ENZYME ID"]) matchedEnzymes.add(m["ENZYME ID"]);
      if (m["PATHWAY"]) {
        m["PATHWAY"]
          .split("///")
          .map((p) => p.trim().replace("rn", ""))
          .forEach((p) => matchedPathways.add(p));
      }
    });

    return {
      enzymes: Array.from(matchedEnzymes),
      pathways: Array.from(matchedPathways),
      mzToReactions,
    };
  } catch (error) {
    console.error("Error processing metabolic reaction query:", error);
    throw new Error("Failed to process metabolic reaction query");
  }
}
