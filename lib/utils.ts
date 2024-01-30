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

export const readFirstLine = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = file.stream().getReader();
    let decoder = new TextDecoder();
    let isFirstLine = true;
    let firstLine = "";

    const processChunk = ({
      done,
      value,
    }: {
      done: boolean;
      value?: Uint8Array;
    }) => {
      if (done) {
        if (isFirstLine) {
          resolve(firstLine.split(",")); // Handle case where no newline in the first chunk
        } else {
          reject(new Error("No line found"));
        }
        return;
      }

      isFirstLine = false;
      const chunk = decoder.decode(value, { stream: true });
      const newlineIndex = chunk.indexOf("\n");

      if (newlineIndex !== -1) {
        firstLine += chunk.substring(0, newlineIndex);
        resolve(firstLine.split(","));
        reader.cancel();
      } else {
        firstLine += chunk;
        reader.read().then(processChunk).catch(reject);
      }
    };

    reader.read().then(processChunk).catch(reject);
  });
};
