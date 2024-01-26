"use client";

import TaskCreation from "@/components/task-creation";
import { Id } from "@/convex/_generated/dataModel";

import { useRouter } from "next/navigation";

export default function Analysis() {
  const router = useRouter();

  const handleSubmit = async (id: Id<"tasks">) => {
    router.push(`/dashboard/analysis/${id}`);
  };

  return (
    <main className="h-full flex w-full font-sans">
      <TaskCreation onCreate={handleSubmit} />
    </main>
  );
}
