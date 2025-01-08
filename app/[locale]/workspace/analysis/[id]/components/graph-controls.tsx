import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Download, Loader2, Settings2 } from "lucide-react";
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
    <div className="absolute right-6 top-6 flex items-center gap-2 z-50">
      <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-lg shadow-sm">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <Settings2 className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[580px] z-[9999]"
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
            <div className="space-y-6 p-4">
              <div className="space-y-1.5">
                <h4 className="font-medium text-sm">Graph Visualization</h4>
                <p className="text-xs text-muted-foreground">
                  Configure how nodes and edges are displayed in the graph
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="nodeLabel"
                    className="text-xs text-muted-foreground"
                  >
                    Node Label
                  </Label>
                  <Select
                    value={nodeLabel}
                    onValueChange={(value: NodeKey) => setNodeLabel(value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select a node label" />
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
                    className="text-xs text-muted-foreground"
                  >
                    Edge Label
                  </Label>
                  <Select
                    value={edgeLabel}
                    onValueChange={(value: EdgeKey) => setEdgeLabel(value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select an edge label" />
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
                    className="text-xs text-muted-foreground"
                  >
                    Node Size
                  </Label>
                  <Select
                    value={nodeSize}
                    onValueChange={(value: NodeKey) => setNodeSize(value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select a node size" />
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

              <div className="space-y-1.5">
                <h4 className="font-medium text-sm">Display Options</h4>
                <p className="text-xs text-muted-foreground">
                  Adjust visibility and highlighting options
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {hasDrugSample && (
                  <div className="flex items-start space-x-4">
                    <Switch
                      checked={hideEndogenousSubgraphs}
                      onCheckedChange={setHideEndogenousSubgraphs}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Hide endogenous subgraphs
                      </Label>
                      <p className="text-[11px] text-muted-foreground/80">
                        Only show subgraphs with prototype compounds
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-4">
                  <Switch
                    checked={ratioModeEnabled}
                    onCheckedChange={setRatioModeEnabled}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Compound response Mode
                    </Label>
                    <p className="text-[11px] text-muted-foreground/80">
                      Enable compound response visualization
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Switch
                    checked={highlightRedundant}
                    onCheckedChange={setHighlightRedundant}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Highlight Redundant Data
                    </Label>
                    <p className="text-[11px] text-muted-foreground/80">
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
              className="h-8 w-8 p-0"
              disabled={downloading || !graphData}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="end" sideOffset={8}>
            <DropdownMenuItem
              disabled={!graphData || downloading}
              onClick={onDownloadGraphML}
              className="text-xs"
            >
              Download as GraphML
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!graphData || downloading}
              onClick={onDownloadRawData}
              className="text-xs"
            >
              Download Raw Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
