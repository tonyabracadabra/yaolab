"use client";

import { UserProfile } from "@clerk/nextjs";

export default function SettingsPage() {
  return (
    <UserProfile
      appearance={{
        layout: {
          socialButtonsPlacement: "bottom",
        },
        elements: {
          rootBox: {
            boxShadow: "none",
            width: "100%",
          },
          card: {
            border: "none",
            boxShadow: "none",
            width: "100%",
          },
          navbar: {
            width: "100%",
          },
          scrollBox: {
            width: "100%",
          },
        },
      }}
    />
  );
}
