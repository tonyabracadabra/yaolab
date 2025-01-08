import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { SmilesVisualization } from "./smiles-visualization";

interface NodeDetailsCardProps {
  nodeId: string;
  ms2Data?: any;
  basicInfo?: Record<string, string | number>;
  onClose?: () => void;
}

export function NodeDetailsCard({
  nodeId,
  ms2Data,
  basicInfo,
  onClose,
}: NodeDetailsCardProps) {
  return (
    <Card className="absolute bottom-4 left-4 p-3 w-[680px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center border-b pb-2">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold">Node Details: {nodeId}</h3>
            <div className="flex gap-3">
              {basicInfo &&
                Object.entries(basicInfo)
                  .slice(0, 3) // Show first 3 important properties
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span className="text-xs font-medium">{value}</span>
                    </div>
                  ))}
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-1"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {basicInfo && Object.entries(basicInfo).length > 3 && (
          <div className="grid grid-cols-3 gap-3 px-1 pb-2 border-b">
            {Object.entries(basicInfo)
              .slice(3) // Skip first 3 that are already shown
              .map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <Label className="text-[10px] text-muted-foreground capitalize">
                    {key.replace(/_/g, " ")}
                  </Label>
                  <span className="text-xs font-medium">{value}</span>
                </div>
              ))}
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1 min-w-[320px]">
            <h4 className="text-xs font-medium mb-1.5">Structure</h4>
            <div className="bg-muted/30 rounded-lg p-2 h-[260px]">
              <SmilesVisualization />
            </div>
          </div>

          <div className="flex-1 min-w-[320px]">
            <h4 className="text-xs font-medium mb-1.5">MS2 Spectrum</h4>
            <div className="bg-muted/30 rounded-lg p-2 h-[260px]">
              {ms2Data ? (
                <div>MS2 Graph Placeholder</div>
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
