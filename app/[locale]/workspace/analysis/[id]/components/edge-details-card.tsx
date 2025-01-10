"use client";

import { queryMetabolicReactions } from "@/actions/metabolic-reactions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Download, FileDown, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ForceGraphEdge } from "../types";

interface EdgeDetailsCardProps {
  edge: ForceGraphEdge;
  onClose: () => void;
}

const MIN_TOLERANCE = 0.001;
const MAX_TOLERANCE = 0.1;
const DEFAULT_TOLERANCE = 0.01;

const formatValue = (value: unknown): string => {
  if (typeof value === "number") return value.toFixed(4);
  if (value === null || value === undefined) return "-";
  return String(value);
};

export function EdgeDetailsCard({ edge, onClose }: EdgeDetailsCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [tolerance, setTolerance] = useState(DEFAULT_TOLERANCE);
  const [metabolicData, setMetabolicData] = useState<{
    enzymes: string[];
    pathways: string[];
    mzToReactions: {
      [key: string]: {
        enzymes: string[];
        pathways: string[];
      };
    };
  } | null>(null);

  useEffect(() => {
    const fetchMetabolicData = async () => {
      try {
        if (typeof edge.mzDiff === "number") {
          const data = await queryMetabolicReactions(edge.mzDiff, tolerance);
          setMetabolicData(data);
        }
      } catch (error) {
        toast.error("Failed to load metabolic data");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetabolicData();
  }, [edge.mzDiff, tolerance]);

  const filteredData = useMemo(() => {
    if (!metabolicData || typeof edge.mzDiff !== "number") return null;

    const matchingReactions = Object.entries(metabolicData.mzToReactions)
      .filter(
        ([mzDiff]) =>
          Math.abs(Number(mzDiff) - Number(edge.mzDiff)) <= tolerance
      )
      .map(([_, data]) => data)
      .reduce(
        (acc, curr) => ({
          enzymes: [...new Set([...acc.enzymes, ...curr.enzymes])],
          pathways: [...new Set([...acc.pathways, ...curr.pathways])],
        }),
        { enzymes: [] as string[], pathways: [] as string[] }
      );

    return matchingReactions;
  }, [edge.mzDiff, metabolicData, tolerance]) as {
    enzymes: string[];
    pathways: string[];
  } | null;

  useEffect(() => {
    if (!isLoading && filteredData) {
      if (
        filteredData.enzymes.length === 0 &&
        filteredData.pathways.length === 0
      ) {
        toast.info("No matching metabolic reactions found");
      }
    }
  }, [isLoading, filteredData]);

  const priorityFields = ["mz", "score", "intensity"];
  const priorityInfo = Object.entries(edge)
    .filter(([key]) => priorityFields.includes(key))
    .sort(
      (a, b) => priorityFields.indexOf(a[0]) - priorityFields.indexOf(b[0])
    );

  const handleDownloadKeggPairs = () => {
    const link = document.createElement("a");
    link.href = "/files/KEGG-pairs-enzyme-pathway-new.xlsx";
    link.download = "KEGG-pairs-enzyme-pathway-new.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFilteredData = () => {
    if (!filteredData || typeof edge.mzDiff !== "number") return;

    const csvContent = [
      "Type,Value",
      ...filteredData.enzymes.map((enzyme) => `Enzyme,${enzyme}`),
      ...filteredData.pathways.map((pathway) => `Pathway,${pathway}`),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `filtered-kegg-data-${edge.mzDiff.toFixed(4)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="absolute left-4 bottom-4 p-4 w-[680px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
      <div className="flex flex-col gap-3 max-h-[calc(100vh-6rem)]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Edge Details</h3>
              <div className="flex flex-wrap gap-1.5">
                {priorityInfo.map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-muted/50 px-2 py-0.5 rounded text-[10px] flex items-center gap-1"
                  >
                    <span className="text-muted-foreground capitalize">
                      {key}:
                    </span>
                    <span className="font-medium">{formatValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <Cross2Icon className="h-3 w-3" />
          </Button>
        </div>

        {/* Tolerance Control */}
        <div className="w-full">
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] bg-background/20 backdrop-blur-sm border border-border/50 rounded-md">
            <span className="text-muted-foreground">Tolerance</span>
            <div className="w-12">
              <Slider
                size="sm"
                value={[tolerance]}
                onValueChange={([value]) => setTolerance(value)}
                min={MIN_TOLERANCE}
                max={MAX_TOLERANCE}
                step={0.001}
              />
            </div>
            <span className="tabular-nums text-muted-foreground/80 w-12 text-right">
              ±{tolerance.toFixed(3)} Da
            </span>
          </div>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-2 gap-4">
          {/* Enzymes */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium">Enzymes</h4>
              {filteredData?.enzymes.length ||
                (0 > 0 && (
                  <div className="text-[10px] text-muted-foreground bg-muted/80 px-2 py-1 rounded-md">
                    {filteredData?.enzymes.length || 0} found
                  </div>
                ))}
            </div>
            <div className="bg-muted/20 rounded-lg h-[250px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : !filteredData?.enzymes.length ? (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  No enzymes found
                </div>
              ) : (
                <ScrollArea className="h-full p-3">
                  <div className="space-y-1">
                    {filteredData.enzymes.map((enzyme, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-default px-2 py-1.5 rounded-md hover:bg-muted"
                      >
                        {enzyme}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          {/* Pathways */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium">Pathways</h4>
              {filteredData?.pathways.length ||
                (0 > 0 && (
                  <div className="text-[10px] text-muted-foreground bg-muted/80 px-2 py-1 rounded-md">
                    {filteredData?.pathways.length || 0} found
                  </div>
                ))}
            </div>
            <div className="bg-muted/20 rounded-lg h-[250px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : !filteredData?.pathways.length ? (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  No pathways found
                </div>
              ) : (
                <ScrollArea className="h-full p-3">
                  <div className="space-y-1">
                    {filteredData.pathways.map((pathway, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-default px-2 py-1.5 rounded-md hover:bg-muted"
                      >
                        {pathway}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleDownloadFilteredData}
            className="h-8 text-xs gap-1.5 flex-1"
            disabled={
              !filteredData ||
              (filteredData.enzymes.length === 0 &&
                filteredData.pathways.length === 0)
            }
          >
            <FileDown className="h-3.5 w-3.5" />
            Download Results
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadKeggPairs}
            className="h-8 text-xs gap-1.5 flex-1"
          >
            <Download className="h-3.5 w-3.5" />
            Download All KEGG Data
          </Button>
        </div>
      </div>
    </Card>
  );
}
