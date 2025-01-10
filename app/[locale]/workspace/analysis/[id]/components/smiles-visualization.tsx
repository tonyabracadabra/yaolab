"use client";

import { Input } from "@/components/ui/input";
import { Atom } from "lucide-react";
import { useState } from "react";
import { MoleculeStructure } from "./molecular-structure";

export function SmilesVisualization() {
  const [smiles, setSmiles] = useState<string>("");

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto p-6">
      <div className="w-full space-y-6">
        <div className="relative w-full">
          <Input
            value={smiles}
            onChange={(e) => setSmiles(e.target.value)}
            placeholder="Enter SMILES string..."
            className="font-mono text-xs h-9 pr-24 w-full bg-background/60 backdrop-blur-sm"
          />
          <div className="absolute right-1.5 top-1.5 text-[10px] text-muted-foreground bg-muted/80 px-2 py-1 rounded-md">
            SMILES Format
          </div>
        </div>

        <div className="relative aspect-[4/3] w-full bg-muted/20 rounded-xl overflow-hidden backdrop-blur-sm">
          {smiles ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <MoleculeStructure
                id="smiles-visualization"
                structure={smiles}
                width={400}
                height={300}
                className="w-full h-full max-w-[400px] max-h-[300px] mx-auto"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div className="p-4 rounded-full bg-muted/30">
                <Atom className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div className="text-sm text-muted-foreground font-medium mt-4">
                No Structure Available
              </div>
              <div className="text-xs text-muted-foreground/80 mt-2 text-center max-w-[220px]">
                Enter a SMILES string above to visualize the molecular structure
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
