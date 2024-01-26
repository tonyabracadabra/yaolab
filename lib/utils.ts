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
      headers: { "Content-Type": file.type },
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
