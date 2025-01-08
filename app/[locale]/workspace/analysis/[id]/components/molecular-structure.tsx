"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import _ from "lodash";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRDKit } from "../utils/init-rdkit";

interface MoleculeStructureProps {
  id: string;
  className?: string;
  width?: number;
  height?: number;
  structure: string;
  subStructure?: string;
  extraDetails?: Record<string, any>;
  drawingDelay?: number;
}

interface SubstructureMatch {
  atoms: number[];
  bonds: number[];
}

export function MoleculeStructure({
  id,
  className = "",
  width = 250,
  height = 180,
  structure,
  subStructure = "",
  extraDetails = {},
  drawingDelay,
}: MoleculeStructureProps) {
  const [svg, setSvg] = useState<string>();
  const { rdkit: RDKit, error: rdkitError, isLoading } = useRDKit();

  const MOL_DETAILS = {
    width,
    height,
    bondLineWidth: 1,
    addStereoAnnotation: true,
    ...extraDetails,
  };

  const isValidMol = (mol: any) => {
    return !!mol;
  };

  const getMolDetails = (mol: any, qmol: any) => {
    if (isValidMol(mol) && isValidMol(qmol)) {
      const subStructHighlightDetails = JSON.parse(
        mol.get_substruct_matches(qmol)
      );
      const subStructHighlightDetailsMerged = !_.isEmpty(
        subStructHighlightDetails
      )
        ? subStructHighlightDetails.reduce(
            (acc: SubstructureMatch, { atoms, bonds }: SubstructureMatch) => ({
              atoms: [...acc.atoms, ...atoms],
              bonds: [...acc.bonds, ...bonds],
            }),
            { bonds: [], atoms: [] }
          )
        : subStructHighlightDetails;
      return JSON.stringify({
        ...MOL_DETAILS,
        ...extraDetails,
        ...subStructHighlightDetailsMerged,
      });
    }
    return JSON.stringify({
      ...MOL_DETAILS,
      ...extraDetails,
    });
  };

  const draw = () => {
    if (!RDKit) return;

    const mol = RDKit.get_mol(structure || "invalid");
    const qmol = RDKit.get_qmol(subStructure || "invalid");
    const validMol = isValidMol(mol);

    if (validMol) {
      const svgContent = mol.get_svg_with_highlights(getMolDetails(mol, qmol));
      setSvg(svgContent);
    }

    // Clean up C++ objects
    mol?.delete();
    qmol?.delete();
  };

  // Draw on mount and when dependencies change
  useEffect(() => {
    if (!isLoading && !rdkitError && RDKit) {
      if (drawingDelay) {
        const timer = setTimeout(draw, drawingDelay);
        return () => clearTimeout(timer);
      } else {
        draw();
      }
    }
  }, [
    RDKit,
    isLoading,
    rdkitError,
    structure,
    subStructure,
    extraDetails,
    width,
    height,
  ]);

  if (rdkitError) {
    return (
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>
          Error loading molecular structure renderer.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[180px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const mol = RDKit?.get_mol(structure || "invalid");
  const validMol = isValidMol(mol);
  mol?.delete();

  if (!validMol) {
    return (
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription title={`Cannot render structure: ${structure}`}>
          Invalid molecular structure.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div title={structure} style={{ minHeight: height }}>
      {svg ? (
        <div
          className="w-full h-full flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
