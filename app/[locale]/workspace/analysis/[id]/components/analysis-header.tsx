"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
          variant="outline"
          className="flex w-fit min-w-[150px] items-center justify-center gap-2 flex-nowrap hover:bg-secondary/10 transition-colors"
        >
          <List className="h-4 w-4" />
          All analyses
        </Button>
      </Link>

      <div className="flex gap-2 flex-wrap">
        <Badge
          variant="outline"
          className="flex items-center justify-center gap-1.5 px-3 py-1 h-8 hover:bg-secondary/10 transition-colors"
        >
          <FileIcon className="h-3.5 w-3.5" />
          {rawFileName}
        </Badge>

        <Badge
          variant="outline"
          className="flex items-center justify-center gap-1.5 px-3 py-1 h-8 hover:bg-secondary/10 transition-colors"
        >
          <Atom className="h-3.5 w-3.5" />
          {typeof reactionDb === "string" ? "default" : reactionDb.name}
        </Badge>

        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="flex items-center justify-center gap-1.5 px-3 py-1 h-8 hover:bg-secondary/10 transition-colors cursor-pointer"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Experiments
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="w-[600px] p-0">
            <Card className="p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <h4 className="text-base font-semibold">
                    Experiment Configuration
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Sample groups and experimental setup details
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <h5 className="text-sm font-medium">Bio Samples</h5>
                    </div>

                    <ScrollArea className="h-[300px]">
                      <div className="space-y-4 pl-6">
                        {config.bioSamples.map((e, i) => (
                          <div
                            key={i}
                            className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="font-medium text-sm">{e.name}</div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-muted-foreground">
                                  Blank Groups
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {e.blank.map((g, j) => (
                                    <Badge
                                      key={j}
                                      variant="secondary"
                                      className="text-[11px] bg-secondary/50"
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
                                      variant="secondary"
                                      className="text-[11px] bg-secondary/50"
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
                    </ScrollArea>
                  </div>

                  {config.drugSample && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <h5 className="text-sm font-medium">Drug Sample</h5>
                      </div>

                      <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors pl-6">
                        <div className="font-medium text-sm">
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
                                variant="secondary"
                                className="text-[11px] bg-secondary/50"
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
            </Card>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="flex items-center justify-center gap-1.5 px-3 py-1 h-8 hover:bg-secondary/10 transition-colors cursor-pointer"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Configs
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="w-[600px] p-0">
            <Card className="p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <h4 className="text-base font-semibold">
                    Analysis Configuration
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Technical parameters and thresholds
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: "Correlation Threshold",
                      value: config.correlationThreshold,
                    },
                    {
                      label: "MS2 Similarity Threshold",
                      value: config.ms2SimilarityThreshold,
                    },
                    {
                      label: "m/z Error Threshold",
                      value: config.mzErrorThreshold,
                    },
                    {
                      label: "Retention Time Window",
                      value: config.rtTimeWindow,
                    },
                    {
                      label: "Signal Enrichment Factor",
                      value: config.signalEnrichmentFactor,
                    },
                    {
                      label: "Minimum Signal Threshold",
                      value: config.minSignalThreshold,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors space-y-2"
                    >
                      <div className="text-xs font-medium text-muted-foreground">
                        {item.label}
                      </div>
                      <div className="text-sm font-medium">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
