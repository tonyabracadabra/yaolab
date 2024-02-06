import { api } from "@/convex/_generated/api";
import { clsx, type ClassValue } from "clsx";
import { useAction } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

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
