"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AnalysisResultSchema, EdgeSchema, NodeSchema } from "@/convex/schema";
import { cn } from "@/lib/utils";
import { MagicCard } from "@/src/components/magicui/magic-card";
import AnalysisResult from "@/src/components/task-result";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Workflow } from "@/src/components/workflow";
import { useAuth } from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import JSZip from "jszip";
import { ForceGraph2D } from "react-force-graph";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
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
import { useTheme } from "next-themes";
import Link from "next/link";
import Papa from "papaparse";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

type Edge = z.infer<typeof EdgeSchema>;
type Node = z.infer<typeof NodeSchema>;

type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

const kAvailableNodes = [
  {
    key: "mz",
    label: "m/z",
    type: "label",
    col: "mz",
  },
  {
    key: "rt",
    label: "Retention Time",
    type: "label",
    col: "rt",
  },
  {
    key: "ratio",
    label: "Compound Responses Between Sample Groups",
    type: "custom",
  },
];

const kAvailableEdges = [
  {
    col: "mzDiff",
    label: "m/z Difference",
  },
  {
    col: "rtDiff",
    label: "Retention Time Difference",
  },
  {
    col: "matchedMzDiff",
    label: "Matched m/z Difference",
  },
  {
    col: "matchedRtDiff",
    label: "Matched Retention Time Difference",
  },
  {
    col: "matchedFormulaChange",
    label: "Matched Formula Change",
  },
];

export default function Page({ params }: { params: { id: Id<"analyses"> } }) {
  const analysis = useQuery(api.analyses.get, { id: params.id });
  const [nodes, setNodes] = useState<Node[] | undefined>();
  const [edges, setEdges] = useState<Edge[] | undefined>();
  const generateDownloadUrl = useAction(api.actions.generateDownloadUrl);
  const retryAnalysis = useAction(api.actions.retryAnalysis);
  const [nodeType, setNodeType] = useState(kAvailableNodes[0].key);
  const [edgeLabel, setEdgeLabel] = useState(kAvailableEdges[0].col);
  const { theme } = useTheme();
  const fgRef = useRef();
  const { getToken } = useAuth();

  useEffect(() => {
    if (!fgRef.current) return;

    // @ts-ignore
    fgRef.current.d3Force("charge").strength(-50).distanceMax(100);
    // @ts-ignore
    fgRef.current.d3Force("link").distance(40);
  }, [edges, nodes]);

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
        const edgesRaw = Papa.parse<Edge>(edgesText, {
          header: true,
          dynamicTyping: true,
        }).data;

        const nodesRaw = Papa.parse<Node>(nodesText, {
          header: true,
          dynamicTyping: true,
        }).data;

        // remove edges that have missing nodes
        const nodesIds = new Set(nodesRaw.map((n) => n.id));
        const edgesRawFiltered = edgesRaw.filter(
          (e) => nodesIds.has(e.source) && nodesIds.has(e.target)
        );

        // Update state with parsed data
        setNodes(nodesRaw.map((n) => ({ ...n, id: `${n.id}` })));
        setEdges(
          edgesRawFiltered.map((e) => ({
            ...e,
            source: `${e.source}`,
            target: `${e.target}`,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch and process data", error);
      }
    };

    if (analysis?.result) {
      fetchAndProcessData(analysis.result);
    }
  }, [analysis?.result, generateDownloadUrl, setEdges, setNodes]);

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
                : analysis.reactionDb}
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
                <div className="text-neutral-400 gap-4 flex flex-col items-center justify-center py-2">
                  {analysis.config.experiments.map((e, i) => (
                    <div
                      key={i}
                      className="w-full flex-col flex items-start max-w-[400px] gap-2"
                    >
                      <div className="font-bold text-lg">{e.name}</div>
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
                      <div>m/z Error Threshold</div>
                      <div className="text-neutral-500">
                        {analysis.config.mzErrorThreshold}
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
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center justify-center gap-2">
                  <div>
                    <Label>Node</Label>
                    <Select
                      value={nodeType}
                      onValueChange={(value) => {
                        setNodeType(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a node label" />
                      </SelectTrigger>
                      <SelectContent>
                        {kAvailableNodes.map((v, i) => (
                          <SelectItem key={i} value={v.key}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Edge</Label>
                    <Select
                      value={edgeLabel}
                      onValueChange={(value) => setEdgeLabel(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a edge label" />
                      </SelectTrigger>
                      <SelectContent>
                        {kAvailableEdges.map((v, i) => (
                          <SelectItem key={i} value={v.col}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="flex flex-col items-center justify-center">
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        // Download graphml file, given the nodes and edges
                        const graphml = `
                      <graphml>
                        <graph id="G" edgedefault="undirected">
                          ${(nodes || [])
                            .map(
                              (n) =>
                                `<node id="${n.id}"><data key="mz">${n.mz}</data></node>`
                            )
                            .join("\n")}
                          ${(edges || [])
                            .map(
                              (e, i) =>
                                `<edge id="${i}" source="${e.source}" target="${e.target}"><data key="mzDiff">${e.mzDiff}</data></edge>`
                            )
                            .join("\n")}
                        </graph>
                      </graphml>
                      `;

                        const blob = new Blob([graphml], {
                          type: "application/xml",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "graph.graphml";
                        a.click();
                      }}
                    >
                      GraphML
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        // download edges and nodes as two .csv files in a zip
                        const zip = new JSZip();
                        zip.file("nodes.csv", Papa.unparse(nodes || []));
                        zip.file("edges.csv", Papa.unparse(edges || []));
                        zip
                          .generateAsync({ type: "blob" })
                          .then((content: any) => {
                            const url = URL.createObjectURL(content);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "raw-data.zip";
                            a.click();
                          });
                      }}
                    >
                      Raw (Nodes & Edges)
                    </Button>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {edges === undefined && nodes === undefined ? (
                <div className="flex items-center h-[60%] justify-center gap-2">
                  Loading graph now <Loader2 className="animate-spin" />
                </div>
              ) : (
                <div className="w-[65vw] h-[50vh] overflow-hidden">
                  {edges?.length === 0 && nodes?.length === 0 ? (
                    <span>No data to display</span>
                  ) : (
                    <div className="relative">
                      <ForceGraph2D
                        ref={fgRef}
                        graphData={{ links: edges || [], nodes: nodes || [] }}
                        nodeId="id"
                        linkSource="source"
                        linkWidth={8}
                        nodeCanvasObject={(node, ctx, globalScale) => {
                          const curr = kAvailableNodes.find(
                            (n) => n.key === nodeType
                          );
                          if (curr?.type === "label") {
                            // Draw circle
                            ctx.beginPath();
                            const x = node.x as number;
                            const y = node.y as number;

                            ctx.arc(x, y, 8, 0, 2 * Math.PI, false); // Adjust the radius as needed
                            ctx.fillStyle = "white"; // Circle color
                            ctx.fill();
                            ctx.strokeStyle = "#ADD8E6";
                            ctx.lineWidth = 2; // Adjust border width as needed
                            ctx.stroke();

                            // Draw label
                            const label =
                              typeof node[nodeType] === "number"
                                ? node[nodeType].toFixed(2)
                                : String(node[nodeType]);
                            ctx.font = `4px Sans-Serif`;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillStyle = "black"; // Text color
                            ctx.fillText(label, x, y); // Position the label on the circle
                          } else if (curr?.key === "ratio") {
                            const ratioCols = analysis.config.experiments.map(
                              (e) => `${e.name}_ratio`
                            );
                            // based on different ratio, draw a pie chart with different colors
                            const ratio = ratioCols.map((col) => node[col]);
                            const total = ratio.reduce((a, b) => a + b, 0);
                            const startAngle = 0;
                            const endAngle = Math.PI * 2;
                            let lastAngle = startAngle;
                            for (let i = 0; i < ratio.length; i++) {
                              const ratioValue = ratio[i];
                              const angle = (ratioValue / total) * endAngle;
                              ctx.beginPath();
                              // @ts-ignore
                              ctx.moveTo(node.x, node.y);
                              ctx.arc(
                                // @ts-ignore
                                node.x,
                                node.y,
                                8,
                                lastAngle,
                                lastAngle + angle
                              );
                              ctx.fillStyle = `hsl(${
                                (i * 360) / ratio.length
                              }, 100%, 50%)`;
                              ctx.fill();
                              lastAngle += angle;
                            }
                          }
                        }}
                        nodePointerAreaPaint={(node, color, ctx) => {
                          ctx.beginPath();
                          const x = node.x as number;
                          const y = node.y as number;
                          ctx.arc(x, y, 5, 0, 2 * Math.PI, false); // Match the radius used in nodeCanvasObject
                          ctx.fillStyle = color;
                          ctx.fill();
                        }}
                        linkCanvasObject={(link, ctx, globalScale) => {
                          // Draw line
                          ctx.beginPath();
                          ctx.moveTo(
                            // @ts-ignore
                            link.source.x as number,
                            // @ts-ignore
                            link.source.y as number
                          );
                          ctx.lineTo(
                            // @ts-ignore
                            link.target.x as number,
                            // @ts-ignore
                            link.target.y as number
                          );

                          ctx.strokeStyle = theme === "dark" ? "white" : "#000"; // Line color
                          ctx.stroke();

                          // Draw label with precision 2
                          const label =
                            typeof link[edgeLabel] === "number"
                              ? link[edgeLabel].toFixed(2)
                              : String(link[edgeLabel]);
                          ctx.font = `${3}px Sans-Serif`;
                          ctx.textAlign = "center";
                          ctx.textBaseline = "middle";
                          ctx.fillStyle = theme === "dark" ? "white" : "#000"; // Text color

                          // draw label with a realllllly thin and short box as background, just to make it more readable, nothing else!
                          // make sure it won't take any spaces beyond the texts width and height
                          const textWidth = ctx.measureText(label).width;
                          ctx.fillStyle = theme === "dark" ? "black" : "white";
                          ctx.fillRect(
                            // @ts-ignore
                            (link.source.x + link.target.x) / 2 - textWidth / 2,
                            // @ts-ignore
                            (link.source.y + link.target.y) / 2 - 2,
                            textWidth,
                            4
                          );
                          ctx.fillStyle = theme === "dark" ? "white" : "#000";
                          ctx.fillText(
                            label,
                            // @ts-ignore
                            (link.source.x + link.target.x) / 2,
                            // @ts-ignore
                            (link.source.y + link.target.y) / 2
                          );
                        }}
                        linkTarget="target"
                      />
                      {/* legend for ratios */}
                      {nodeType === "ratio" && (
                        <div className="flex items-center justify-center gap-2 w-18 flex-col left-[30px] top-[40px] absolute">
                          {analysis.config.experiments.map((e, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-center gap-2 w-full text-sm"
                            >
                              <div
                                className="w-4 h-4"
                                style={{
                                  backgroundColor: `hsl(${
                                    (i * 360) /
                                    analysis.config.experiments.length
                                  }, 100%, 50%)`,
                                }}
                              />
                              <span>{e.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </MagicCard>
          )}
        </div>
      </div>
    </div>
  );
}
