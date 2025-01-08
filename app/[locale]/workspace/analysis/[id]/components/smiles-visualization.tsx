"use client";

import { Input } from "@/components/ui/input";
import { SymbolIcon } from "@radix-ui/react-icons";
import { AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import SmilesDrawer from "smiles-drawer";

export function SmilesVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [smiles, setSmiles] = useState<string>("");

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !smiles) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const size = Math.min(containerWidth - 32, containerHeight - 32);
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawer = new SmilesDrawer.Drawer({
      width: canvas.width,
      height: canvas.height,
      bondThickness: 1,
      fontSizeLarge: 10,
      fontSizeSmall: 8,
      padding: 20,
      scale: 0.9,
    });

    try {
      SmilesDrawer.parse(smiles, function (tree: any) {
        try {
          drawer.draw(tree, canvas, "light");
          setError(null);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to draw structure"
          );
        }
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to parse structure"
      );
    }
  }, [smiles]);

  return (
    <div className="h-full flex flex-col space-y-2">
      <div className="relative">
        <Input
          value={smiles}
          onChange={(e) => setSmiles(e.target.value)}
          placeholder="Enter SMILES string..."
          className="font-mono text-xs h-8 pr-24"
        />
        <div className="absolute right-1 top-1 text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded">
          SMILES Format
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 bg-muted/30 rounded-md"
      >
        {smiles ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <canvas
              ref={canvasRef}
              className="rounded border border-border/50 bg-background shadow-sm"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-background/50">
            <SymbolIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <div className="text-xs text-muted-foreground font-medium">
              No Structure Available
            </div>
            <div className="text-[10px] text-muted-foreground/80 mt-1 text-center max-w-[180px]">
              Enter a SMILES string above to visualize the molecular structure
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm rounded-md">
            <AlertCircle className="h-5 w-5 text-destructive mb-1" />
            <p className="text-xs text-destructive font-medium">
              Invalid Structure
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px] text-center">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
