import ShimmerButton from "@/components/magicui/shimmer-button";
import { Accordion } from "@/components/ui/accordion";
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
import { Loader2 } from "lucide-react";
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
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-8 p-8 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-2">
                <RawFileFormField />
              </div>
              <div className="space-y-2">
                <ReactionDbFormField />
              </div>
            </div>

            {rawFile && (
              <Accordion type="multiple" className="w-full space-y-4">
                <SampleGroups
                  id={rawFile}
                  enableDrugSample={enableDrugSample}
                  setEnableDrugSample={setEnableDrugSample}
                />
                <AdvancedSetting />
              </Accordion>
            )}
          </div>
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
