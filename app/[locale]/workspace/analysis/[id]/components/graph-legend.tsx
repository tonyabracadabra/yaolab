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

// Define color scheme presets with their preview colors
export const colorSchemes = [
  {
    label: "Accent",
    value: "accent",
    preview: ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b"],
  },
  {
    label: "Tableau",
    value: "tableau",
    preview: ["#4e79a7", "#f28e2c", "#e15759", "#76b7b2"],
  },
  {
    label: "Purple",
    value: "purple",
    preview: ["#c084fc", "#a855f7", "#9333ea", "#7e22ce"],
  },
  {
    label: "Green",
    value: "green",
    preview: ["#22c55e", "#16a34a", "#15803d", "#166534"],
  },
  {
    label: "Orange",
    value: "orange",
    preview: ["#f97316", "#ea580c", "#c2410c", "#9a3412"],
  },
  {
    label: "Classic",
    value: "classic",
    preview: ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6"],
  },
  {
    label: "Rainbow",
    value: "rainbow",
    preview: ["#ef4444", "#f59e0b", "#22c55e", "#06b6d4"],
  },
] as const;

export type ColorScheme = (typeof colorSchemes)[number]["value"];

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
                  <SelectContent align="start" className="w-[180px]">
                    {colorSchemes.map((scheme) => (
                      <SelectItem
                        key={scheme.value}
                        value={scheme.value}
                        className="text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex gap-0.5">
                            {scheme.preview.map((color, i) => (
                              <div
                                key={i}
                                className="w-2 h-2 rounded-sm"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <span>{scheme.label}</span>
                        </div>
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
