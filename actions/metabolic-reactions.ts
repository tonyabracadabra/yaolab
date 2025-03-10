"use server";

import Papa from "papaparse";
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

export async function queryMetabolicReactions(): Promise<MetabolicReactionResult> {
  try {
    const response = await fetch(
      "https://yaolab.network/files/kegg-pairs-enzyme-pathways.csv"
    );
    const fileContent = await response.text();

    const { data } = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    const validatedData = data.map((record) => reactionSchema.parse(record));

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
  } catch (error) {
    console.error("Error processing metabolic reaction query:", error);
    throw new Error("Failed to process metabolic reaction query");
  }
}
