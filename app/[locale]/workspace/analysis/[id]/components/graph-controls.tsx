import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Download, Loader2, Settings2 } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { kAvailableEdges, kAvailableNodes } from "../constants";
import type { EdgeKey, GraphData, NodeKey, RatioColorScheme } from "../types";

interface GraphControlsProps {
  nodeLabel: NodeKey;
  setNodeLabel: Dispatch<SetStateAction<NodeKey>>;
  edgeLabel: EdgeKey;
  setEdgeLabel: Dispatch<SetStateAction<EdgeKey>>;
  nodeSize: NodeKey;
  setNodeSize: Dispatch<SetStateAction<NodeKey>>;
  hideEndogenousSubgraphs: boolean;
  setHideEndogenousSubgraphs: (value: boolean) => void;
  ratioModeEnabled: boolean;
  setRatioModeEnabled: (value: boolean) => void;
  highlightRedundant: boolean;
  setHighlightRedundant: (value: boolean) => void;
  colorScheme: RatioColorScheme;
  setColorScheme: Dispatch<SetStateAction<RatioColorScheme>>;
  graphData?: GraphData;
  hasDrugSample?: boolean;
  downloading: boolean;
  onDownloadGraphML: () => void;
  onDownloadRawData: () => void;
}

export function GraphControls({
  nodeLabel,
  setNodeLabel,
  edgeLabel,
  setEdgeLabel,
  nodeSize,
  setNodeSize,
  hideEndogenousSubgraphs,
  setHideEndogenousSubgraphs,
  ratioModeEnabled,
  setRatioModeEnabled,
  highlightRedundant,
  setHighlightRedundant,
  colorScheme,
  setColorScheme,
  graphData,
  hasDrugSample,
  downloading,
  onDownloadGraphML,
  onDownloadRawData,
}: GraphControlsProps) {
  return (
    <div className="absolute right-6 top-6 flex items-center gap-2 z-50">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 rounded-full shadow-sm hover:bg-secondary/80"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[580px] z-[9999] p-0 shadow-lg"
            align="end"
            sideOffset={8}
            onInteractOutside={(e) => {
              if (
                e.target instanceof Element &&
                (e.target.closest('[role="combobox"]') ||
                  e.target.closest('[role="listbox"]'))
              ) {
                e.preventDefault();
              }
            }}
          >
            <div className="border-b border-border/50 p-4">
              <div className="space-y-1">
                <h4 className="font-medium">Graph Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Configure visualization options and display preferences
                </p>
              </div>
            </div>

            <div className="p-4 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                  <h5 className="text-sm font-medium">Node & Edge Display</h5>
                </div>
                <div className="grid grid-cols-3 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="nodeLabel"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Node Label
                    </Label>
                    <Select
                      value={nodeLabel}
                      onValueChange={(value: NodeKey) => setNodeLabel(value)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Select node label" />
                      </SelectTrigger>
                      <SelectContent>
                        {kAvailableNodes.map((v) => (
                          <SelectItem
                            key={v.key}
                            value={v.key}
                            className="text-xs"
                          >
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="edgeLabel"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Edge Label
                    </Label>
                    <Select
                      value={edgeLabel}
                      onValueChange={(value: EdgeKey) => setEdgeLabel(value)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Select edge label" />
                      </SelectTrigger>
                      <SelectContent>
                        {kAvailableEdges.map((v) => (
                          <SelectItem
                            key={v.col}
                            value={v.col}
                            className="text-xs"
                          >
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="nodeSize"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Node Size
                    </Label>
                    <Select
                      value={nodeSize}
                      onValueChange={(value: NodeKey) => setNodeSize(value)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Select node size" />
                      </SelectTrigger>
                      <SelectContent>
                        {kAvailableNodes.map((v) => (
                          <SelectItem
                            key={v.col}
                            value={v.key}
                            className="text-xs"
                          >
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                  <h5 className="text-sm font-medium">Display Options</h5>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 pl-6">
                  {hasDrugSample && (
                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Switch
                        checked={hideEndogenousSubgraphs}
                        onCheckedChange={setHideEndogenousSubgraphs}
                        className="mt-0.5 data-[state=checked]:bg-primary"
                      />
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">
                          Hide endogenous subgraphs
                        </Label>
                        <p className="text-[11px] leading-tight text-muted-foreground">
                          Only show subgraphs with prototype compounds
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Switch
                      checked={ratioModeEnabled}
                      onCheckedChange={setRatioModeEnabled}
                      className="mt-0.5 data-[state=checked]:bg-primary"
                    />
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">
                        Compound Response Mode
                      </Label>
                      <p className="text-[11px] leading-tight text-muted-foreground">
                        Enable compound response visualization
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Switch
                      checked={highlightRedundant}
                      onCheckedChange={setHighlightRedundant}
                      className="mt-0.5 data-[state=checked]:bg-primary"
                    />
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">
                        Highlight Redundant Data
                      </Label>
                      <p className="text-[11px] leading-tight text-muted-foreground">
                        Show edges with redundant information
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="secondary"
          size="sm"
          className="h-8 w-8 p-0 rounded-full shadow-sm hover:bg-secondary/80"
          disabled={downloading || !graphData}
          onClick={onDownloadGraphML}
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
