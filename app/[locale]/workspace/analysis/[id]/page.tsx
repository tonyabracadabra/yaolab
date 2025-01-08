"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { FileWarning, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { AnalysisHeader } from "./components/analysis-header";
import { AnalysisStatus } from "./components/analysis-status";
import { GraphControls } from "./components/graph-controls";
import { GraphLegend } from "./components/graph-legend";
import { GraphVisualization } from "./components/graph-visualization";
import { useDownloads } from "./hooks/use-downloads";
import { useGraphData } from "./hooks/use-graph-data";
import { useGraphState } from "./hooks/use-graph-state";
import { useNodeSizes } from "./hooks/use-node-sizes";
import { useRatioColors } from "./hooks/use-ratio-colors";
import { useRetryAnalysis } from "./hooks/use-retry-analysis";

export default function Page({ params }: { params: { id: Id<"analyses"> } }) {
  const analysis = useQuery(api.analyses.get, { id: params.id });
  const handleRetry = useRetryAnalysis(params.id);
  const fgRef = useRef<any>();

  const {
    oriGraphData,
    graphData,
    setGraphData,
    graphsWithPrototype,
    connectedComponents,
  } = useGraphData(analysis?.result);

  const {
    nodeLabel,
    setNodeLabel,
    edgeLabel,
    setEdgeLabel,
    nodeSize,
    setNodeSize,
    ratioModeEnabled,
    setRatioModeEnabled,
    highlightRedundant,
    setHighlightRedundant,
    hideEndogenousSubgraphs,
    setHideEndogenousSubgraphs,
    colorScheme,
    setColorScheme,
  } = useGraphState(graphsWithPrototype);

  const nodeIdtoSizes = useNodeSizes(graphData, nodeSize);
  const ratioColColors = useRatioColors(analysis?.config, colorScheme);
  const { downloading, handleDownloadGraphML, handleDownloadRawData } =
    useDownloads();

  useEffect(() => {
    if (oriGraphData) {
      setGraphData(
        hideEndogenousSubgraphs ? graphsWithPrototype : oriGraphData
      );
    }
  }, [
    hideEndogenousSubgraphs,
    oriGraphData,
    graphsWithPrototype,
    setGraphData,
  ]);

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
      <AnalysisHeader
        rawFileName={analysis.rawFile?.name}
        reactionDb={analysis.reactionDb}
        config={analysis.config}
      />

      <AnalysisStatus
        status={analysis.status}
        progress={analysis.progress}
        log={analysis.log}
        creationTime={analysis._creationTime}
      />

      <div className="flex flex-col gap-2 items-center justify-center w-full h-full">
        {analysis.status === "running" && <div>{analysis.log}</div>}
        <div className="w-full h-full">
          {analysis.status === "failed" && (
            <div className="flex items-center h-full justify-center gap-2 flex-col">
              <FileWarning size={48} className="stroke-destructive" />
              <span className="text-muted-foreground">
                An unknown error occurred
              </span>
              <Button variant="outline" className="mt-8" onClick={handleRetry}>
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
            <Card className="relative w-full h-full overflow-hidden">
              <GraphControls
                nodeLabel={nodeLabel}
                setNodeLabel={setNodeLabel}
                edgeLabel={edgeLabel}
                setEdgeLabel={setEdgeLabel}
                nodeSize={nodeSize}
                setNodeSize={setNodeSize}
                hideEndogenousSubgraphs={hideEndogenousSubgraphs}
                setHideEndogenousSubgraphs={setHideEndogenousSubgraphs}
                ratioModeEnabled={ratioModeEnabled}
                setRatioModeEnabled={setRatioModeEnabled}
                highlightRedundant={highlightRedundant}
                setHighlightRedundant={setHighlightRedundant}
                colorScheme={colorScheme}
                setColorScheme={setColorScheme}
                graphData={graphData}
                hasDrugSample={!!analysis.config.drugSample}
                downloading={downloading}
                onDownloadGraphML={() =>
                  graphData && handleDownloadGraphML(graphData)
                }
                onDownloadRawData={() =>
                  graphData && handleDownloadRawData(graphData)
                }
              />

              <GraphLegend
                highlightRedundant={highlightRedundant}
                ratioModeEnabled={ratioModeEnabled}
                ratioColColors={ratioColColors}
                colorScheme={colorScheme}
                setColorScheme={setColorScheme}
              />

              {graphData === undefined ? (
                <div className="flex items-center h-[60%] justify-center gap-2">
                  Loading graph now <Loader2 className="animate-spin" />
                </div>
              ) : graphData.edges?.length === 0 &&
                graphData.nodes?.length === 0 ? (
                <span>No data to display</span>
              ) : (
                <GraphVisualization
                  graphData={graphData}
                  nodeLabel={nodeLabel}
                  edgeLabel={edgeLabel}
                  nodeIdtoSizes={nodeIdtoSizes ?? new Map()}
                  ratioModeEnabled={ratioModeEnabled}
                  ratioColColors={ratioColColors}
                  highlightRedundant={highlightRedundant}
                  onNodeClick={(nodeId) => {
                    if (!fgRef.current) return;
                    fgRef.current.zoomToFit(1000, 100, (n: { id: string }) =>
                      connectedComponents
                        .find((cc) => cc.includes(nodeId))
                        ?.includes(n.id)
                    );
                  }}
                />
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
