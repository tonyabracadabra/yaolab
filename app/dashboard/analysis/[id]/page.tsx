"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { LoaderIcon } from "lucide-react";

export default function Page({ params }: { params: { id: Id<"analyses"> } }) {
  const analysis = useQuery(api.analyses.get, { id: params.id });

  if (!analysis) {
    return <LoaderIcon className="animate-spin" />;
  }

  return (
    <div>
      {analysis.status === "failed" && <Button>Retry</Button>}
      <div>
        Log:
        {analysis.log}
      </div>
      {/* {analysis.status === "complete" && <div>{
      
      analysis.result?.edges
      
      
      }</div>} */}
    </div>
  );
}
