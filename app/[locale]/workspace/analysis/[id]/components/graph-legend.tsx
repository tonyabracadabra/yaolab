import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { CircleDot, GitCommit, Palette } from "lucide-react";
import type { RatioColorScheme } from "../types";

interface GraphLegendProps {
  highlightRedundant: boolean;
  ratioModeEnabled: boolean;
  ratioColColors?: { col: string; color: string }[];
  colorScheme: RatioColorScheme;
  setColorScheme: (value: RatioColorScheme) => void;
}

export function GraphLegend({
  highlightRedundant,
  ratioModeEnabled,
  ratioColColors,
  colorScheme,
  setColorScheme,
}: GraphLegendProps) {
  return (
    <div className="absolute left-6 top-6 z-50">
      <div className="flex flex-col gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg p-2.5 shadow-lg ring-1 ring-border/50">
        {/* Basic Legend Items */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-5 h-5">
              <CircleDot className="w-4 h-4 text-yellow-500" />
            </div>
            <span className="text-xs text-muted-foreground">
              Prototype Node
            </span>
          </div>

          {highlightRedundant && (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-5 h-5">
                <GitCommit className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-xs text-muted-foreground">
                Redundant Edge
              </span>
            </div>
          )}
        </div>

        {/* Ratio Colors Section */}
        {ratioModeEnabled && ratioColColors && (
          <>
            <div className="h-px bg-border/50 mx-1" />

            <div className="space-y-2">
              {/* Ratio Color Indicators */}
              <div className="grid gap-1.5">
                {ratioColColors.map((col, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="w-5 h-5 p-0"
                      style={{ backgroundColor: col.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {col.col}
                    </span>
                  </div>
                ))}
              </div>

              {/* Color Scheme Selector */}
              <div className="pt-1">
                <Select value={colorScheme} onValueChange={setColorScheme}>
                  <SelectTrigger className="h-7 text-xs border-border/50 bg-background/50">
                    <div className="flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {colorSchemes.find((c) => c.value === colorScheme)
                          ?.label || "Color Scheme"}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {colorSchemes.map((scheme) => (
                      <SelectItem
                        key={scheme.value}
                        value={scheme.value}
                        className="text-xs"
                      >
                        {scheme.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const colorSchemes = [
  { label: "Accent", value: "accent" },
  { label: "Tableau", value: "tableau" },
  { label: "Purple", value: "purple" },
  { label: "Green", value: "green" },
  { label: "Orange", value: "orange" },
  { label: "Classic", value: "classic" },
  { label: "Rainbow", value: "rainbow" },
] as const;

export type ColorScheme = (typeof colorSchemes)[number]["value"];
