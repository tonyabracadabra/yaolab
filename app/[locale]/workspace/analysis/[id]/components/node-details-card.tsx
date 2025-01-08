import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import SmilesDrawer from "smiles-drawer";
import { toast } from "sonner";
import type { ForceGraphNode } from "../types";
import { MS2Spectrum } from "./ms2-spectrum";

interface NodeDetailsCardProps {
  node: ForceGraphNode;
  onClose: () => void;
  onSmilesUpdate: (nodeId: string, smiles: string) => void;
  theme?: string;
}

export function NodeDetailsCard({
  node,
  onClose,
  onSmilesUpdate,
  theme = "light",
}: NodeDetailsCardProps) {
  const [smiles, setSmiles] = useState("");
  const smilesCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setSmiles(node.smiles || "");
  }, [node]);

  useEffect(() => {
    if (!smiles || !smilesCanvasRef.current) return;

    console.log("Attempting to draw SMILES:", smiles);

    const canvas = smilesCanvasRef.current;
    canvas.width = 600;
    canvas.height = 300;

    const drawer = new SmilesDrawer.Drawer({
      width: 600,
      height: 300,
      bondThickness: 1.2,
      fontSizeLarge: 10,
      fontSizeSmall: 8,
      padding: 20,
      atomVisualization: "default",
      isometric: false,
      explicitHydrogens: false,
    });

    const renderMolecule = () => {
      try {
        const testSmiles = "CC";
        console.log("Testing with simple SMILES first:", testSmiles);

        SmilesDrawer.parse(
          testSmiles,
          (tree) => {
            console.log("Test SMILES parsed successfully");
            SmilesDrawer.parse(
              smiles,
              (tree) => {
                console.log("Actual SMILES parsed, attempting to draw");
                drawer.draw(tree, canvas, theme === "dark" ? "dark" : "light");
                console.log("Drawing completed");
              },
              (error) => {
                console.error("Parse error for actual SMILES:", error);
                console.log("Invalid SMILES string:", smiles);
                toast.error("Invalid SMILES structure");
              }
            );
          },
          (error) => {
            console.error("Even test SMILES failed:", error);
            toast.error("SMILES drawer initialization failed");
          }
        );
      } catch (error) {
        console.error("General error:", error);
        console.log("Current SMILES:", smiles);
        console.log("Canvas state:", canvas.width, canvas.height);
        toast.error("Failed to process SMILES");
      }
    };

    requestAnimationFrame(renderMolecule);

    return () => {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [smiles, theme]);

  const handleSmilesSubmit = () => {
    onSmilesUpdate(node.id, smiles);
    toast.success("SMILES structure updated successfully");
  };

  return (
    <Card className="absolute bottom-4 right-4 p-6 w-[450px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg border-border/50">
      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Node Details</h3>
            <p className="text-sm text-muted-foreground">ID: {node.id}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Retention Time</Label>
            <Input
              value={node.retentionTime?.toFixed(2) || "N/A"}
              readOnly
              className="bg-muted font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">m/z</Label>
            <Input
              value={node.mz?.toFixed(4) || "N/A"}
              readOnly
              className="bg-muted font-mono"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">SMILES Structure</Label>
            <div className="flex gap-2">
              <Input
                value={smiles}
                onChange={(e) => setSmiles(e.target.value)}
                placeholder="Enter SMILES structure..."
                className="font-mono text-sm"
              />
              <Button onClick={handleSmilesSubmit}>Update</Button>
            </div>
          </div>
          {smiles && (
            <div className="rounded-lg border bg-card p-3">
              <canvas
                ref={smilesCanvasRef}
                style={{
                  width: "100%",
                  height: "180px",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          )}
        </div>

        {node.ms2Spectrum && node.ms2Spectrum.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">MS2 Spectrum</Label>
            <div className="h-[250px] rounded-lg border bg-card p-4">
              <MS2Spectrum data={node.ms2Spectrum} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
