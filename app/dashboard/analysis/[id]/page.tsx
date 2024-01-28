"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { LoaderIcon } from "lucide-react";

export default function Page({ params }: { params: { id: Id<"tasks"> } }) {
  const task = useQuery(api.tasks.get, { id: params.id });

  if (!task) {
    return <LoaderIcon className="animate-spin" />;
  }

  return <div>{task.status === "failed" && <Button>Retry</Button>}</div>;
}
