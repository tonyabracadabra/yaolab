"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Workflow } from "@/components/workflow";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAction, useQuery } from "convex/react";
import { Atom, Download, File, List, Loader2, TimerIcon } from "lucide-react";
import Link from "next/link";
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
            const file = new (File as any)([blob], "result.csv");

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
  }, [analysis?.result, getFileUrl]);

  if (!analysis) {
    return <Loader2 className="animate-spin" />;
  }

  const correlationToColor = (correlation: number) => {
    const intensity = Math.round(255 * (1 - correlation)); // Higher correlation, darker color
    return `rgb(${intensity},${intensity},${intensity})`; // Generating a shade of gray
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-2 w-full">
      <div className="flex items-center justify-between gap-2 w-full">
        <Link href="/dashboard/analysis">
          <Button
            size="sm"
            variant="secondary"
            className="flex w-fit items-center justify-center gap-2"
          >
            <List size={16} /> All analyses
          </Button>
        </Link>
        <div className="flex items-center justify-center gap-2">
          <Badge className="flex items-center justify-center gap-1">
            <File size={14} />
            <span className="ml-2">{analysis.rawFile?.name}</span>
          </Badge>
          <Badge className="flex items-center justify-center gap-1">
            <Atom size={14} />
            <span className="ml-2">
              {typeof analysis.reactionDb === "string"
                ? "default"
                : analysis.reactionDb?.name}
            </span>
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="flex items-center justify-center gap-2">
                  <span className="bg-secondary/50 rounded-full w-4 h-4">
                    {analysis.config.experiments.length}
                  </span>
                  Experiments
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-neutral-400">
                  {analysis.config.experiments.map((e, i) => (
                    <div
                      key={i}
                      className="w-full flex-col flex items-center max-w-[400px]"
                    >
                      <div>{e.name}</div>
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col gap-2">
                          <div>Blank Groups</div>
                          <div className="text-neutral-500 gap-2 flex items-center justify-center">
                            {e.blankGroups.map((g, j) => (
                              <Badge key={j}>{g}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div>Sample Groups</div>
                          <div className="text-neutral-500 gap-2 flex items-center justify-center">
                            {e.sampleGroups.map((g, j) => (
                              <Badge key={j}>{g}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 text-xs">
        <TimerIcon size={16} />
        {new Date(analysis._creationTime).toString()}
      </div>
      <Workflow progress={analysis.progress} log={analysis.log} />
      <div className="w-full gap-4 items-center flex">
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
