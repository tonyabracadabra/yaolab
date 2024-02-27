import { Id } from "@/convex/_generated/dataModel";

interface AnalysisResultInterface {
  analysisId: Id<"analyses">;
}

export default function AnalysisResult({
  analysisId,
}: AnalysisResultInterface) {}
