"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { FileWarning, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { AnalysisHeader } from "./components/analysis-header";
import { AnalysisStatus } from "./components/analysis-status";
import { GraphControls } from "./components/graph-controls";
import { GraphLegend } from "./components/graph-legend";
import { useDownloads } from "./hooks/use-downloads";
import { useGraphData } from "./hooks/use-graph-data";
import { useGraphState } from "./hooks/use-graph-state";
import { useNodeSizes } from "./hooks/use-node-sizes";
import { useRatioColors } from "./hooks/use-ratio-colors";
import { useRetryAnalysis } from "./hooks/use-retry-analysis";

// Dynamically import heavy visualization component
const GraphVisualization = dynamic(
  () =>
    import("./components/graph-visualization").then(
      (mod) => mod.GraphVisualization
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface LoadingStateProps {
  message: string;
}

function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center gap-2 p-4">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-muted-foreground">{message}</span>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center h-full justify-center gap-2 flex-col p-8">
      <FileWarning size={48} className="stroke-destructive" />
      <span className="text-muted-foreground">
        An error occurred while processing the analysis
      </span>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export default function Page({ params }: { params: { id: Id<"analyses"> } }) {
  const analysis = useQuery(api.analyses.get, { id: params.id });
  const handleRetry = useRetryAnalysis(params.id);

  const {
    oriGraphData,
    graphData,
    setGraphData,
    graphsWithPrototype,
    connectedComponents,
    error: graphError,
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

  // Memoize graph data update handler
  const handleGraphDataUpdate = useCallback(() => {
    if (!oriGraphData) return;

    try {
      setGraphData(
        hideEndogenousSubgraphs ? graphsWithPrototype : oriGraphData
      );
    } catch (error) {
      console.error("Error updating graph data:", error);
      toast.error("Failed to update graph visualization");
    }
  }, [
    hideEndogenousSubgraphs,
    oriGraphData,
    graphsWithPrototype,
    setGraphData,
  ]);

  useEffect(() => {
    handleGraphDataUpdate();
  }, [handleGraphDataUpdate]);

  // Memoize download handlers
  const downloadHandlers = useMemo(
    () => ({
      onDownloadGraphML: () => graphData && handleDownloadGraphML(graphData),
      onDownloadRawData: () => graphData && handleDownloadRawData(graphData),
    }),
    [graphData, handleDownloadGraphML, handleDownloadRawData]
  );

  if (!analysis) {
    return <LoadingState message="Loading analysis..." />;
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-2 w-full min-h-screen">
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

      <div className="flex-1 flex flex-col gap-2 w-full">
        {analysis.status === "running" && (
          <LoadingState message="Analysis in progress..." />
        )}

        {analysis.status === "failed" && <ErrorState onRetry={handleRetry} />}

        {analysis.status === "complete" && (
          <Card className="relative w-full h-full overflow-hidden min-h-[70vh]">
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
              {...downloadHandlers}
            />

            <GraphLegend
              highlightRedundant={highlightRedundant}
              ratioModeEnabled={ratioModeEnabled}
              ratioColColors={ratioColColors}
              colorScheme={colorScheme}
              setColorScheme={setColorScheme}
            />

            {graphError ? (
              <ErrorState onRetry={handleGraphDataUpdate} />
            ) : !graphData ? (
              <LoadingState message="Preparing visualization..." />
            ) : graphData.edges.length === 0 && graphData.nodes.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-muted-foreground">
                  No data to display
                </span>
              </div>
            ) : (
              <Suspense fallback={<LoadingState message="Loading graph..." />}>
                <GraphVisualization
                  graphData={graphData}
                  nodeLabel={nodeLabel}
                  edgeLabel={edgeLabel}
                  nodeIdtoSizes={nodeIdtoSizes ?? new Map()}
                  ratioModeEnabled={ratioModeEnabled}
                  ratioColColors={ratioColColors}
                  highlightRedundant={highlightRedundant}
                  connectedComponents={connectedComponents}
                />
              </Suspense>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
