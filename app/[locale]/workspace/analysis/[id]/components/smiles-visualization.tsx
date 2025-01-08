"use client";

import { Input } from "@/components/ui/input";
import { Atom } from "lucide-react";
import { useState } from "react";
import { MoleculeStructure } from "./molecular-structure";

export function SmilesVisualization() {
  const [smiles, setSmiles] = useState<string>("");

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 mb-2 px-2">
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
      </div>
      <div className="flex-1 min-h-0 bg-muted/30 rounded-lg p-4">
        <div className="relative w-full h-full">
          {smiles ? (
            <MoleculeStructure
              id="smiles-visualization"
              structure={smiles}
              className="absolute inset-0"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50">
              <Atom className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <div className="text-xs text-muted-foreground font-medium">
                No Structure Available
              </div>
              <div className="text-[10px] text-muted-foreground/80 mt-1 text-center max-w-[180px]">
                Enter a SMILES string above to visualize the molecular structure
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
