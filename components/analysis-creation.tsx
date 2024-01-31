"use client";

import { Button } from "@/components/ui/button";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
} from "@/components/ui/form";

import { api } from "@/convex/_generated/api";
import { AnalysisCreationInputSchema } from "@/convex/schema";
import { useAuth } from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import { Loader2, Trash } from "lucide-react";
import { useState } from "react";
import { UseFormReturn, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Id } from "../convex/_generated/dataModel";
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

type AnalysisCreationInputType = z.infer<typeof AnalysisCreationInputSchema>;

interface SampleGroupFieldArrayProps {
  options: string[];
  form: UseFormReturn<AnalysisCreationInputType>;
  experiment: number;
  groupName: "sampleGroups" | "blankGroups";
}

interface AnalysisCreationProps {
  onCreate: (id: Id<"analyses">) => void;
}

const SampleGroupFieldArray: React.FC<SampleGroupFieldArrayProps> = ({
  form,
  experiment,
  groupName,
  options,
}) => {
  return (
    <div className="flex flex-col gap-2 items-start justify-start h-full">
      <FormLabel className="px-4 flex items-center justify-center gap-2">
        {groupName === "sampleGroups" ? "Sample Groups" : "Blank Groups"}
      </FormLabel>
      <MultiSelectCombobox
        options={options.map((option) => ({
          value: option,
          label: option,
        }))}
        onSelect={async (val: string) => {
          const currExperiment =
            form.getValues().config.experimentGroups[experiment];
          const otherGroup =
            groupName === "sampleGroups" ? "blankGroups" : "sampleGroups";

          if (currExperiment[otherGroup].includes(val)) {
            toast.error("Sample group and blank group cannot have same values");
            return;
          }

          if (currExperiment[groupName].includes(val)) {
            form.setValue(
              `config.experimentGroups.${experiment}.${groupName}`,
              currExperiment[groupName].filter((v) => v !== val)
            );
          } else {
            form.setValue(
              `config.experimentGroups.${experiment}.${groupName}`,
              [...currExperiment[groupName], val]
            );
          }
        }}
        selectedValues={
          form.watch(
            `config.experimentGroups.${experiment}.${groupName}`
          ) as string[]
        }
      />
    </div>
  );
};

export default function AnalysisCreation({ onCreate }: AnalysisCreationProps) {
  const form = useForm<AnalysisCreationInputType>({
    resolver: zodResolver(AnalysisCreationInputSchema),
    defaultValues: {
      config: {
        experimentGroups: [
          {
            name: "new sample 1",
            sampleGroups: [],
            blankGroups: [],
          },
        ],
        maxResponseThreshold: 1,
        minResponseRatio: 0.1,
        ms2SimilarityThreshold: 0.7,
        mzErrorThreshold: 0.01,
        rtTimeWindow: 0.02,
        correlationThreshold: 0.95,
      },
    },
  });
  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const triggerAnalysis = useAction(api.actions.triggerAnalysis);
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "config.experimentGroups",
  });
  const [currExperiment, setCurrExperiment] = useState(0);

  const allRawFiles = useQuery(api.rawFiles.getAllRawFiles, {});
  const allReactionDatabases = useQuery(
    api.reactions.getAllReactionDatabases,
    {}
  );

  const onSubmit = async (values: AnalysisCreationInputType) => {
    setIsSubmitting(true);
    const token = await getToken({ template: "convex" });
    try {
      const { id } = await triggerAnalysis({
        reactionDb: values.reactionDb,
        rawFile: values.rawFile,
        config: values.config,
        token: token || "",
      });
      onCreate(id);
    } catch (e) {
      toast.error(
        "Error occured while analyzing your data, please try again later"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl px-8 py-4 space-y-6 h-full flex flex-col justify-center rounded-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-6">
          <div className="flex items-center justify-between gap-8">
            <FormField
              control={form.control}
              name="rawFile"
              render={({ field: { onChange, value } }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-md">
                    <Badge variant="secondary">1</Badge> Choose your raw file
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
                    Select or{" "}
                    <RawFileCreation
                      onCreate={(id: Id<"rawFiles">) => {
                        onChange(id);
                      }}
                    />{" "}
                    a new raw file for analysis
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reactionDb"
              render={({ field: { onChange, value } }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-md">
                    <Badge variant="secondary">2</Badge> Choose your reaction
                    database
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
                        {allReactionDatabases?.length === 0 && (
                          <SelectItem key={"none"} disabled value="none">
                            {allReactionDatabases === undefined ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              "No reaction db created"
                            )}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Select or{" "}
                    <ReactionDbCreation
                      onCreate={(id: Id<"reactionDatabases">) => onChange(id)}
                    />{" "}
                    a new reaction database
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
          {form.watch("rawFile") && (
            <Accordion type="multiple" className="w-full">
              <AccordionItem
                value="experiment-groups"
                className="cursor-pointer"
              >
                <AccordionTrigger>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="secondary">3</Badge>Configure Experiment
                    Groups
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
                            <SelectValue placeholder="Raw File to be analyzed" />
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
                        Choose an experiment to configure or{" "}
                        <Button
                          type="button"
                          onClick={() => {
                            append({
                              name: `new sample ${fields.length + 1}`,
                              sampleGroups: [],
                              blankGroups: [],
                            });
                            setCurrExperiment(fields.length);
                          }}
                          variant="outline"
                          size="xs"
                          className="font-bold"
                        >
                          <span>✨ Create </span>
                        </Button>{" "}
                        a new experiment group
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
                          name={`config.experimentGroups.${currExperiment}.name`}
                          render={({ field: { onChange, value } }) => {
                            return (
                              <FormItem>
                                <FormLabel>Experiment Group Name</FormLabel>
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
                            )?.sampleColumns || []
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
                            )?.sampleColumns || []
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
                    Advanced Settings
                  </div>
                </AccordionTrigger>
                <AccordionContent className="flex gap-4 flex-col px-1">
                  <FormField
                    control={form.control}
                    name="config.maxResponseThreshold"
                    render={({ field: { onChange, value } }) => (
                      <FormItem>
                        <FormLabelWithTooltip
                          tooltip="Define the Minimum acceptable maximum response value for the compound
          in the dosed sample group. The compound&rsquo;s response must meet or
          exceed this threshold to be considered significant"
                        >
                          Maximum Response Threshold
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input
                            placeholder="1"
                            type="number"
                            defaultValue={1}
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
                    name="config.minResponseRatio"
                    render={({ field: { onChange, value } }) => (
                      <FormItem>
                        <FormLabelWithTooltip
                          tooltip="Set the threshold for the lowest acceptable ratio of the
                        compound&rsquo;s maximum response value in the dosed
                        sample group to that in the blank group. A ratio less
                        than this value indicates insufficient response."
                        >
                          Minimum Response Ratio
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
                          MS2 Similarity Filter Threshold
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.7"
                            min={0.5}
                            max={1}
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
                          Correlation Threshold
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
                    name="config.mzErrorThreshold"
                    render={({ field: { onChange, value } }) => (
                      <FormItem>
                        <FormLabelWithTooltip
                          tooltip="Set the maximum allowable ∆m/z error for matching
                          metabolite responses. A value within 0.01 ppm is
                          recommended for accurate matching."
                        >
                          ∆m/z Error Threshold (ppm)
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
                          ∆Rt Time Window (min)
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
          <ShimmerButton type="submit" className="hover:opacity-90 py-2 px-3">
            <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  Initiating analysis
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                "Start Analysis"
              )}
            </span>
          </ShimmerButton>
        </form>
      </Form>
    </div>
  );
}
