"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface MS2SpectrumProps {
  data: string; // Format: "mz1:intensity1 mz2:intensity2 ..."
}

export function MS2Spectrum({ data }: MS2SpectrumProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Parse the data string into [mz, intensity] pairs
    const parsedData = data.split(" ").map((pair) => {
      const [mz, intensity] = pair.split(":");
      return [parseFloat(mz), parseFloat(intensity)];
    });

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = svgRef.current.clientHeight - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales with padding
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(parsedData, (d) => d[0]) || 0])
      .range([0, width])
      .nice();

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(parsedData, (d) => d[1]) || 0])
      .range([height, 0])
      .nice();

    // Add axes with improved styling
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("class", "x-axis")
      .call(
        d3
          .axisBottom(xScale)
          .ticks(8)
          .tickFormat((d) => d.toString())
      )
      .append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("fill", "currentColor")
      .attr("font-size", "10px")
      .text("m/z");

    svg
      .append("g")
      .attr("class", "y-axis")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => d.toString())
      )
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -35)
      .attr("x", -height / 2)
      .attr("fill", "currentColor")
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .text("Intensity");

    // Add grid lines
    svg
      .append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yScale.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.1);

    // Add spectrum lines with improved styling
    svg
      .selectAll(".spectrum-line")
      .data(parsedData)
      .enter()
      .append("line")
      .attr("class", "spectrum-line")
      .attr("x1", (d) => xScale(d[0]))
      .attr("x2", (d) => xScale(d[0]))
      .attr("y1", height)
      .attr("y2", (d) => yScale(d[1]))
      .attr("stroke", "hsl(215, 50%, 50%)")
      .attr("stroke-width", 1.5)
      .attr("stroke-linecap", "round");

    // Style axes
    svg.selectAll(".domain").attr("stroke", "currentColor");
    svg.selectAll(".tick line").attr("stroke", "currentColor");
    svg
      .selectAll(".tick text")
      .attr("fill", "currentColor")
      .attr("font-size", "9px");
  }, [data]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      className="overflow-visible text-foreground"
    />
  );
}
