"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AnalysisResultSchema } from "@/convex/schema";
import { Edge, GraphData, Node, cn, generateGraphML } from "@/lib/utils";
import AnalysisResult from "@/src/components/analysis-result/task-result";
import { Workflow } from "@/src/components/analysis-result/workflow";
import { MagicCard } from "@/src/components/magicui/magic-card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { useAuth } from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import * as d3 from "d3-scale-chromatic";
import JSZip from "jszip";
import { ForceGraph2D } from "react-force-graph";

import { HelperTooltip } from "@/src/components/help-tooltip";
import { Switch } from "@/src/components/switch";
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
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

const kAvailableNodes = [
  {
    key: "mz",
    label: "m/z",
    col: "mz",
  },
  {
    key: "rt",
    label: "Retention Time",
    col: "rt",
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
    col: "matchedFormulaChange",
    label: "Matched Formula Change",
  },
  {
    col: "matchedDescription",
    label: "Matched Reaction Description",
  },
  {
    col: "correlation",
    label: "Sample Correlation",
  },
  {
    col: "modCos",
    label: "Modified Cosine Similarity",
  },
];

const colorSchemes = [
  {
    label: "Accent",
    value: "accent",
  },
  {
    label: "Tableau",
    value: "tableau",
  },
  {
    label: "Purple",
    value: "purple",
  },
  {
    label: "Green",
    value: "green",
  },
  {
    label: "Orange",
    value: "orange",
  },
  {
    label: "Classic",
    value: "classic",
  },
  {
    label: "Rainbow",
    value: "rainbow",
  },
];

export default function Page({ params }: { params: { id: Id<"analyses"> } }) {
  const analysis = useQuery(api.analyses.get, { id: params.id });
  const [oriGraphData, setOriGraphData] = useState<GraphData | undefined>();
  const [graphData, setGraphData] = useState<GraphData | undefined>();
  const generateDownloadUrl = useAction(api.actions.generateDownloadUrl);
  const retryAnalysis = useAction(api.actions.retryAnalysis);
  const [nodeLabel, setNodeLabel] = useState(kAvailableNodes[0].col);
  const [edgeLabel, setEdgeLabel] = useState(kAvailableEdges[0].col);
  const [nodeSize, setNodeSize] = useState(kAvailableNodes[1].col);
  const [ratioModeEnabled, setRatioModeEnabled] = useState(false);
  const [highlightRedundant, setHighlightRedundant] = useState(false);
  const [hideEndogenousSubgraphs, setHideEndogenousSubgraphs] = useState(true);
  const { theme } = useTheme();
  const fgRef = useRef();
  const { getToken } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [colorScheme, setColorScheme] = useState("schemeOrRd");

  useEffect(() => {
    if (!fgRef.current) return;

    // @ts-ignore
    fgRef.current.d3Force("charge").strength(-50).distanceMax(50);
    // @ts-ignore
    fgRef.current.d3Force("link").distance(20);
  }, [oriGraphData]);

  const connectedComponents: string[][] = useMemo(() => {
    if (!oriGraphData) return [];

    // hide all the non connected subgraphs that contains at least one prototype compound
    const nodes = oriGraphData.nodes;
    const edges = oriGraphData.edges;
    const connectedComponents = [];
    const visited = new Set();
    const adjList = new Map();
    for (const node of nodes) {
      adjList.set(node.id, []);
    }
    for (const edge of edges) {
      if (edge.id1 === undefined || edge.id2 === undefined) {
        console.error("Edge id is missing", edge);
        continue;
      }
      adjList.get(edge.id1).push(edge.id2);
      adjList.get(edge.id2).push(edge.id1);
    }
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        const connectedComponent = [];
        if (node.id === undefined) {
          console.error("Node id is missing", node);
        } else {
          const queue: string[] = [node.id as string];
          while (queue.length > 0) {
            const curr = queue.shift() as string;
            if (!visited.has(curr)) {
              visited.add(curr);
              connectedComponent.push(curr);
              for (const neighbor of adjList.get(curr)) {
                queue.push(neighbor as string);
              }
            }
          }
          connectedComponents.push(connectedComponent);
        }
      }
    }

    return connectedComponents;
  }, [oriGraphData]);

  const graphsWithPrototype = useMemo(() => {
    if (!oriGraphData) return;

    // loop through all the connected components in connectedComponents and check if there is any prototype compound
    // then compile the rest of the connected components to a new graph with edges and nodes

    const newNodes = [];
    const newEdges = [];
    for (const connectedComponent of connectedComponents) {
      const subgraphNodes = oriGraphData.nodes.filter((node) =>
        connectedComponent.includes(node.id)
      );

      const prototypeNode = subgraphNodes.find((node) => node.isPrototype);
      if (prototypeNode) {
        newNodes.push(...subgraphNodes);
        const subgraphEdges = oriGraphData.edges.filter(
          (edge) =>
            connectedComponent.includes(edge.id1) &&
            connectedComponent.includes(edge.id2)
        );
        newEdges.push(...subgraphEdges);
      }
    }

    return {
      nodes: newNodes,
      edges: newEdges,
    };
  }, [oriGraphData]);

  const nodeIdtoSizes = useMemo(() => {
    // normalize the node size based on the nodeSize column
    if (!graphData) return;
    const nodeSizeCol = nodeSize;
    const nodeSizes = graphData.nodes
      .map((node) => node[nodeSizeCol as "mz" | "rt"])
      .filter((size) => size !== undefined) as number[];

    const minSize = Math.min(...nodeSizes);
    const maxSize = Math.max(...nodeSizes);
    // return a map not list
    const res = new Map();
    for (let i = 0; i < graphData.nodes.length; i++) {
      // set to the normalized size based on min and max
      const normalized =
        (graphData.nodes[i][nodeSizeCol as "rt" | "mz"] - minSize) /
        (maxSize - minSize);
      res.set(graphData.nodes[i].id, normalized * 10 + 5);
    }
    return res;
  }, [graphData, nodeSize]);

  const ratioColColors: { col: string; color: string }[] | undefined =
    useMemo(() => {
      if (!analysis) return;
      const ratioCols = analysis.config.bioSamples.map(
        (e) => `${e.name}_ratio`
      );
      if (analysis.config.drugSample) {
        ratioCols.push(`${analysis.config.drugSample.name}_ratio`);
      }

      let colors = d3.schemeAccent;
      if (colorScheme === "tableau") {
        colors = d3.schemeTableau10;
      } else if (colorScheme === "purple") {
        colors = ratioCols.map((_, i) =>
          d3.interpolatePurples((1 * i) / ratioCols.length)
        );
      } else if (colorScheme === "green") {
        colors = ratioCols.map((_, i) =>
          d3.interpolateGreens((1 * i) / ratioCols.length)
        );
      } else if (colorScheme === "orange") {
        colors = ratioCols.map((_, i) =>
          d3.interpolateOranges((1 * i) / ratioCols.length)
        );
      } else if (colorScheme === "classic") {
        colors = d3.schemeCategory10;
      } else if (colorScheme === "rainbow") {
        colors = ratioCols.map((_, i) =>
          d3.interpolateRainbow((1 * i) / ratioCols.length)
        );
      }

      return ratioCols.map((col, i) => {
        return {
          col,
          color: colors[i % colors.length],
        };
      });
    }, [analysis, colorScheme]);

  useEffect(() => {
    if (oriGraphData) {
      if (hideEndogenousSubgraphs) {
        setGraphData(graphsWithPrototype);
      } else {
        setGraphData(oriGraphData);
      }
    }
  }, [
    setGraphData,
    hideEndogenousSubgraphs,
    oriGraphData,
    graphData,
    setOriGraphData,
  ]);

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

        const parseConfig = {
          header: true,
          dynamicTyping: true,
          transform: function (value: string, field: string): any {
            if (value.toLowerCase() === "true") {
              return true;
            } else if (value.toLowerCase() === "false") {
              return false;
            }
            return value;
          },
        };

        // Parse CSV text directly
        const edgesRaw = Papa.parse<Edge>(edgesText, parseConfig).data;
        const nodesRaw = Papa.parse<Node>(nodesText, parseConfig).data;

        // remove edges that have missing nodes
        const nodesIds = new Set(nodesRaw.map((n) => n.id));
        const edgesRawFiltered = edgesRaw.filter(
          (e) => nodesIds.has(e.id1) && nodesIds.has(e.id2)
        );

        setOriGraphData({
          nodes: nodesRaw.map((n) => ({ ...n, id: `${n.id}` })),
          edges: edgesRawFiltered.map((e) => ({
            ...e,
            id1: `${e.id1}`,
            id2: `${e.id2}`,
          })),
        });
      } catch (error) {
        console.error("Failed to fetch and process data", error);
      }
    };

    if (analysis?.result) {
      fetchAndProcessData(analysis.result);
    }
  }, [analysis?.result, generateDownloadUrl, setGraphData]);

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
      <div className="flex items-center justify-between gap-4 w-full">
        <Link href="/dashboard/analysis">
          <Button
            size="sm"
            variant="secondary"
            className="flex w-fit min-w-[150px] items-center justify-center gap-2 flex-nowrap"
          >
            <List size={16} />
            All analyses
          </Button>
        </Link>
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
                Experiments
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="flex items-start justify-between gap-4 p-2">
                <div className="flex flex-col gap-2">
                  <div>Bio Samples</div>
                  <div className="text-neutral-400 gap-4 flex flex-col items-center justify-center py-2">
                    {analysis.config.bioSamples.map((e, i) => (
                      <div
                        key={i}
                        className="w-full flex-col flex items-start max-w-[400px] gap-2"
                      >
                        <div className="font-bold text-lg">{e.name}</div>
                        <div className="flex items-center justify-center gap-4">
                          <div className="flex flex-col gap-2">
                            <div>Blank Groups</div>
                            <div className="text-neutral-500 gap-2 flex items-center justify-center">
                              {e.blank.map((g, j) => (
                                <Badge key={j}>{g}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div>Sample Groups</div>
                            <div className="text-neutral-500 gap-2 flex items-center justify-center">
                              {e.sample.map((g, j) => (
                                <Badge key={j}>{g}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {analysis.config.drugSample && (
                  <div className="flex flex-col gap-2">
                    <div>Drug Sample</div>
                    <div className="text-neutral-400 flex flex-col gap-2">
                      <div className="font-bold text-lg">
                        {analysis.config.drugSample.name}
                      </div>
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col gap-2">
                          <div>Drug Groups</div>
                          <div className="text-neutral-500 gap-2 flex items-center justify-center">
                            {analysis.config.drugSample.groups.map((g, j) => (
                              <Badge key={j}>{g}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
        <div className="w-full flex justify-end gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex flex-col items-start justify-center gap-1">
                  <div className="flex items-center justify-center gap-24">
                    <div
                      className={cn("flex items-center justify-center gap-2")}
                    >
                      <LucideWorkflow size={16} />
                      {analysis.status === "running" ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin" size={14} />
                          {
                            analysis.progress.find(
                              (p) => p.status === "running"
                            )?.step
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
      </div>
      <div className="flex flex-col gap-2 items-center justify-center w-full h-full">
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
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4 w-full p-4 bg-primary-foreground rounded-lg">
                <div className="flex items-start justify-center gap-4">
                  <div className="flex flex-col gap-4 items-start">
                    <Label>Node</Label>
                    <Select
                      value={nodeLabel}
                      onValueChange={(value) => {
                        setNodeLabel(value);
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
                  <div className="flex flex-col gap-4 items-start">
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
                  {/* node size */}
                  <div className="flex flex-col gap-4 items-start">
                    <Label>Node Size</Label>
                    <Select
                      value={nodeSize}
                      onValueChange={(value) => setNodeSize(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a node column" />
                      </SelectTrigger>
                      <SelectContent>
                        {kAvailableNodes.map((v, i) => (
                          <SelectItem key={i} value={v.col}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {analysis.config.drugSample && (
                    <div className="flex flex-col gap-6 items-start">
                      <div className="flex items-center justify-center gap-2">
                        <Label>Hide endogenous subgraphs</Label>
                        <HelperTooltip text="Only show subgraphs that contains at least one prototype compound" />
                      </div>
                      <Switch
                        checked={hideEndogenousSubgraphs}
                        onCheckedChange={setHideEndogenousSubgraphs}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-6 items-start ml-2">
                    <div className="flex items-center justify-center gap-2">
                      <Label>Compound response Mode</Label>
                      <HelperTooltip text="Enable this to see the compound response mode" />
                    </div>
                    <Switch
                      checked={ratioModeEnabled}
                      onCheckedChange={(value) => setRatioModeEnabled(value)}
                    />
                  </div>
                  <div className="flex flex-col gap-6 items-start">
                    <div className="flex items-center justify-center gap-2">
                      <Label>Highlight Redundant Data</Label>
                      <HelperTooltip text="Highlight edges that have redundant data" />
                    </div>
                    <Switch
                      checked={highlightRedundant}
                      onCheckedChange={setHighlightRedundant}
                    />
                  </div>
                </div>
              </div>
              <MagicCard className="h-[68vh] relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute right-12 top-12"
                    >
                      {downloading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="flex flex-col items-center justify-center">
                    <Button
                      variant="ghost"
                      className="w-full"
                      disabled={!graphData || downloading}
                      onClick={() => {
                        if (!graphData) return;
                        setDownloading(true);

                        const graphMLString = generateGraphML(graphData);
                        const blob = new Blob([graphMLString], {
                          type: "application/xml",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "graph.graphml";
                        a.click();

                        setDownloading(false);
                      }}
                    >
                      GraphML
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      disabled={!graphData || downloading}
                      onClick={() => {
                        if (!graphData) return;
                        setDownloading(true);

                        // download edges and nodes as two .csv files in a zip
                        const zip = new JSZip();
                        zip.file(
                          "nodes.csv",
                          Papa.unparse<Node>(graphData.nodes || [])
                        );
                        zip.file(
                          "edges.csv",
                          Papa.unparse<Edge>(graphData.edges || [])
                        );
                        zip
                          .generateAsync({ type: "blob" })
                          .then((content: any) => {
                            const url = URL.createObjectURL(content);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "raw-data.zip";
                            a.click();
                          });

                        setDownloading(false);
                      }}
                    >
                      Raw (Nodes & Edges)
                    </Button>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex flex-col gap-4 absolute left-12 top-12 items-start z-[10000]">
                  {/* legend for prototype */}
                  <div className="flex items-start justify-start gap-2 w-full text-sm">
                    <div
                      className="w-4 h-4"
                      style={{
                        backgroundColor: "white",
                        border: "2px solid yellow",
                      }}
                    />
                    <span>Prototype</span>
                  </div>
                  {/* legend for redundant */}
                  {highlightRedundant && (
                    <div className="flex items-center justify-start gap-2">
                      {/* a thin red line */}
                      <div className="w-4 h-[2px] bg-red-500" />
                      <span>Redundant</span>
                    </div>
                  )}
                  {/* legend for ratios */}
                  {ratioModeEnabled && ratioColColors && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-start gap-2 w-18 flex-col">
                        {ratioColColors.map((col, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-start gap-2"
                          >
                            <div
                              className="w-4 h-4"
                              style={{
                                backgroundColor: col.color,
                              }}
                            />
                            <span>{col.col}</span>
                          </div>
                        ))}
                      </div>
                      {/* button that randomly swaps the color theme */}
                      <Select
                        value={colorScheme}
                        onValueChange={(v) => setColorScheme(v)}
                      >
                        <SelectTrigger>
                          <div className="w-4 h-4 rounded-full rainbow-conic-gradient" />
                          {colorSchemes.find((c) => c.value === colorScheme)
                            ?.label || "Color Scheme"}
                        </SelectTrigger>
                        <SelectContent>
                          {colorSchemes.map((scheme, i) => (
                            <SelectItem
                              key={i}
                              value={scheme.value}
                              onClick={() => setColorScheme(scheme.value)}
                            >
                              {scheme.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                {graphData === undefined ? (
                  <div className="flex items-center h-[60%] justify-center gap-2">
                    Loading graph now <Loader2 className="animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-hidden w-[75vw] h-[65vh]">
                    {graphData.edges?.length === 0 &&
                    graphData.nodes?.length === 0 ? (
                      <span>No data to display</span>
                    ) : (
                      <ForceGraph2D
                        ref={fgRef}
                        graphData={{
                          links: graphData?.edges || [],
                          nodes: graphData?.nodes || [],
                        }}
                        // click to smoothly zoom in the subgraph associated with that node
                        onNodeClick={(node) => {
                          if (!fgRef.current) return;
                          // @ts-ignore
                          fgRef.current.zoomToFit(1000, 100, (n) =>
                            connectedComponents
                              .find((cc) => cc.includes(node.id))
                              ?.includes(n.id)
                          );
                        }}
                        nodeId="id"
                        linkSource="id1"
                        linkTarget="id2"
                        linkWidth={8}
                        nodeCanvasObject={(node, ctx, globalScale) => {
                          if (!nodeIdtoSizes || !ratioColColors) return;

                          const size = nodeIdtoSizes?.get(node.id as any) || 8;
                          const ratio = ratioColColors?.map(
                            (v) => node[v.col] || 0
                          ) as number[];
                          if (ratioModeEnabled) {
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
                                size,
                                lastAngle,
                                lastAngle + angle
                              );
                              ctx.fillStyle = ratioColColors[i].color;
                              ctx.fill();
                              lastAngle += angle;
                            }
                          }

                          const curr = kAvailableNodes.find(
                            (n) => n.key === nodeLabel
                          );

                          // Draw circle
                          ctx.beginPath();
                          const x = node.x as number;
                          const y = node.y as number;

                          ctx.arc(x, y, size, 0, 2 * Math.PI, false); // Adjust the radius as needed

                          if (!ratioModeEnabled) {
                            ctx.fillStyle = "white"; // Circle color
                            ctx.strokeStyle = "#ADD8E6";
                            ctx.fill();
                            ctx.lineWidth = 2; // Adjust border width as needed
                            ctx.stroke();
                          }

                          if (node.isPrototype) {
                            ctx.strokeStyle = "yellow";
                            ctx.stroke();
                          }

                          // Draw label
                          const label =
                            typeof node[nodeLabel] === "number"
                              ? node[nodeLabel].toFixed(2)
                              : String(node[nodeLabel]);
                          ctx.font = `4px Sans-Serif`;
                          ctx.textAlign = "center";
                          ctx.textBaseline = "middle";
                          ctx.fillStyle = "black"; // Text color
                          ctx.fillText(label, x, y); // Position the label on the circle
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
                          if (!link.source || !link.target) return;

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
                          if (highlightRedundant && link.redundantData) {
                            ctx.strokeStyle = "red";
                          }

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
                      />
                    )}
                  </div>
                )}
              </MagicCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
