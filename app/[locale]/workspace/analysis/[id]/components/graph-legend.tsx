import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EyeOff } from "lucide-react"; // Added EyeOff icon
import { colorSchemes } from "../constants";
import type { RatioColorScheme } from "../types";

interface GraphLegendProps {
  ionMzFilterValues:
    | {
        mz: number;
        tolerance: number;
        intensity: number;
      }
    | undefined;
  highlightRedundant: boolean;
  ratioModeEnabled: boolean;
  ratioColColors?: { col: string; color: string }[];
  colorScheme: RatioColorScheme;
  setColorScheme: (value: RatioColorScheme) => void;
}

export function GraphLegend({
  ionMzFilterValues,
  highlightRedundant,
  ratioModeEnabled,
  ratioColColors,
  colorScheme,
  setColorScheme,
}: GraphLegendProps) {
  return (
    <div className="absolute left-4 top-4 z-[20]">
      <div className="flex flex-col gap-3 p-3 bg-background/95 backdrop-blur-sm border rounded-lg shadow-sm">
        <div className="flex flex-col gap-2">
          {/* Basic Legend Items */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 border-2 border-yellow-400 bg-background rounded-sm" />
              <span className="text-muted-foreground">Prototype</span>
            </div>
            {highlightRedundant && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-0.5 bg-destructive rounded-full" />
                <span className="text-muted-foreground">Redundant</span>
              </div>
            )}
            {ionMzFilterValues && (
              <div className="flex items-center gap-2 text-xs">
                <EyeOff className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Filtered: m/z {ionMzFilterValues.mz.toFixed(4)} ±{" "}
                  {ionMzFilterValues.tolerance.toFixed(2)} Da
                  {ionMzFilterValues.intensity > 0 && (
                    <>, Int ≥ {ionMzFilterValues.intensity.toLocaleString()}</>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Ratio Colors */}
          {ratioModeEnabled && ratioColColors && (
            <div className="space-y-2">
              <div className="h-px bg-border/50" /> {/* Separator */}
              {/* Color Items */}
              <div className="space-y-1.5">
                {ratioColColors.map((col, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: col.color }}
                    />
                    <span className="text-muted-foreground font-mono">
                      {col.col}
                    </span>
                  </div>
                ))}
              </div>
              {/* Color Scheme Selector */}
              <div className="pt-1">
                <Select value={colorScheme} onValueChange={setColorScheme}>
                  <SelectTrigger className="h-7 w-[120px] text-xs">
                    <div className="flex items-center gap-1.5">
                      <SelectValue placeholder="Color Scheme" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {colorSchemes.map((scheme) => (
                      <SelectItem
                        key={scheme.value}
                        value={scheme.value}
                        className="text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn("w-2 h-2 rounded-full", {
                              "bg-gradient-to-r from-blue-500 to-red-500":
                                scheme.value === "rainbow",
                              "bg-[#7fc97f]": scheme.value === "accent",
                              "bg-[#4e79a7]": scheme.value === "tableau",
                              "bg-purple-500": scheme.value === "purple",
                              "bg-green-500": scheme.value === "green",
                              "bg-orange-500": scheme.value === "orange",
                              "bg-blue-500": scheme.value === "classic",
                            })}
                          />
                          {scheme.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
