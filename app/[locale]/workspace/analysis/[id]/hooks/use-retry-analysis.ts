import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";
import { useAction } from "convex/react";

export function useRetryAnalysis(analysisId: string | Id<"analyses">) {
  const retryAnalysis = useAction(api.actions.retryAnalysis);
  const { getToken } = useAuth();

  const handleRetry = async () => {
    const token = await getToken({
      template: "convex",
      skipCache: true,
    });

    if (!token) {
      throw new Error("No token found");
    }

    await retryAnalysis({
      id: analysisId as Id<"analyses">,
      token,
    });
  };

  return handleRetry;
}
