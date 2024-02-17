import { Button } from "@/src/components/ui/button";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./ui/input";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";

import { api } from "@/convex/_generated/api";
import { AnalysisCreationInputSchema } from "@/convex/schema";
import { useAuth } from "@clerk/nextjs";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { useAction, useQuery } from "convex/react";
import { DownloadCloud, Loader2, Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { UseFormReturn, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Id } from "../../convex/_generated/dataModel";
import { FormLabelWithTooltip } from "./form-label-tooltip";
import ShimmerButton from "./magicui/shimmer-button";
import { MultiSelectCombobox } from "./multiselect-combobox";
import { RawFileCreation } from "./raw-file-creation";
import { ReactionDbCreation } from "./react-db-creation";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tooltip, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type AnalysisCreationInputType = z.infer<typeof AnalysisCreationInputSchema>;

interface SampleGroupFieldArrayProps {
  options: string[];
  form: UseFormReturn<AnalysisCreationInputType>;
  experiment: number;
  groupName: "sampleGroups" | "blankGroups";
}

interface AnalysisCreationProps {
  defaultAnalysis?: AnalysisCreationInputType;
  onCreate: (id: Id<"analyses">) => void;
}

const SampleGroupFieldArray: React.FC<SampleGroupFieldArrayProps> = ({
  form,
  experiment,
  groupName,
  options,
}) => {
  const t = useTranslations("New");

  return (
    <div className="flex flex-col gap-2 items-start justify-start h-full">
      <FormLabel className="px-4 flex items-center justify-center gap-2">
        {groupName === "sampleGroups" ? t("sample-groups") : t("blank-groups")}
      </FormLabel>
      <MultiSelectCombobox
        options={options.map((option) => ({
          value: option,
          label: option,
        }))}
        onSelect={async (val: string) => {
          const currExperiment =
            form.getValues().config.experiments[experiment];
          const otherGroup =
            groupName === "sampleGroups" ? "blankGroups" : "sampleGroups";

          if (currExperiment[otherGroup].includes(val)) {
            toast.error("Sample group and blank group cannot have same values");
            return;
          }

          if (currExperiment[groupName].includes(val)) {
            form.setValue(
              `config.experiments.${experiment}.${groupName}`,
              currExperiment[groupName].filter((v) => v !== val)
            );
          } else {
            form.setValue(`config.experiments.${experiment}.${groupName}`, [
              ...currExperiment[groupName],
              val,
            ]);
          }
        }}
        selectedValues={
          form.watch(
            `config.experiments.${experiment}.${groupName}`
          ) as string[]
        }
        otherGroupSelectedValues={
          form.watch(
            `config.experiments.${experiment}.${
              groupName === "sampleGroups" ? "blankGroups" : "sampleGroups"
            }`
          ) as string[]
        }
      />
    </div>
  );
};

export default function AnalysisCreation({
  defaultAnalysis,
  onCreate,
}: AnalysisCreationProps) {
  const t = useTranslations("New");

  const form = useForm<AnalysisCreationInputType>({
    resolver: zodResolver(AnalysisCreationInputSchema),
    defaultValues: {
      rawFile: defaultAnalysis?.rawFile || "",
      reactionDb: defaultAnalysis?.reactionDb || "default",
      config: {
        experiments: defaultAnalysis?.config.experiments || [
          {
            name: "new sample 1",
            sampleGroups: [],
            blankGroups: [],
          },
        ],
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
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "config.experiments",
  });
  const [currExperiment, setCurrExperiment] = useState(0);
  const downloadDefaultReactions = useAction(
    api.actions.downloadDefaultReactions
  );

  const allRawFiles = useQuery(api.rawFiles.getAllRawFiles, {});
  const allReactionDatabases = useQuery(
    api.reactions.getAllReactionDatabases,
    {}
  );

  const onSubmit = async (values: AnalysisCreationInputType) => {
    setIsSubmitting(true);
    if (
      values.config.experiments
        .map((e) => e.sampleGroups.length === 0 || e.blankGroups.length === 0)
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
    <div className="w-full px-8 py-4 space-y-6 h-full flex flex-col justify-center rounded-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-6">
          <div className="flex items-center gap-24">
            <FormField
              control={form.control}
              name="rawFile"
              render={({ field: { onChange, value } }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-md min-w-[250px]">
                    <Badge variant="secondary">1</Badge> {t("choose-raw-file")}
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(v) => {
                        if (!v) return;
                        onChange(v);

                        toast.success(
                          `Raw file selected as ${
                            allRawFiles?.find((f) => f._id === v)?.name
                          }, please configure the experiment groups`
                        );
                      }}
                      value={value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("select-raw-file")} />
                      </SelectTrigger>
                      <SelectContent>
                        {allRawFiles?.map((rawFile) => {
                          return (
                            <SelectItem key={rawFile._id} value={rawFile?._id}>
                              {rawFile.name}
                            </SelectItem>
                          );
                        })}
                        {allRawFiles?.length === 0 && (
                          <SelectItem key={"none"} disabled value="none">
                            {allRawFiles === undefined ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              "No raw files"
                            )}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    {t.rich("select-or-create-raw", {
                      create: () => (
                        <RawFileCreation
                          onCreate={(id: Id<"rawFiles">) => {
                            onChange(id);
                          }}
                        />
                      ),
                    })}
                  </FormDescription>
                </FormItem>
              )}
            />
            <div className="flex items-center justify-center gap-2">
              <FormField
                control={form.control}
                name="reactionDb"
                render={({ field: { onChange, value } }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-md min-w-[250px]">
                      <Badge variant="secondary">2</Badge>{" "}
                      {t("choose-reaction-db")}
                    </FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(v) => {
                          if (!v) return;
                          onChange(v);
                        }}
                        value={value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Raw File to be analyzed" />
                        </SelectTrigger>
                        <SelectContent>
                          {allReactionDatabases?.map((db) => (
                            <SelectItem key={db._id} value={db._id}>
                              {db.name}
                            </SelectItem>
                          ))}
                          <SelectItem key="default" value="default">
                            {t("default-reactions-label")}
                          </SelectItem>
                          {allReactionDatabases?.length === 0 && (
                            <SelectItem key={"none"} disabled value="none">
                              {allReactionDatabases === undefined ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                t("no-custom-reactions-created")
                              )}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      {t.rich("select-or-create-reaction-db", {
                        create: () => (
                          <ReactionDbCreation
                            onCreate={(id: Id<"reactionDatabases">) =>
                              onChange(id)
                            }
                          />
                        ),
                      })}
                    </FormDescription>
                  </FormItem>
                )}
              />
              {form.watch("reactionDb") === "default" && (
                <Button
                  size="xs"
                  type="button"
                  variant="secondary"
                  className="flex items-center gap-2"
                  onClick={async () => {
                    const { csv } = await downloadDefaultReactions();
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "default-reactions.csv"; // Sets the filename for the download
                    document.body.appendChild(a); // Append the link to the document
                    a.click(); // Trigger the download
                    document.body.removeChild(a); // Clean up and remove the link
                    URL.revokeObjectURL(url);
                  }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="w-full h-full">
                          <DownloadCloud size={12} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg shadow-lg">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {t("download-default-reactions")}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Button>
              )}
            </div>
          </div>
          {form.watch("rawFile") && (
            <Accordion type="multiple" className="w-full">
              <AccordionItem
                value="experiment-groups"
                className="cursor-pointer"
              >
                <AccordionTrigger>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="secondary">3</Badge>{" "}
                    {t("experiment-groups")}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex gap-4 w-full">
                    <div className="flex flex-col gap-4 p-2 w-[300px] h-full justify-between">
                      <div className="flex items-center gap-2 justify-center">
                        <Select
                          onValueChange={(v) => {
                            if (!v) return;
                            setCurrExperiment(+v);
                          }}
                          value={currExperiment.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose raw file to be analyzed" />
                          </SelectTrigger>
                          <SelectContent>
                            {fields?.map((f, i) => {
                              return (
                                <SelectItem key={i} value={i.toString()}>
                                  {f.name}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormDescription>
                        {t.rich("select-exp-or-create", {
                          create: () => (
                            <Button
                              type="button"
                              onClick={() => {
                                append({
                                  name: `new sample ${fields.length + 1}`,
                                  sampleGroups: [],
                                  blankGroups: [],
                                });
                                setCurrExperiment(fields.length);
                                toast.success(
                                  "New experiment group added, please configure sample groups and blank groups"
                                );
                              }}
                              variant="outline"
                              size="xs"
                              className="font-bold"
                            >
                              <span>✨ {t("create")} </span>
                            </Button>
                          ),
                        })}
                      </FormDescription>
                    </div>
                    <div className="flex w-full relative flex-col gap-4 bg-slate-100 dark:bg-slate-900 p-6 rounded-md">
                      <Button
                        type="button"
                        className="absolute right-[8px] top-[8px] w-8 h-6 p-0 bg-red-50 border-0 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800"
                        variant="outline"
                        onClick={() => {
                          if (fields.length > 1) {
                            setCurrExperiment(0);
                            remove(currExperiment);
                          } else {
                            toast.error(
                              "You need to have at least one experimentation group"
                            );
                          }
                        }}
                      >
                        <Trash className="stroke-red-400" size={12} />
                      </Button>
                      <div className="flex gap-8 items-center">
                        <FormField
                          key={`experiment-group-name-${currExperiment}`} // Adding a unique key
                          control={form.control}
                          name={`config.experiments.${currExperiment}.name`}
                          render={({ field: { onChange, value } }) => {
                            return (
                              <FormItem>
                                <FormLabel>
                                  {t("experiment-group-name")}
                                </FormLabel>
                                <div className="flex items-center gap-4 justify-center w-full">
                                  <FormControl>
                                    <Input value={value} onChange={onChange} />
                                  </FormControl>
                                </div>
                              </FormItem>
                            );
                          }}
                        />
                      </div>
                      {/* Sample Groups */}
                      <div className="flex items-center justify-between gap-2">
                        <SampleGroupFieldArray
                          options={
                            allRawFiles?.find(
                              (rawFile) => rawFile._id === form.watch("rawFile")
                            )?.sampleCols || []
                          }
                          form={form}
                          experiment={currExperiment}
                          groupName="sampleGroups"
                        />
                        <div className="flex h-full items-center justify-center mt-5">
                          vs
                        </div>
                        <SampleGroupFieldArray
                          options={
                            allRawFiles?.find(
                              (rawFile) => rawFile._id === form.watch("rawFile")
                            )?.sampleCols || []
                          }
                          form={form}
                          experiment={currExperiment}
                          groupName="blankGroups"
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="advanced">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">4</Badge>
                    {t("advanced-settings")}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="flex gap-4 flex-col px-1">
                  <FormField
                    control={form.control}
                    name="config.minSignalThreshold"
                    render={({ field: { onChange, value } }) => (
                      <FormItem>
                        <FormLabelWithTooltip
                          tooltip="This value determines the minimum signal value required for a metabolite to be considered enriched in the treated sample group. 
                        Higher values will result in a stricter filter, focusing on metabolites with more pronounced signals."
                        >
                          {t("min-signal-threshold")}
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input
                            placeholder="1"
                            type="number"
                            onChange={(event) => onChange(+event.target.value)}
                            value={value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="config.signalEnrichmentFactor"
                    render={({ field: { onChange, value } }) => (
                      <FormItem>
                        <FormLabelWithTooltip
                          tooltip="This value sets the minimum ratio of a metabolite's signal in the treated sample group compared to the blank group for it to be considered enriched. 
                          Higher values will result in a stricter filter, focusing on metabolites with more pronounced enrichment."
                        >
                          {t("signal-enrichment-factor")}
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.1"
                            onChange={(event) => onChange(+event.target.value)}
                            value={value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="config.ms2SimilarityThreshold"
                    render={({ field: { onChange, value } }) => (
                      <FormItem>
                        <FormLabelWithTooltip
                          tooltip="Set the threshold for MS2 similarity filtering. A default value of 0.7 is recommended. 
                          The range of this value is between 0.5 and 1.
                        "
                        >
                          {t("ms2-similarity-threshold")}
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input
                            type="number"
                            onChange={(event) => onChange(+event.target.value)}
                            value={value}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="config.mzErrorThreshold"
                    render={({ field: { onChange, value } }) => (
                      <FormItem>
                        <FormLabelWithTooltip
                          tooltip="Set the maximum allowable ∆m/z error for matching
                          metabolite responses. A value within 0.01 Da is
                          recommended for accurate matching."
                        >
                          {t("mz-error-threshold")}
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            onChange={(event) => onChange(+event.target.value)}
                            value={value}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="config.correlationThreshold"
                    defaultValue={0.95}
                    render={({ field: { onChange, value } }) => (
                      <FormItem>
                        <FormLabelWithTooltip tooltip="Set the minimum acceptable correlation">
                          {t("correlation-threshold")}
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            onChange={(event) => onChange(+event.target.value)}
                            value={value}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="config.rtTimeWindow"
                    render={({ field: { onChange, value } }) => (
                      <FormItem>
                        <FormLabelWithTooltip
                          tooltip="Define the time window in minutes (∆Rt) for redundancy
                          checks. A default value of 0.02min helps in
                          distinguishing redundant entries effectively."
                        >
                          {t("rt-time-window")}
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input
                            type="number"
                            onChange={(event) => onChange(+event.target.value)}
                            value={value}
                            placeholder={"0.02"}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          <ShimmerButton
            disabled={isSubmitting}
            type="submit"
            className="hover:opacity-90 py-2 px-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  Initiating analysis
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                t("start-analysis")
              )}
            </span>
          </ShimmerButton>
        </form>
      </Form>
    </div>
  );
}
