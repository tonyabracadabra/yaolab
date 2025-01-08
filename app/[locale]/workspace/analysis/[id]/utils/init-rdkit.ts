import { useEffect, useState } from "react";

interface RDKitInstance {
  get_mol: (smiles: string) => any;
  get_qmol: (smiles: string) => any;
  [key: string]: any;
}

declare global {
  interface Window {
    initRDKitModule: () => Promise<RDKitInstance>;
    RDKit: RDKitInstance;
  }
}

let rdkitLoadingPromise: Promise<RDKitInstance> | null = null;
let rdkitScriptLoaded = false;

const loadRDKitScript = () => {
  return new Promise<void>((resolve, reject) => {
    if (rdkitScriptLoaded) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://unpkg.com/@rdkit/rdkit/Code/MinimalLib/dist/RDKit_minimal.js";
    script.async = true;
    script.onload = () => {
      rdkitScriptLoaded = true;
      resolve();
    };
    script.onerror = () => {
      reject(new Error("Failed to load RDKit script"));
    };
    document.body.appendChild(script);
  });
};

const initRDKit = async () => {
  if (!rdkitLoadingPromise) {
    rdkitLoadingPromise = new Promise(async (resolve, reject) => {
      try {
        await loadRDKitScript();
        const RDKit = await window.initRDKitModule();
        window.RDKit = RDKit;
        resolve(RDKit);
      } catch (e) {
        reject(e);
        rdkitLoadingPromise = null; // Allow retry on failure
      }
    });
  }
  return rdkitLoadingPromise;
};

export function useRDKit() {
  const [rdkit, setRDKit] = useState<RDKitInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const RDKit = await initRDKit();
        if (mounted) {
          setRDKit(RDKit);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError("Failed to initialize RDKit");
          console.error("RDKit initialization error:", err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return { rdkit, error, isLoading };
}
