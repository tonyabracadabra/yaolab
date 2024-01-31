"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAction, useQuery } from "convex/react";
import { LoaderIcon } from "lucide-react";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import { ForceGraph2D } from "react-force-graph";

interface RowData {
  ID1: string;
  ID2: string;
  Value: number;
  Correlation: number;
  RetentionTimeDifference: number;
  MZDifference: number;
  MatchedMZDifference: number;
  MatchedFormulaChange: string;
  MatchedReactionDescription: string;
  RedundantData: string;
  ModCos: number;
}

interface Node {
  id: string;
}

interface Link {
  source: string;
  target: string;
  value: number;
  correlation: number;
  retentionTimeDifference: number;
  mzDifference: number;
  matchedMzDifference: number;
  matchedFormulaChange: string;
  matchedReactionDescription: string;
  redundantData: string;
  modCos: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export default function Page({ params }: { params: { id: Id<"analyses"> } }) {
  const analysis = useQuery(api.analyses.get, { id: params.id });
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const download = useAction(api.actions.download);

  useEffect(() => {
    if (!analysis?.result) {
      return;
    }
    // Replace with your download function
    // Ensure it returns a Promise that resolves to Blob | null
    download({ storageId: analysis?.result }).then((blob: Blob | null) => {
      if (blob) {
        // Convert Blob to File
        const file = new File([blob], "data.csv", { type: blob.type });

        Papa.parse<RowData>(file, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            const nodesSet = new Set<string>();
            const links: Link[] = [];

            results.data.forEach((row) => {
              nodesSet.add(row.ID1);
              nodesSet.add(row.ID2);
              links.push({
                source: row.ID1,
                target: row.ID2,
                value: row.Value,
                correlation: row.Correlation,
                retentionTimeDifference: row.RetentionTimeDifference,
                mzDifference: row.MZDifference,
                matchedMzDifference: row.MatchedMZDifference,
                matchedFormulaChange: row.MatchedFormulaChange,
                matchedReactionDescription: row.MatchedReactionDescription,
                redundantData: row.RedundantData,
                modCos: row.ModCos,
              });
            });

            const nodes: Node[] = Array.from(nodesSet).map((id) => ({ id }));
            setGraphData({ nodes, links });
          },
        });
      }
    });
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
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="id"
          nodeAutoColorBy="group"
          linkDirectionalParticles="value"
          linkDirectionalParticleWidth={(link: Link) => Math.sqrt(link.value)}
        />
      </div>
    </div>
  );
}
