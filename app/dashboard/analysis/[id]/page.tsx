"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAction, useQuery } from "convex/react";
import {
  Check,
  Download,
  FileWarning,
  Loader2,
  LoaderIcon,
} from "lucide-react";
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
  const [url, setUrl] = useState<string>("");
  const getFileUrl = useAction(api.actions.getFileUrl);

  useEffect(() => {
    const fetchAndProcessData = async (storageId: Id<"_storage">) => {
      const { url } = await getFileUrl({ storageId });
      if (!url) {
        return;
      }
      setUrl(url);
      fetch(url)
        .then((response) => response.blob())
        .then((blob: Blob | null) => {
          if (blob) {
            // // Convert Blob to File
            const file = new File([blob], "data.csv", { type: blob.type });

            Papa.parse<RowData>(file, {
              header: true,
              dynamicTyping: true,
              complete: (results) => {
                const nodesSet = new Set<string>();
                const links: Link[] = [];

                results.data.forEach((row) => {
                  if (!row.ID1 || !row.ID2 || !row.Value) {
                    return;
                  }

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

                const nodes: Node[] = Array.from(nodesSet).map((id) => ({
                  id,
                }));
                setGraphData({ nodes, links });
              },
            });
          }
        });
    };

    if (analysis?.result) {
      fetchAndProcessData(analysis.result);
    }
  }, [analysis?.result]);

  if (!analysis) {
    return <LoaderIcon className="animate-spin" />;
  }

  const correlationToColor = (correlation: number) => {
    const intensity = Math.round(255 * (1 - correlation)); // Higher correlation, darker color
    return `rgb(${intensity},${intensity},${intensity})`; // Generating a shade of gray
  };

  return (
    <div>
      <div className="w-full gap-4 items-center flex">
        <Badge
          color="green"
          className="flex items-center justify-center gap-2 w-fit"
        >
          {analysis.status === "complete" && <Check size={12} />}
          {analysis.status === "pending" && (
            <Loader2 className="animate-spin" size={12} />
          )}
          {analysis.status === "failed" && <FileWarning size={12} />}
          <div>{analysis.status}</div>
        </Badge>
        {url && (
          <Button
            size="xs"
            onClick={() => {
              window.open(url, "_blank");
            }}
            className="flex items-center justify-center gap-2"
          >
            <span>Download</span>
            <Download size={12} />
          </Button>
        )}
      </div>
      {analysis.status === "pending" && <div>{analysis.log}</div>}
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="id"
        linkDirectionalParticles="value"
        linkDirectionalParticleWidth={(link: Link) => Math.sqrt(link.value)}
        linkColor={(link: Link) => correlationToColor(link.correlation)}
      />
    </div>
  );
}
