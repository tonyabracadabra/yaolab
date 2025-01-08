"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface MS2SpectrumProps {
  data: Array<[number, number]>; // [m/z, intensity] pairs
}

export function MS2Spectrum({ data }: MS2SpectrumProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = svgRef.current.clientHeight - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[0]) || 0])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[1]) || 0])
      .range([height, 0]);

    // Add axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("fill", "currentColor")
      .text("m/z");

    svg
      .append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -30)
      .attr("x", -height / 2)
      .attr("fill", "currentColor")
      .attr("text-anchor", "middle")
      .text("Intensity");

    // Add spectrum lines
    svg
      .selectAll("line")
      .data(data)
      .enter()
      .append("line")
      .attr("x1", (d) => xScale(d[0]))
      .attr("x2", (d) => xScale(d[0]))
      .attr("y1", height)
      .attr("y2", (d) => yScale(d[1]))
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1);
  }, [data]);

  return (
    <svg ref={svgRef} width="100%" height="100%" className="overflow-visible" />
  );
}
