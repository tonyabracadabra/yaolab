"use client";

import AnalysisCreation from "@/components/analysis-creation";
import { Id } from "@/convex/_generated/dataModel";

import { useRouter } from "next/navigation";

export default function Analysis() {
  const router = useRouter();

  const handleSubmit = async (id: Id<"analyses">) => {
    router.push(`/dashboard/analysis/${id}`);
  };

  return (
    <main className="h-full flex w-full font-sans">
      <AnalysisCreation onCreate={handleSubmit} />
    </main>
  );
}
