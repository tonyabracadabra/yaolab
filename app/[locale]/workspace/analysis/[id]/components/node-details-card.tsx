import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cross2Icon } from "@radix-ui/react-icons";
import { ForceGraphNode } from "../types";
import { MS2Spectrum } from "./ms2-spectrum";
import { SmilesVisualization } from "./smiles-visualization";

interface NodeDetailsCardProps {
  node: ForceGraphNode;
  onClose: () => void;
}

const formatValue = (value: unknown): string => {
  if (typeof value === "number") return value.toFixed(4);
  if (value === null || value === undefined) return "-";
  return String(value);
};

export function NodeDetailsCard({ node, onClose }: NodeDetailsCardProps) {
  const priorityFields = ["mz", "rt", "intensity", "formula"];

  const priorityInfo = Object.entries(node)
    .filter(([key]) => priorityFields.includes(key))
    .sort(
      (a, b) => priorityFields.indexOf(a[0]) - priorityFields.indexOf(b[0])
    );

  return (
    <Card className="absolute bottom-4 left-4 p-3 w-[680px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
      <div className="flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Node {node.id}</h3>
              <div className="flex gap-2">
                {priorityInfo.map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-muted px-2 py-0.5 rounded text-[10px] flex items-center gap-1"
                  >
                    <span className="text-muted-foreground capitalize">
                      {key}:
                    </span>
                    <span className="font-medium">
                      {typeof value === "number"
                        ? value.toFixed(2)
                        : formatValue(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 -mr-2"
            onClick={onClose}
          >
            <Cross2Icon className="h-3 w-3" />
          </Button>
        </div>

        {/* Visualizations */}
        <div className="flex gap-3 mt-1">
          <div className="flex-1 min-w-[320px]">
            <h4 className="text-xs font-medium mb-1.5">Structure</h4>
            <div className="bg-muted/30 rounded-lg p-2 h-[260px]">
              <SmilesVisualization />
            </div>
          </div>

          <div className="flex-1 min-w-[320px]">
            <h4 className="text-xs font-medium mb-1.5">MS2 Spectrum</h4>
            <div className="bg-muted/30 rounded-lg p-2 h-[260px]">
              {node["MS/MS spectrum"] ? (
                <MS2Spectrum data={node["MS/MS spectrum"]} />
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  No MS2 data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
