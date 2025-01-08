import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Download, Loader2, SlidersHorizontal } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import type { EdgeKey, GraphData, NodeKey, RatioColorScheme } from "../types";

export const kAvailableNodes = [
  { key: "mz", label: "m/z", col: "mz" },
  { key: "rt", label: "Retention Time", col: "rt" },
] as const;

export const kAvailableEdges = [
  { col: "mzDiff", label: "m/z Difference" },
  { col: "rtDiff", label: "Retention Time Difference" },
  { col: "matchedMzDiff", label: "Matched m/z Difference" },
  { col: "matchedFormulaChange", label: "Matched Formula Change" },
  { col: "matchedDescription", label: "Matched Reaction Description" },
  { col: "correlation", label: "Sample Correlation" },
  { col: "modCos", label: "Modified Cosine Similarity" },
] as const;

export const colorSchemes = [
  { label: "Accent", value: "accent" },
  { label: "Tableau", value: "tableau" },
  { label: "Purple", value: "purple" },
  { label: "Green", value: "green" },
  { label: "Orange", value: "orange" },
  { label: "Classic", value: "classic" },
  { label: "Rainbow", value: "rainbow" },
] as const;

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
    <div className="absolute right-6 top-6 flex items-center gap-3 z-50">
      <div className="flex items-center gap-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg p-2 shadow-lg border border-border">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 shadow-sm hover:bg-accent"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[600px] z-[60]"
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
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nodeLabel">Node Label</Label>
                  <Select
                    value={nodeLabel}
                    onValueChange={(value: NodeKey) => setNodeLabel(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a node label" />
                    </SelectTrigger>
                    <SelectContent>
                      {kAvailableNodes.map((v) => (
                        <SelectItem key={v.key} value={v.key}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edgeLabel">Edge Label</Label>
                  <Select
                    value={edgeLabel}
                    onValueChange={(value: EdgeKey) => setEdgeLabel(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an edge label" />
                    </SelectTrigger>
                    <SelectContent>
                      {kAvailableEdges.map((v) => (
                        <SelectItem key={v.col} value={v.col}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nodeSize">Node Size</Label>
                  <Select
                    value={nodeSize}
                    onValueChange={(value: NodeKey) => setNodeSize(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a node size" />
                    </SelectTrigger>
                    <SelectContent>
                      {kAvailableNodes.map((v) => (
                        <SelectItem key={v.col} value={v.key}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {hasDrugSample && (
                  <div className="flex items-start gap-4">
                    <Switch
                      checked={hideEndogenousSubgraphs}
                      onCheckedChange={setHideEndogenousSubgraphs}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <Label className="text-sm">
                        Hide endogenous subgraphs
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Only show subgraphs with prototype compounds
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <Switch
                    checked={ratioModeEnabled}
                    onCheckedChange={setRatioModeEnabled}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label className="text-sm">Compound response Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable compound response visualization
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Switch
                    checked={highlightRedundant}
                    onCheckedChange={setHighlightRedundant}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label className="text-sm">Highlight Redundant Data</Label>
                    <p className="text-xs text-muted-foreground">
                      Show edges with redundant information
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 shadow-sm hover:bg-accent"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="z-[60]" align="end" sideOffset={8}>
            <Button
              variant="ghost"
              className="w-full justify-start"
              disabled={!graphData || downloading}
              onClick={onDownloadGraphML}
            >
              GraphML
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              disabled={!graphData || downloading}
              onClick={onDownloadRawData}
            >
              Raw (Nodes & Edges)
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
