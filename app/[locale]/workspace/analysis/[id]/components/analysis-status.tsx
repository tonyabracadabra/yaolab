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
    <Tooltip>
      <TooltipTrigger className="w-full px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <LucideWorkflow className="text-muted-foreground" size={18} />
              <span className="font-medium">Status</span>
            </div>

            {status === "running" ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin text-primary" size={16} />
                <span className="text-sm text-muted-foreground">
                  {progress.find((p) => p.status === "running")?.step}
                </span>
              </div>
            ) : status === "failed" ? (
              <Badge
                variant="destructive"
                className="flex items-center gap-1.5"
              >
                <XIcon size={12} />
                Failed
              </Badge>
            ) : (
              <Badge
                variant="default"
                className="bg-green-500 hover:bg-green-500/90 flex items-center gap-1.5"
              >
                <BadgeCheck size={12} />
                Completed
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TimerIcon size={16} />
            <time dateTime={new Date(creationTime).toISOString()}>
              {new Date(creationTime).toLocaleString()}
            </time>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="w-[400px]">
        <Workflow progress={progress} log={log} />
      </TooltipContent>
    </Tooltip>
  );
}
