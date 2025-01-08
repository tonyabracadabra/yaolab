import * as d3 from "d3-scale-chromatic";
import { useMemo } from "react";
import type { AnalysisConfigResponse, RatioColorScheme } from "../types";

export function useRatioColors(
  config: AnalysisConfigResponse | undefined,
  colorScheme: RatioColorScheme
) {
  return useMemo(() => {
    if (!config) return;

    const ratioCols = config.bioSamples.map((e) => `${e.name}_ratio`);
    if (config.drugSample) {
      ratioCols.push(`${config.drugSample.name}_ratio`);
    }

    let colors: readonly string[] | string[];
    switch (colorScheme) {
      case "tableau":
        colors = [...d3.schemeTableau10];
        break;
      case "purple":
        colors = ratioCols.map((_, i) =>
          d3.interpolatePurples((1 * i) / ratioCols.length)
        );
        break;
      case "green":
        colors = ratioCols.map((_, i) =>
          d3.interpolateGreens((1 * i) / ratioCols.length)
        );
        break;
      case "orange":
        colors = ratioCols.map((_, i) =>
          d3.interpolateOranges((1 * i) / ratioCols.length)
        );
        break;
      case "classic":
        colors = [...d3.schemeCategory10];
        break;
      case "rainbow":
        colors = ratioCols.map((_, i) =>
          d3.interpolateRainbow((1 * i) / ratioCols.length)
        );
        break;
      default:
        colors = [...d3.schemeAccent];
    }

    return ratioCols.map((col, i) => ({
      col,
      color: colors[i % colors.length],
    }));
  }, [config, colorScheme]);
}
