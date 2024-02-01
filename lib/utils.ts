import { api } from "@/convex/_generated/api";
import { clsx, type ClassValue } from "clsx";
import { useMutation } from "convex/react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function useFileUpload() {
  const generateUploadUrl = useMutation(api.utils.generateUploadUrl);

  const handleUpload = async (file: File) => {
    // Step 1: Get a short-lived upload URL
    const postUrl = await generateUploadUrl();
    // Step 2: POST the file to the URL
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "text/plain" },
      body: file,
    });
    return await result.json();
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
