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
import { useIonMzFilter } from "./hooks/use-ion-mz-filter";
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
    <div className="flex items-center justify-center flex-1 gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-muted-foreground">{message}</span>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center flex-1 gap-2 flex-col">
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
    highlightIsf,
    setHighlightIsf,
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

  const { activeFilter, applyFilter, clearFilter } = useIonMzFilter(
    graphData,
    setGraphData,
    handleGraphDataUpdate
  );

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
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <LoadingState message="Loading analysis..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-[calc(100vh-4rem)]">
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

      {analysis.status === "running" && (
        <Card className="flex-1 flex items-center justify-center">
          <LoadingState message="Analysis in progress..." />
        </Card>
      )}

      {analysis.status === "failed" && (
        <Card className="flex-1 flex items-center justify-center">
          <ErrorState onRetry={handleRetry} />
        </Card>
      )}

      {analysis.status === "complete" && (
        <Card className="flex-1 relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
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
            activeFilter={activeFilter}
            onFilterApply={applyFilter}
            onFilterClear={clearFilter}
            highlightIsf={highlightIsf}
            setHighlightIsf={setHighlightIsf}
          />
          <GraphLegend
            highlightRedundant={highlightRedundant}
            ratioModeEnabled={ratioModeEnabled}
            ratioColColors={ratioColColors}
            ionMzFilterValues={activeFilter}
            colorScheme={colorScheme}
            setColorScheme={setColorScheme}
            highlightIsf={highlightIsf}
          />
          {graphError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <ErrorState onRetry={handleGraphDataUpdate} />
            </div>
          ) : !graphData ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingState message="Preparing visualization..." />
            </div>
          ) : graphData.edges.length === 0 && graphData.nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <FileWarning className="h-8 w-8 text-muted-foreground" />
                <span className="text-muted-foreground">
                  No data to display
                </span>
              </div>
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="absolute inset-0 flex items-center justify-center">
                  <LoadingState message="Loading graph..." />
                </div>
              }
            >
              <GraphVisualization
                graphData={graphData}
                nodeLabel={nodeLabel}
                edgeLabel={edgeLabel}
                nodeIdtoSizes={nodeIdtoSizes ?? new Map()}
                ratioModeEnabled={ratioModeEnabled}
                ratioColColors={ratioColColors}
                highlightRedundant={highlightRedundant}
                connectedComponents={connectedComponents}
                highlightIsf={highlightIsf}
              />
            </Suspense>
          )}
        </Card>
      )}
    </div>
  );
}
