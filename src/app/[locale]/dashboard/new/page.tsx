"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AnalysisConfigSchema } from "@/convex/schema";
import AnalysisCreation from "@/src/components/analysis-creation";
import { useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";

type AnalysisConfig = z.infer<typeof AnalysisConfigSchema>;

const AnalysisWrapper = ({
  id,
  handleSubmit,
}: {
  id: Id<"analyses">;
  handleSubmit: (id: Id<"analyses">) => void;
}) => {
  const analysis = useQuery(api.analyses.get, { id });

  if (!analysis) {
    return <div>Loading...</div>;
  }

  return (
    <AnalysisCreation
      defaultAnalysis={{
        rawFile: analysis.rawFile._id,
        reactionDb: analysis.reactionDb,
        config: analysis.config as AnalysisConfig,
      }}
      onCreate={handleSubmit}
    />
  );
};

export default function Analysis() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const handleSubmit = async (id: Id<"analyses">) => {
    router.push(`/dashboard/analysis/${id}`);
  };

  return (
    <>
      {from ? (
        <AnalysisWrapper
          id={from as Id<"analyses">}
          handleSubmit={handleSubmit}
        />
      ) : (
        <AnalysisCreation onCreate={handleSubmit} />
      )}
    </>
  );
}
