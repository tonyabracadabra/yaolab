"use client";

import { MagicCard } from "@/components/magicui/magic-card";
import AnalysisResult from "@/components/task-result";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Workflow } from "@/components/workflow";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AnalysisResultSchema, EdgeSchema, NodeSchema } from "@/convex/schema";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";

import {
  Atom,
  BadgeCheck,
  Download,
  File as FileIcon,
  FileWarning,
  FlaskConical,
  List,
  Loader2,
  LucideWorkflow,
  Settings2,
  TimerIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import { ForceGraph2D } from "react-force-graph";
import { z } from "zod";

type Edge = z.infer<typeof EdgeSchema>;
type Node = z.infer<typeof NodeSchema>;

interface GraphData {
  nodes: Node[];
  links: Edge[];
}

type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export default function Page({ params }: { params: { id: Id<"analyses"> } }) {
  const analysis = useQuery(api.analyses.get, { id: params.id });
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const generateDownloadUrl = useAction(api.actions.generateDownloadUrl);
  const retryAnalysis = useAction(api.actions.retryAnalysis);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchAndProcessData = async (result: AnalysisResult) => {
      try {
        const [edgesUrl, nodesUrl] = await Promise.all([
          generateDownloadUrl({ storageId: result.edges }).then(
            (data) => data.signedUrl
          ),
          generateDownloadUrl({ storageId: result.nodes }).then(
            (data) => data.signedUrl
          ),
        ]);

        // Fetch edges and nodes data as text
        const edgesTextPromise = fetch(edgesUrl).then((response) =>
          response.text()
        );
        const nodesTextPromise = fetch(nodesUrl).then((response) =>
          response.text()
        );

        const [edgesText, nodesText] = await Promise.all([
          edgesTextPromise,
          nodesTextPromise,
        ]);

        // Parse CSV text directly
        const edges = Papa.parse<Edge>(edgesText, {
          header: true,
          dynamicTyping: true,
        }).data;
        const nodes = Papa.parse<Node>(nodesText, {
          header: true,
          dynamicTyping: true,
        }).data;

        // Update state with parsed data
        setGraphData({ nodes, links: edges });
      } catch (error) {
        console.error("Failed to fetch and process data", error);
      }
    };

    if (analysis?.result) {
      fetchAndProcessData(analysis.result);
    }
  }, [analysis?.result, generateDownloadUrl]);

  if (!analysis) {
    return (
      <div className="w-full h-full">
        <div className="flex items-center justify-center gap-2">
          Loading analytics ...
          <Loader2 className="animate-spin" />
        </div>
      </div>
    );
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
            <FileIcon size={14} />
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
                  <FlaskConical className="h-4 w-4" />
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
            <Tooltip>
              <TooltipTrigger>
                <Badge>
                  <Settings2 className="h-4 w-4 mr-2" />
                  Configs
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex items-center justify-center gap-2 flex-wrap max-w-[400px] h-fit p-2 text-xs">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col gap-2">
                      <div>Correlation Threshold</div>
                      <div className="text-neutral-500">
                        {analysis.config.correlationThreshold}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div>MS2 Similarity Threshold</div>
                      <div className="text-neutral-500">
                        {analysis.config.ms2SimilarityThreshold}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div>Retention Time Window</div>
                      <div className="text-neutral-500">
                        {analysis.config.rtTimeWindow}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div>Signal Enrichment Factor</div>
                      <div className="text-neutral-500">
                        {analysis.config.signalEnrichmentFactor}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div>Minimum Signal Threshold</div>
                      <div className="text-neutral-500">
                        {analysis.config.minSignalThreshold}
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="w-full flex justify-end gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex flex-col items-start justify-center gap-1">
                <div className="flex items-center justify-center gap-24">
                  <div className={cn("flex items-center justify-center gap-2")}>
                    <LucideWorkflow size={16} />
                    {analysis.status === "running" ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={14} />
                        {
                          analysis.progress.find((p) => p.status === "running")
                            ?.step
                        }
                      </div>
                    ) : analysis.status === "failed" ? (
                      <Badge className="flex items-center justify-center gap-2 bg-destructive text-red-50 hover:bg-destructive/80">
                        <XIcon size={12} />
                        Failed
                      </Badge>
                    ) : (
                      <Badge className="flex items-center justify-center gap-2 text-green-50 bg-green-400 hover:opacity-80 hover:bg-green-400">
                        <BadgeCheck size={12} />
                        Completed
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs max-w-[200px]">
                    <TimerIcon size={16} />
                    {
                      new Date(analysis._creationTime)
                        .toString()
                        .split("GMT")[0]
                    }
                  </div>
                </div>
                <div className="text-muted-foreground text-xs">
                  * Hover to view the workflow
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="-left-12">
              <Workflow progress={analysis.progress} log={analysis.log} />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex flex-col gap-2 items-center justify-center w-full h-[50vh]">
        {analysis.status === "running" && <div>{analysis.log}</div>}
        <div className="w-full h-full">
          {analysis.status === "failed" && (
            <div className="flex items-center h-full justify-center gap-2 flex-col">
              <FileWarning size={48} className="stroke-destructive" />
              <span className="text-muted-foreground">
                Some Unknown error happens
              </span>
              <Button
                variant="outline"
                className="mt-8"
                onClick={async () => {
                  const token = await getToken({
                    template: "convex",
                    skipCache: true,
                  });
                  if (!token) {
                    throw new Error("No token found");
                  }

                  retryAnalysis({ id: analysis._id, token });
                }}
              >
                Try again
              </Button>
            </div>
          )}
          {analysis.status === "running" && (
            <div className="flex items-center h-full justify-center gap-2">
              <Loader2 className="animate-spin" />
              <span>Analysis Running</span>
            </div>
          )}
          {analysis.status === "complete" && (
            <MagicCard className="h-[70vh] mt-1">
              <div className="w-full gap-4 items-center justify-end flex p-4">
                {/* drop down for download options */}
                <Select>
                  <SelectTrigger className="flex items-center justify-center gap-2 w-fit">
                    <Download size={16} />
                    Download Data
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="graphml">GraphML</SelectItem>
                    <SelectItem value="raw">Raw (Nodes & Edges)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {graphData.links.length === 0 ? (
                <div className="flex items-center h-[60%] justify-center gap-2">
                  <span>No data to display</span>
                  <span className="text-neutral-400">😞</span>
                </div>
              ) : (
                <ForceGraph2D
                  graphData={graphData}
                  nodeLabel="id"
                  linkDirectionalParticles="value"
                  linkDirectionalParticleWidth={(link) => Math.sqrt(link.value)}
                  linkColor={(link) => correlationToColor(link.correlation)}
                />
              )}
            </MagicCard>
          )}
        </div>
      </div>
    </div>
  );
}
