"use client";

import { queryMetabolicReactions } from "@/actions/metabolic-reactions";
import { useEffect, useState } from "react";

interface MetabolicReactionsData {
  enzymes: string[];
  pathways: string[];
  mzToReactions: {
    [key: string]: {
      enzymes: string[];
      pathways: string[];
    };
  };
}

export function useMetabolicReactions() {
  const [data, setData] = useState<MetabolicReactionsData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await queryMetabolicReactions(0, undefined);
        setData({
          ...result,
          mzToReactions: Object.fromEntries(
            Object.entries(result.mzToReactions).map(([key, value]) => [
              key,
              value,
            ])
          ),
        });
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchData();
  }, []);

  return { data, error, isLoading };
}
