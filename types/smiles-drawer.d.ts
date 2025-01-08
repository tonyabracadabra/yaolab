declare module "smiles-drawer" {
  namespace SmilesDrawer {
    interface MoleculeTree {
      [key: string]: any;
    }

    interface DrawerOptions {
      width: number;
      height: number;
      bondThickness?: number;
      bondLength?: number;
      shortBondLength?: number;
      bondSpacing?: number;
      atomVisualization?: "default" | "balls";
      isometric?: boolean;
      terminalCarbons?: boolean;
      explicitHydrogens?: boolean;
      overlapSensitivity?: number;
      compactDrawing?: boolean;
      fontSizeLarge?: number;
      fontSizeSmall?: number;
      padding?: number;
      debug?: boolean;
    }
  }

  const SmilesDrawer: {
    parse(
      smiles: string,
      successCallback: (tree: SmilesDrawer.MoleculeTree) => void,
      errorCallback?: (error: Error) => void
    ): void;

    Drawer: {
      new (options: SmilesDrawer.DrawerOptions): {
        draw(
          tree: SmilesDrawer.MoleculeTree,
          target: HTMLCanvasElement,
          theme?: "light" | "dark",
          clear?: boolean
        ): void;
      };
    };
  };

  export = SmilesDrawer;
}
