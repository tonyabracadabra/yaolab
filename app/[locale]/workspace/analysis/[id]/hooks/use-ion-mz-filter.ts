import { useCallback, useState } from "react";
import { toast } from "sonner";
import { GraphData } from "../types";

export interface IonMzFilter {
  mz: number;
  tolerance: number;
  intensity: number;
}

export function useIonMzFilter(
  graphData: GraphData | undefined,
  onGraphDataChange: (data: GraphData) => void,
  onReset: () => void
) {
  const [activeFilter, setActiveFilter] = useState<IonMzFilter | undefined>();

  const applyFilter = useCallback(
    (filter: IonMzFilter) => {
      if (!graphData) {
        toast.error("No graph data available");
        return;
      }

      try {
        const filteredNodes = graphData.nodes.filter((node) => {
          const topIntensitySpectra = node.msmsSpectrum
            .sort(
              ([_, intensityA], [__, intensityB]) => intensityB - intensityA
            )
            .slice(
              0,
              Math.ceil(node.msmsSpectrum.length * (filter.intensity / 100))
            );

          return topIntensitySpectra.some(
            ([mz, _]) => Math.abs(mz - filter.mz) <= filter.tolerance
          );
        });

        const filteredEdges = graphData.edges.filter((edge) => {
          const sourceNode = filteredNodes.find((node) => node.id === edge.id1);
          const targetNode = filteredNodes.find((node) => node.id === edge.id2);
          return sourceNode && targetNode;
        });

        const filteredData = {
          nodes: filteredNodes,
          edges: filteredEdges,
        };

        onGraphDataChange(filteredData);
        setActiveFilter(filter);
        toast.success("Ion filter applied successfully");
      } catch (error) {
        console.error("Error applying ion filter:", error);
        toast.error("Failed to apply filter");
      }
    },
    [graphData, onGraphDataChange]
  );

  const clearFilter = useCallback(() => {
    try {
      setActiveFilter(undefined);
      onReset();
      toast.success("Ion filter cleared");
    } catch (error) {
      console.error("Error clearing ion filter:", error);
      toast.error("Failed to clear filter");
    }
  }, [onReset]);

  return {
    activeFilter,
    applyFilter,
    clearFilter,
  };
}
