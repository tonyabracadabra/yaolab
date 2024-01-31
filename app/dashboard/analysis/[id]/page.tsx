"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAction, useQuery } from "convex/react";
import { LoaderIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function Page({ params }: { params: { id: Id<"analyses"> } }) {
  const analysis = useQuery(api.analyses.get, { id: params.id });
  const [result, setResult] = useState<object[] | null>(null);
  const download = useAction(api.actions.download);

  useEffect(() => {
    if (analysis?.result) {
      download(analysis.result).then((result) => {
        setResult(result);
      });
    }
  }, [analysis?.result]);

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
