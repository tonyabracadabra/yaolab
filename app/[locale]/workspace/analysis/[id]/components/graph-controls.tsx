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
  graphData,
  hasDrugSample,
  downloading,
  onDownloadGraphML,
  onDownloadRawData,
}: GraphControlsProps) {
  return (
    <div className="flex absolute right-[3%] top-[5%] items-center justify-center gap-4 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" className="shadow-sm">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-96 z-50"
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
          <div className="grid gap-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
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
              <div className="grid gap-2">
                <Label htmlFor="edgeLabel">Edge</Label>
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
              <div className="grid gap-2">
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

            <div className="grid gap-4">
              {hasDrugSample && (
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">
                      Hide endogenous subgraphs
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      Only show subgraphs that contains at least one prototype
                      compound
                    </span>
                  </div>
                  <Switch
                    checked={hideEndogenousSubgraphs}
                    onCheckedChange={setHideEndogenousSubgraphs}
                  />
                </div>
              )}

              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium">
                    Compound response Mode
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Enable this to see the compound response mode
                  </span>
                </div>
                <Switch
                  checked={ratioModeEnabled}
                  onCheckedChange={setRatioModeEnabled}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium">
                    Highlight Redundant Data
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Highlight edges that have redundant data
                  </span>
                </div>
                <Switch
                  checked={highlightRedundant}
                  onCheckedChange={setHighlightRedundant}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="shadow-sm">
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="flex flex-col items-center justify-center z-50">
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
  );
}
