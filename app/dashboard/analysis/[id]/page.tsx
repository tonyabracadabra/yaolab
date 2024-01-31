"use client";

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
      <div>
        Log:
        {analysis.log}
      </div>
      <div>
        Status:
        {analysis.status}
      </div>
      <div>
        Result:
        {/* {analysis.result} */}
      </div>
    </div>
  );
}
