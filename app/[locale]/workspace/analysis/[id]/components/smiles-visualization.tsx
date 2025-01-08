"use client";

import { Input } from "@/components/ui/input";
import { Atom } from "lucide-react";
import { useState } from "react";
import { MoleculeStructure } from "./molecular-structure";

export function SmilesVisualization() {
  const [smiles, setSmiles] = useState<string>("");

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-2 mb-2">
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
      <div className="flex-1 min-h-0 relative bg-muted/20 rounded-lg">
        {smiles ? (
          <div className="absolute inset-0 p-4">
            <MoleculeStructure
              id="smiles-visualization"
              structure={smiles}
              className="h-full"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
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
  );
}
