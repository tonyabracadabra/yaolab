import { Accordion } from "@/components/ui/accordion";
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
import ShimmerButton from "../magicui/shimmer-button";
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
        className="flex flex-col h-full max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      >
        <div className="flex-1 overflow-y-auto px-2">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="w-full">
                <RawFileFormField />
              </div>
              <div className="w-full">
                <ReactionDbFormField />
              </div>
            </div>

            {rawFile && (
              <Accordion type="multiple" className="w-full">
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

        <div className="sticky bottom-0 py-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex justify-center">
            <ShimmerButton
              disabled={isSubmitting}
              type="submit"
              className="hover:opacity-90 py-2.5 px-4 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-base">
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    Initializing analysis
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  t("start-analysis")
                )}
              </span>
            </ShimmerButton>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
