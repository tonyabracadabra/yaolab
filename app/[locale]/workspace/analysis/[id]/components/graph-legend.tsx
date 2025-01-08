import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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
    <div className="flex flex-col gap-4 absolute left-[3%] top-[5%] items-start z-[10000]">
      <div className="flex items-start justify-start gap-2 w-full text-sm">
        <div
          className="w-4 h-4"
          style={{
            backgroundColor: "white",
            border: "2px solid yellow",
          }}
        />
        <span>Prototype</span>
      </div>
      {highlightRedundant && (
        <div className="flex items-center justify-start gap-2">
          <div className="w-4 h-[2px] bg-red-500" />
          <span>Redundant</span>
        </div>
      )}
      {ratioModeEnabled && ratioColColors && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-start gap-2 w-18 flex-col">
            {ratioColColors.map((col, i) => (
              <div key={i} className="flex items-center justify-start gap-2">
                <div
                  className="w-4 h-4"
                  style={{
                    backgroundColor: col.color,
                  }}
                />
                <span>{col.col}</span>
              </div>
            ))}
          </div>
          <Select value={colorScheme} onValueChange={setColorScheme}>
            <SelectTrigger>
              <div className="w-4 h-4 rounded-full rainbow-conic-gradient" />
              {colorSchemes.find((c) => c.value === colorScheme)?.label ||
                "Color Scheme"}
            </SelectTrigger>
            <SelectContent>
              {colorSchemes.map((scheme) => (
                <SelectItem key={scheme.value} value={scheme.value}>
                  {scheme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
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
