import { Workflow } from "@/components/analysis-result/workflow";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BadgeCheck,
  Loader2,
  LucideWorkflow,
  TimerIcon,
  XIcon,
} from "lucide-react";
import type { AnalysisProgress } from "../types";

interface AnalysisStatusProps {
  status: "running" | "failed" | "complete";
  progress: AnalysisProgress[];
  log?: string;
  creationTime: number;
}

export function AnalysisStatus({
  status,
  progress,
  log,
  creationTime,
}: AnalysisStatusProps) {
  return (
    <div className="w-full flex justify-end gap-4">
      <Tooltip>
        <TooltipTrigger>
          <div className="flex flex-col items-start justify-center gap-1">
            <div className="flex items-center justify-center gap-24">
              <div className="flex items-center justify-center gap-2">
                <LucideWorkflow size={16} />
                {status === "running" ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={14} />
                    {progress.find((p) => p.status === "running")?.step}
                  </div>
                ) : status === "failed" ? (
                  <Badge className="flex items-center justify-center gap-2 bg-destructive text-red-50 hover:bg-destructive/80">
                    <XIcon size={12} />
                    Failed
                  </Badge>
                ) : (
                  <Badge className="flex items-center justify-center gap-2 text-green-50 bg-green-400 hover:opacity-80 hover:bg-green-400">
                    <BadgeCheck size={12} />
                    Completed
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-center gap-4 text-xs max-w-[200px]">
                <TimerIcon size={16} />
                {new Date(creationTime).toString().split("GMT")[0]}
              </div>
            </div>
            <div className="text-muted-foreground text-xs">
              * Hover to view the workflow
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="-left-12">
          <Workflow progress={progress} log={log} />
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
