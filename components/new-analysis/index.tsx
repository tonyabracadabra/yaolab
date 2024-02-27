import { Accordion } from "@/components/ui/accordion";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/components/ui/form";

import { api } from "@/convex/_generated/api";
import { AnalysisCreationInputSchema } from "@/convex/schema";
import { AnalysisCreationInputType } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useAction } from "convex/react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
  const form = useForm<AnalysisCreationInputType>({
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

  const onSubmit = async (values: AnalysisCreationInputType) => {
    setIsSubmitting(true);
    if (
      values.config.bioSamples
        .map((e) => e.sample.length === 0 || e.blank.length === 0)
        .includes(true)
    ) {
      toast.error("Please fill in all the sample and blank groups");
      setIsSubmitting(false);
      return;
    }

    try {
      const token = await getToken({ template: "convex", skipCache: true });
      if (!token) {
        toast.error("You need to be logged in to perform this action");
        setIsSubmitting(false);
        return;
      }
      const { id } = await triggerAnalysis({
        reactionDb: values.reactionDb,
        rawFile: values.rawFile,
        config: values.config,
        token,
      });
      onCreate(id);
    } catch (e) {
      toast.error(
        "Error occured while analyzing your data, please try again later"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 relative px-20 py-4 w-full h-[85vh] overflow-auto"
      >
        <div className="flex items-center gap-24">
          <RawFileFormField form={form} />
          <ReactionDbFormField form={form} />
        </div>
        {form.watch("rawFile") && (
          <Accordion type="multiple" className="w-full">
            <SampleGroups
              form={form}
              id={form.getValues().rawFile}
              enableDrugSample={enableDrugSample}
              setEnableDrugSample={setEnableDrugSample}
            />
            <AdvancedSetting form={form} />
          </Accordion>
        )}
        <ShimmerButton
          disabled={isSubmitting}
          type="submit"
          className="sticky bottom-[20px] hover:opacity-90 py-2 px-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                Initializing analysis
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              t("start-analysis")
            )}
          </span>
        </ShimmerButton>
      </form>
    </Form>
  );
}
