import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Atom, FileIcon, FlaskConical, List, Settings2 } from "lucide-react";
import Link from "next/link";
import type { AnalysisConfigResponse } from "../types";

interface AnalysisHeaderProps {
  rawFileName?: string;
  reactionDb: string | { name: string; [key: string]: unknown };
  config: AnalysisConfigResponse;
}

export function AnalysisHeader({
  rawFileName,
  reactionDb,
  config,
}: AnalysisHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 w-full">
      <Link href="/workspace/analysis">
        <Button
          size="sm"
          variant="secondary"
          className="flex w-fit min-w-[150px] items-center justify-center gap-2 flex-nowrap shadow-sm hover:bg-secondary/80"
        >
          <List size={16} />
          All analyses
        </Button>
      </Link>
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant="secondary"
          className="flex items-center justify-center gap-1.5 px-3 h-7 shadow-sm hover:bg-secondary/80"
        >
          <FileIcon size={14} />
          {rawFileName}
        </Badge>
        <Badge
          variant="secondary"
          className="flex items-center justify-center gap-1.5 px-3 h-7 shadow-sm hover:bg-secondary/80"
        >
          <Atom size={14} />
          {typeof reactionDb === "string" ? "default" : reactionDb.name}
        </Badge>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="flex items-center justify-center gap-1.5 px-3 h-7 shadow-sm hover:bg-secondary/80 cursor-pointer"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Experiments
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="w-[600px] p-0">
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <h4 className="font-medium">Experiment Configuration</h4>
                <p className="text-sm text-muted-foreground">
                  Sample groups and experimental setup details
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <h5 className="text-sm font-medium">Bio Samples</h5>
                  </div>

                  <div className="space-y-4 pl-6">
                    {config.bioSamples.map((e, i) => (
                      <div
                        key={i}
                        className="space-y-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="font-medium">{e.name}</div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">
                              Blank Groups
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {e.blank.map((g, j) => (
                                <Badge
                                  key={j}
                                  variant="outline"
                                  className="text-[11px]"
                                >
                                  {g}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">
                              Sample Groups
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {e.sample.map((g, j) => (
                                <Badge
                                  key={j}
                                  variant="outline"
                                  className="text-[11px]"
                                >
                                  {g}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {config.drugSample && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <h5 className="text-sm font-medium">Drug Sample</h5>
                    </div>

                    <div className="space-y-3 p-3 rounded-lg bg-muted/50 pl-6">
                      <div className="font-medium">
                        {config.drugSample.name}
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">
                          Drug Groups
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {config.drugSample.groups.map((g, j) => (
                            <Badge
                              key={j}
                              variant="outline"
                              className="text-[11px]"
                            >
                              {g}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="flex items-center justify-center gap-1.5 px-3 h-7 shadow-sm hover:bg-secondary/80 cursor-pointer"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Configs
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="w-[600px] p-0">
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <h4 className="font-medium">Analysis Configuration</h4>
                <p className="text-sm text-muted-foreground">
                  Technical parameters and thresholds
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">
                    Correlation Threshold
                  </div>
                  <div className="text-sm">{config.correlationThreshold}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">
                    MS2 Similarity Threshold
                  </div>
                  <div className="text-sm">{config.ms2SimilarityThreshold}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">
                    m/z Error Threshold
                  </div>
                  <div className="text-sm">{config.mzErrorThreshold}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">
                    Retention Time Window
                  </div>
                  <div className="text-sm">{config.rtTimeWindow}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">
                    Signal Enrichment Factor
                  </div>
                  <div className="text-sm">{config.signalEnrichmentFactor}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">
                    Minimum Signal Threshold
                  </div>
                  <div className="text-sm">{config.minSignalThreshold}</div>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
