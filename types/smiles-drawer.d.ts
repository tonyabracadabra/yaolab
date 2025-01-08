declare module "smiles-drawer" {
  interface DrawerOptions {
    width?: number;
    height?: number;
    bondThickness?: number;
    fontSizeLarge?: number;
    fontSizeSmall?: number;
    padding?: number;
    scale?: number;
  }

  class Drawer {
    constructor(options?: DrawerOptions);
    draw(tree: any, canvas: HTMLCanvasElement, theme: "light" | "dark"): void;
  }

  function parse(smiles: string, callback: (tree: any) => void): void;

  export default {
    Drawer,
    parse,
  };
}
