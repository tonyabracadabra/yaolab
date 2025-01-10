"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

// Render the default Next.js 404 page when a route
// is requested that doesn't match the middleware and
// therefore doesn't have a locale associated with it.

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Page Not Found</h2>
      <p className="text-muted-foreground">Could not find requested resource</p>
      <Button asChild variant="outline">
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
