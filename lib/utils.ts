import { api } from "@/convex/_generated/api";
import {
  AnalysisCreationInputSchema,
  EdgeSchema,
  NodeSchema,
} from "@/convex/schema";
import { clsx, type ClassValue } from "clsx";
import { useAction } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function useFileUpload() {
  const generateUploadUrl = useAction(api.actions.generateUploadUrl);

  const handleUpload = async (file: File) => {
    const mimeType = file.type || "text/plain";
    const { signedUrl, storageId } = await generateUploadUrl({
      fileName: file.name,
      mimeType,
    });

    try {
      const res = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": mimeType },
        body: file,
      });

      if (res.ok) {
        toast.success("Successfully uploaded file");
        return { storageId };
      } else {
        toast.error("Failed to upload file");
        throw new Error("Failed to upload file");
      }
    } catch (error) {
      throw error;
    }
  };

  return { handleUpload };
}

export const useDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

  return { isOpen, openDialog, closeDialog };
};

export const readFirstKLines = (file: File, k: number): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = file.stream().getReader();
    let decoder = new TextDecoder("utf-8");
    let resultLines: string[] = [];
    let currentLine = "";

    const readNextChunk = async () => {
      try {
        const { done, value } = await reader.read();
        if (done) {
          // Handle the last line if it doesn't end with a newline character
          if (currentLine) resultLines.push(currentLine.trim());
          resolve(resultLines.slice(0, k));
          return;
        }

        const chunkText = decoder.decode(value, { stream: true });
        let startIndex = 0;
        let endIndex = chunkText.indexOf("\n");

        while (endIndex !== -1) {
          currentLine += chunkText.substring(startIndex, endIndex);
          resultLines.push(currentLine.trim());
          if (resultLines.length === k) {
            resolve(resultLines);
            reader.cancel();
            return;
          }
          currentLine = "";
          startIndex = endIndex + 1;
          endIndex = chunkText.indexOf("\n", startIndex);
        }

        // Accumulate any remaining text in the current line
        currentLine += chunkText.substring(startIndex);
        readNextChunk();
      } catch (error) {
        reject(error);
      }
    };

    readNextChunk();
  });
};

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export type AnalysisCreationInputType = z.infer<
  typeof AnalysisCreationInputSchema
>;

export type Edge = z.infer<typeof EdgeSchema>;
export type Node = z.infer<typeof NodeSchema>;

export type GraphData = {
  nodes: Node[];
  edges: Edge[];
};

// Function to generate GraphML string from graph data
export const generateGraphML = (graphData: GraphData) => {
  // Start of the GraphML document
  let graphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns"  
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns
     http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
  <graph id="G" edgedefault="undirected">\n`;

  // Adding node elements with their attributes
  graphData.nodes.forEach((node) => {
    graphml += `    <node id="${node.id}">\n`;
    for (const [key, value] of Object.entries(node)) {
      if (key !== "id") {
        // Exclude the id from attributes
        graphml += `      <data key="${key}">${value}</data>\n`;
      }
    }
    graphml += `    </node>\n`;
  });

  // Adding edge elements with their attributes
  graphData.edges.forEach((edge, index) => {
    graphml += `    <edge id="e${index}" source="${edge.id1}" target="${edge.id2}">\n`;
    for (const [key, value] of Object.entries(edge)) {
      if (key !== "id1" && key !== "id2") {
        // Exclude the source and target ids from attributes
        graphml += `      <data key="${key}">${value}</data>\n`;
      }
    }
    graphml += `    </edge>\n`;
  });

  // End of the GraphML document
  graphml += `  </graph>\n</graphml>`;

  return graphml;
};
