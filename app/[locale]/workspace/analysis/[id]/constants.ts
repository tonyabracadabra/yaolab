export const kAvailableNodes = [
  { key: "mz", label: "m/z", col: "mz" },
  { key: "rt", label: "Retention Time", col: "rt" },
] as const;

export const kAvailableEdges = [
  { col: "mzDiff", label: "m/z Difference" },
  { col: "rtDiff", label: "Retention Time Difference" },
  { col: "matchedMzDiff", label: "Matched m/z Difference" },
  { col: "matchedFormulaChange", label: "Matched Formula Change" },
  { col: "matchedDescription", label: "Matched Reaction Description" },
  { col: "correlation", label: "Sample Correlation" },
  { col: "modCos", label: "Modified Cosine Similarity" },
] as const;

export const colorSchemes = [
  { label: "Accent", value: "accent" },
  { label: "Tableau", value: "tableau" },
  { label: "Purple", value: "purple" },
  { label: "Green", value: "green" },
  { label: "Orange", value: "orange" },
  { label: "Classic", value: "classic" },
  { label: "Rainbow", value: "rainbow" },
] as const;
