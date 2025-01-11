"use client";

import type { ChartConfig } from "@/components/ui/chart";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

interface MS2SpectrumProps {
  data: Array<[number, number]>;
  className?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      mz: number;
      intensity: number;
    };
  }>;
  label?: string;
}

export function MS2Spectrum({ data, className }: MS2SpectrumProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [threshold, setThreshold] = useState(5); // Show top 95% by default (100 - threshold)

  // Parse raw data
  const rawChartData = data.map((pair) => {
    const [mz, intensity] = pair;
    return {
      mz,
      intensity,
    };
  });

  // Find max intensity and calculate threshold value
  const maxIntensity = Math.max(...rawChartData.map((d) => d.intensity));
  const thresholdValue = maxIntensity * (threshold / 100);

  // Filter and normalize data
  const chartData = rawChartData
    .filter((d) => d.intensity >= thresholdValue) // Filter based on absolute threshold
    .map((d) => ({
      mz: d.mz,
      intensity: (d.intensity / maxIntensity) * 100, // Normalize to percentage
    }))
    .sort((a, b) => a.mz - b.mz);

  // Update chart width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (chartRef.current) {
        setChartWidth(chartRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const chartConfig = {
    intensity: {
      label: "Intensity",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const minBarWidth = 40; // Minimum width per bar
  const calculatedWidth = Math.max(chartData.length * minBarWidth, chartWidth);
  const shouldScroll = calculatedWidth > chartWidth;

  // Calculate optimal tick interval based on data size
  const calculateTickInterval = () => {
    const totalPoints = chartData.length;
    if (totalPoints <= 10) return 0; // Show all ticks for small datasets
    if (shouldScroll) return Math.ceil(totalPoints / 15); // Show ~15 ticks when scrolling
    return "preserveStartEnd"; // Default behavior for non-scrolling
  };

  // Add this custom tooltip content component
  function CustomTooltip({ active, payload }: TooltipProps) {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border/40 shadow-sm rounded-sm px-2 py-1 text-[9px]">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground/90 font-medium">m/z</span>
            <span className="font-medium tabular-nums">
              {data.mz.toFixed(4)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground/90 font-medium">Int.</span>
            <span className="font-medium tabular-nums">
              {data.intensity.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative h-full w-full bg-background pt-4", className)}
      ref={chartRef}
    >
      <div className="absolute -top-2 right-0 z-20">
        <div className="flex items-center gap-3 px-2.5 py-1.5 text-[10px] bg-background/95 backdrop-blur-sm border shadow-sm rounded-md">
          <span className="text-muted-foreground/90 font-medium">
            Threshold
          </span>
          <div className="w-20">
            <Slider
              size="sm"
              value={[threshold]}
              onValueChange={([value]) => setThreshold(value)}
              min={0}
              max={20}
              step={0.1}
              className="relative z-30"
            />
          </div>
          <span className="tabular-nums text-muted-foreground w-6 text-right font-medium">
            {threshold}%
          </span>
        </div>
      </div>

      <div className="h-full pt-4">
        <div className="relative h-full">
          <div className="absolute left-0 top-0 bottom-0 w-[64px] z-10 bg-background/95 backdrop-blur-sm border-r border-border/30">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 0, left: 0, bottom: 20 }}
              >
                <YAxis
                  type="number"
                  domain={[0, 100]}
                  dataKey="intensity"
                  tickLine={false}
                  axisLine={false}
                  fontSize={9}
                  interval="preserveStartEnd"
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(value) => `${value}%`}
                  label={{
                    value: "Relative Intensity",
                    angle: -90,
                    position: "insideLeft",
                    offset: 22,
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                    fontWeight: 500,
                    style: { textAnchor: "middle" },
                  }}
                  width={68}
                  tick={{ fill: "hsl(var(--muted-foreground)/0.8)" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div
            className={cn(
              "h-full ml-[40px]",
              shouldScroll &&
                "overflow-x-auto scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-background hover:scrollbar-thumb-border/70 transition-colors"
            )}
          >
            <div style={{ width: calculatedWidth - 72, height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 25, left: 0, bottom: 20 }}
                  barCategoryGap={1}
                  barGap={0}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--muted-foreground)/0.08)"
                  />
                  <XAxis
                    dataKey="mz"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickLine={false}
                    axisLine={false}
                    fontSize={9}
                    tickFormatter={(value) => value.toFixed(1)}
                    interval={calculateTickInterval()}
                    tick={{ fill: "hsl(var(--muted-foreground)/0.8)" }}
                  />
                  <RechartsTooltip
                    cursor={{
                      fill: "hsl(var(--muted-foreground)/0.08)",
                      radius: 0,
                    }}
                    content={<CustomTooltip />}
                    wrapperStyle={{ outline: "none" }}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="intensity"
                    fill="hsl(var(--primary)/0.85)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={0.5}
                    radius={[1, 1, 0, 0]}
                    minPointSize={2}
                    barSize={2}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="absolute bottom-0 left-[72px] right-0 h-5 flex items-center justify-center text-[10px] font-medium text-muted-foreground/90 bg-background/95 backdrop-blur-sm border-t border-border/30">
            m/z
          </div>
        </div>
      </div>
    </div>
  );
}
