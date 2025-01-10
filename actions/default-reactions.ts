"use server";

import Papa from "papaparse";
import { z } from "zod";

const IonMode = z.enum(["pos", "neg"]);
type IonMode = z.infer<typeof IonMode>;

interface DefaultReactionsResponse {
  csv: string;
}

export async function downloadDefaultReactions(
  mode: IonMode
): Promise<DefaultReactionsResponse> {
  // Use absolute URLs with process.env.NEXT_PUBLIC_APP_URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(
    `${baseUrl}/files/${mode === "pos" ? "pos" : "neg"}-adduct-ions.csv`,
    { cache: "no-store" }
  );
  const commonResponse = await fetch(
    `${baseUrl}/files/default-common-reactions.csv`,
    { cache: "no-store" }
  );

  if (!response.ok || !commonResponse.ok) {
    throw new Error(
      `Failed to download default reactions: ${response.statusText}`
    );
  }

  const adductCsvText = await response.text();
  const commonCsvText = await commonResponse.text();

  const adductData = Papa.parse(adductCsvText, {
    header: true,
    skipEmptyLines: true,
  }).data;

  const commonData = Papa.parse(commonCsvText, {
    header: true,
    skipEmptyLines: true,
  }).data;

  // Combine common reactions with mode-specific adduct ions
  const combinedData = [...commonData, ...adductData];

  // Convert back to CSV
  const csv = Papa.unparse(combinedData);

  return { csv };
}
