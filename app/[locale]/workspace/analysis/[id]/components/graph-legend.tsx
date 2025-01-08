import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Palette } from "lucide-react";
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
      <div className="flex flex-col gap-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg p-3 shadow-lg ring-1 ring-border/50">
        {/* Legend Title */}
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <span className="text-xs font-medium text-muted-foreground">
            Legend
          </span>
        </div>

        {/* Legend Items */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-sm bg-white ring-2 ring-yellow-400" />
            <span className="text-xs">Prototype</span>
          </div>

          {highlightRedundant && (
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-0.5 bg-red-500 rounded-full" />
              <span className="text-xs">Redundant</span>
            </div>
          )}
        </div>

        {/* Ratio Colors Section */}
        {ratioModeEnabled && ratioColColors && (
          <div className="flex flex-col gap-2.5 pt-2 border-t border-border/50">
            <div className="flex flex-col gap-2">
              {ratioColColors.map((col, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div
                    className="w-3.5 h-3.5 rounded-sm"
                    style={{
                      backgroundColor: col.color,
                    }}
                  />
                  <span className="text-xs">{col.col}</span>
                </div>
              ))}
            </div>

            {/* Color Scheme Selector */}
            <div className="pt-2 border-t border-border/50">
              <Select value={colorScheme} onValueChange={setColorScheme}>
                <SelectTrigger className="h-8 text-xs">
                  <div className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" />
                    {colorSchemes.find((c) => c.value === colorScheme)?.label ||
                      "Color Scheme"}
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
