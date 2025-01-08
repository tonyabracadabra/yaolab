"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SmilesDrawer from "smiles-drawer";

interface SmilesVisualizationProps {
  smiles: string;
  theme?: "light" | "dark";
  width?: number;
  height?: number;
}

export function SmilesVisualization({
  smiles,
  theme = "light",
  width = 300,
  height = 240,
}: SmilesVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  const drawMolecule = useCallback(
    (canvas: HTMLCanvasElement, smilesStr: string) => {
      try {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = theme === "dark" ? "#1a1a1a" : "#ffffff";
        ctx.fillRect(0, 0, width, height);

        if (!smilesStr) {
          ctx.fillStyle = theme === "dark" ? "#666666" : "#999999";
          ctx.font = "14px system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("Enter SMILES structure", width / 2, height / 2);
          return;
        }

        // Initialize drawer if not exists
        if (!drawerRef.current) {
          drawerRef.current = new SmilesDrawer.Drawer({
            width,
            height,
            bondThickness: 1.0,
            bondLength: 15,
            padding: 20,
          });
        }

        const cleanSmiles = smilesStr.trim().toUpperCase();

        SmilesDrawer.parse(
          cleanSmiles,
          (tree) => {
            drawerRef.current.draw(tree, canvas, theme, true);
            setError(null);
          },
          (error) => {
            setError(`Parse error: ${error.message}`);
          }
        );
      } catch (error) {
        setError(`Error: ${String(error)}`);
      }
    },
    [theme, width, height]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawMolecule(canvas, smiles);
  }, [smiles, drawMolecule]);

  return (
    <div
      className="relative w-full h-full"
      style={{ minWidth: width, minHeight: height }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full"
        style={{
          background: theme === "dark" ? "#1a1a1a" : "#ffffff",
        }}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-destructive bg-background/50 backdrop-blur-sm">
          <div className="p-2 text-center">
            <div className="font-medium">SMILES Error</div>
            <div className="text-xs mt-1">{error}</div>
            <div className="text-xs mt-1">Input: {smiles}</div>
          </div>
        </div>
      )}
    </div>
  );
}
