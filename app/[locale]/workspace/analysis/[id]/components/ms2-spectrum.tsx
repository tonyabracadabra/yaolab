"use client";

import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

interface MS2SpectrumProps {
  data: string;
  className?: string;
}

export function MS2Spectrum({ data, className }: MS2SpectrumProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [threshold, setThreshold] = useState(5); // Show top 95% by default (100 - threshold)

  // Parse raw data
  const rawChartData = data.split(" ").map((pair) => {
    const [mz, intensity] = pair.split(":");
    return {
      mz: parseFloat(mz),
      intensity: parseFloat(intensity),
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

  return (
    <div className={cn("relative h-full w-full", className)} ref={chartRef}>
      <div className="absolute -top-3 right-0 z-10">
        <div className="flex items-center gap-2 px-2.5 py-1.5 text-[10px] bg-background/20 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm">
          <span className="text-muted-foreground font-medium">Threshold</span>
          <div className="w-14">
            <Slider
              size="sm"
              value={[threshold]}
              onValueChange={([value]) => setThreshold(value)}
              min={0}
              max={10}
              step={0.1}
            />
          </div>
          <span className="tabular-nums font-medium w-6 text-right">
            {threshold}%
          </span>
        </div>
      </div>
      <div className="h-full pt-2">
        <div
          className={cn(
            "h-full flex items-end",
            shouldScroll &&
              "overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
          )}
        >
          <ChartContainer config={chartConfig} className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 25, left: 50, bottom: 20 }}
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
                  fontSize={10}
                  tickFormatter={(value) => value.toFixed(1)}
                  interval={calculateTickInterval()}
                  label={{
                    value: "m/z",
                    position: "bottom",
                    offset: 8,
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                />
                <YAxis
                  type="number"
                  domain={[0, 100]}
                  dataKey="intensity"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  interval="preserveStartEnd"
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(value) => `${value}%`}
                  label={{
                    value: "Intensity",
                    angle: -90,
                    position: "left",
                    offset: 32,
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  width={45}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelKey="mz"
                      nameKey="intensity"
                      hideLabel={false}
                      className="bg-background/95 backdrop-blur-sm border shadow-sm"
                    />
                  }
                />
                <Bar
                  dataKey="intensity"
                  fill="hsl(var(--primary))"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1}
                  radius={0}
                  minPointSize={2}
                  barSize={3}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
