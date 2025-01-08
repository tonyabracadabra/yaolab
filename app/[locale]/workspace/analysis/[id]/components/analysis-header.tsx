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
          className="flex w-fit min-w-[150px] items-center justify-center gap-2 flex-nowrap"
        >
          <List size={16} />
          All analyses
        </Button>
      </Link>
      <div className="flex gap-2 flex-wrap">
        <Badge className="flex items-center justify-center gap-1">
          <FileIcon size={14} />
          <span className="ml-2">{rawFileName}</span>
        </Badge>
        <Badge className="flex items-center justify-center gap-1">
          <Atom size={14} />
          <span className="ml-2">
            {typeof reactionDb === "string" ? "default" : reactionDb.name}
          </span>
        </Badge>
        <Tooltip>
          <TooltipTrigger>
            <Badge className="flex items-center justify-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Experiments
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="flex items-start justify-between gap-4 p-2">
              <div className="flex flex-col gap-2">
                <div>Bio Samples</div>
                <div className="text-neutral-400 gap-4 flex flex-col items-center justify-center py-2">
                  {config.bioSamples.map((e, i) => (
                    <div
                      key={i}
                      className="w-full flex-col flex items-start max-w-[400px] gap-2"
                    >
                      <div className="font-bold text-lg">{e.name}</div>
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col gap-2">
                          <div>Blank Groups</div>
                          <div className="text-neutral-500 gap-2 flex items-center justify-center">
                            {e.blank.map((g, j) => (
                              <Badge key={j}>{g}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div>Sample Groups</div>
                          <div className="text-neutral-500 gap-2 flex items-center justify-center">
                            {e.sample.map((g, j) => (
                              <Badge key={j}>{g}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {config.drugSample && (
                <div className="flex flex-col gap-2">
                  <div>Drug Sample</div>
                  <div className="text-neutral-400 flex flex-col gap-2">
                    <div className="font-bold text-lg">
                      {config.drugSample.name}
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex flex-col gap-2">
                        <div>Drug Groups</div>
                        <div className="text-neutral-500 gap-2 flex items-center justify-center">
                          {config.drugSample.groups.map((g, j) => (
                            <Badge key={j}>{g}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Badge>
              <Settings2 className="h-4 w-4 mr-2" />
              Configs
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="flex items-center justify-center gap-2 flex-wrap max-w-[400px] h-fit p-2 text-xs">
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col gap-2">
                  <div>Correlation Threshold</div>
                  <div className="text-neutral-500">
                    {config.correlationThreshold}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div>MS2 Similarity Threshold</div>
                  <div className="text-neutral-500">
                    {config.ms2SimilarityThreshold}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div>m/z Error Threshold</div>
                  <div className="text-neutral-500">
                    {config.mzErrorThreshold}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div>Retention Time Window</div>
                  <div className="text-neutral-500">{config.rtTimeWindow}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <div>Signal Enrichment Factor</div>
                  <div className="text-neutral-500">
                    {config.signalEnrichmentFactor}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div>Minimum Signal Threshold</div>
                  <div className="text-neutral-500">
                    {config.minSignalThreshold}
                  </div>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
