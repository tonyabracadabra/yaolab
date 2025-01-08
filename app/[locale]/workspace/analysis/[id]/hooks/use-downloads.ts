import { useState } from "react";
import { toast } from "sonner";
import type { GraphData } from "../types";
import { downloadGraphML, generateGraphML } from "../utils/generate-graph-ml";

export function useDownloads() {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadGraphML = async (graphData: GraphData) => {
    try {
      setDownloading(true);
      const graphML = generateGraphML(graphData);
      downloadGraphML(graphML, "graph-export.graphml");
      toast.success("GraphML file downloaded successfully");
    } catch (error) {
      console.error("Error downloading GraphML:", error);
      toast.error("Failed to download GraphML file");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadRawData = async (graphData: GraphData) => {
    try {
      setDownloading(true);
      const jsonString = JSON.stringify(graphData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "graph-data.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Raw data downloaded successfully");
    } catch (error) {
      console.error("Error downloading raw data:", error);
      toast.error("Failed to download raw data");
    } finally {
      setDownloading(false);
    }
  };

  return {
    downloading,
    handleDownloadGraphML,
    handleDownloadRawData,
  };
}
