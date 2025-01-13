import ShimmerButton from "@/components/magicui/shimmer-button";
import { Accordion } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { AnalysisCreationInputSchema } from "@/convex/schema";
import { AnalysisCreationInputType } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "convex/react";
import { ArrowRight, Database, FileText, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { AdvancedSetting } from "./advanced-setting";
import { RawFileFormField } from "./raw-file/field";
import { ReactionDbFormField } from "./reaction-db/field";
import { SampleGroups } from "./sample-groups";

interface AnalysisCreationProps {
  defaultAnalysis?: AnalysisCreationInputType;
  onCreate: (id: Id<"analyses">) => void;
}

export default function AnalysisCreation({
  defaultAnalysis,
  onCreate,
}: AnalysisCreationProps) {
  const t = useTranslations("New");
  const methods = useForm<AnalysisCreationInputType>({
    resolver: zodResolver(AnalysisCreationInputSchema),
    defaultValues: {
      rawFile: defaultAnalysis?.rawFile || "",
      reactionDb: defaultAnalysis?.reactionDb || "default-pos",
      config: {
        bioSamples: defaultAnalysis?.config.bioSamples || [
          {
            name: "new sample 1",
            sample: [],
            blank: [],
            metadata: {
              source: "",
              species: "",
              gender: "unknown",
              age: undefined,
              diseaseState: "",
              notes: "",
            },
          },
        ],
        drugSample: defaultAnalysis?.config.drugSample,
        signalEnrichmentFactor:
          defaultAnalysis?.config.signalEnrichmentFactor || 30,
        minSignalThreshold: defaultAnalysis?.config.minSignalThreshold || 5e5,
        ms2SimilarityThreshold:
          defaultAnalysis?.config.ms2SimilarityThreshold || 0.7,
        mzErrorThreshold: defaultAnalysis?.config.mzErrorThreshold || 0.01,
        rtTimeWindow: defaultAnalysis?.config.rtTimeWindow || 0.02,
        correlationThreshold:
          defaultAnalysis?.config.correlationThreshold || 0.95,
      },
    },
  });

  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const triggerAnalysis = useAction(api.actions.triggerAnalysis);
  const [enableDrugSample, setEnableDrugSample] = useState(
    !!defaultAnalysis?.config.drugSample
  );

  const rawFile = methods.watch("rawFile");
  const reactionDb = methods.watch("reactionDb");
  const bioSamples = methods.watch("config.bioSamples");

  const isFormValid = () => {
    if (!rawFile || !reactionDb) return false;

    return bioSamples.some(
      (sample) => sample.sample.length > 0 && sample.blank.length > 0
    );
  };

  const onSubmit = async (values: AnalysisCreationInputType) => {
    setIsSubmitting(true);

    try {
      if (
        values.config.bioSamples
          .map((e) => e.sample.length === 0 || e.blank.length === 0)
          .includes(true)
      ) {
        toast.error("Please fill in all the sample and blank groups");
        return;
      }

      const token = await getToken({ template: "convex", skipCache: true });
      if (!token) {
        toast.error("You need to be logged in to perform this action");
        return;
      }

      const { id } = await triggerAnalysis({
        reactionDb: values.reactionDb,
        rawFile: values.rawFile,
        config: values.config,
        token,
      });
      onCreate(id);
    } catch (error) {
      toast.error(
        "Error occurred while analyzing your data, please try again later"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="flex flex-col w-full"
      >
        <div className="space-y-8 p-8 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-2">
              <RawFileFormField />
            </div>
            <div className="space-y-2">
              <ReactionDbFormField />
            </div>
          </div>

          {!rawFile || !reactionDb ? (
            <div className="mt-8">
              <Card className="p-6 border border-dashed">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-sm font-medium mb-1">
                      Getting Started with Your Analysis
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Follow these steps to begin analyzing your mass
                      spectrometry data
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border bg-card/50 transition-colors hover:bg-card">
                      <div className="flex gap-2.5">
                        <FileText className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h4 className="text-xs font-medium">
                              Select Raw File
                            </h4>
                            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 leading-4 rounded">
                              Step 1
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Choose your mass spectrometry data file (mzML/mzXML)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border bg-card/50 transition-colors hover:bg-card">
                      <div className="flex gap-2.5">
                        <Database className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h4 className="text-xs font-medium">
                              Choose Reaction Database
                            </h4>
                            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 leading-4 rounded">
                              Step 2
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Select a reaction database to identify potential
                            reactions
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
                    <span>
                      Configure sample groups and advanced settings after
                      selection
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            rawFile && (
              <Accordion type="multiple" className="w-full space-y-4">
                <SampleGroups
                  id={rawFile}
                  enableDrugSample={enableDrugSample}
                  setEnableDrugSample={setEnableDrugSample}
                />
                <AdvancedSetting />
              </Accordion>
            )
          )}
        </div>

        <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
          <div className="flex justify-center">
            {isSubmitting || !isFormValid() ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <ShimmerButton
                      disabled
                      onClick={methods.handleSubmit(onSubmit)}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          Initializing analysis
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        t("start-analysis")
                      )}
                    </ShimmerButton>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="center"
                  className="max-w-[300px]"
                >
                  {!isFormValid() && (
                    <p>
                      Please fill in all required fields: raw file, reaction
                      database, and at least one sample group with both sample
                      and blank files.
                    </p>
                  )}
                  {isSubmitting && (
                    <p>Analysis is being initialized, please wait...</p>
                  )}
                </TooltipContent>
              </Tooltip>
            ) : (
              <ShimmerButton onClick={methods.handleSubmit(onSubmit)}>
                {t("start-analysis")}
              </ShimmerButton>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
