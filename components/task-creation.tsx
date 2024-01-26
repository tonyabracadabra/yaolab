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
import { TaskCreationInputSchema } from "@/convex/schema";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Control, Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Id } from "../convex/_generated/dataModel";
import { FormLabelWithTooltip } from "./form-label-tooltip";
import ShimmerButton from "./magicui/shimmer-button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type TaskCreationInputType = z.infer<typeof TaskCreationInputSchema>;

interface SampleGroupFieldArrayProps {
  control: Control<TaskCreationInputType>;
  sampleIndex: number;
  groupName: "sampleGroups" | "blankGroups";
}

interface TaskCreationProps {
  onCreate: (id: Id<"tasks">) => void;
}

const SampleGroupFieldArray: React.FC<SampleGroupFieldArrayProps> = ({
  control,
  sampleIndex,
  groupName,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    // @ts-ignore
    name: `experimentGroups.${sampleIndex}.${groupName}`,
  });

  return (
    <div className="flex flex-col gap-2 items-start justify-start h-full">
      <div className="px-4 flex items-center justify-center gap-2">
        {groupName === "sampleGroups" ? "Sample Groups" : "Blank Groups"}
        <Button
          className="w-6 h-6 p-0"
          type="button"
          variant="outline"
          // @ts-ignore
          onClick={() => append({ value: "" })}
        >
          <Plus size={12} />
        </Button>
      </div>
      <div className="flex p-2 flex-col max-h-[300px] overflow-scroll gap-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-3 gap-2">
            <Controller
              control={control}
              name={`config.experimentGroups.${sampleIndex}.${groupName}.${index}`}
              render={({ field }) => (
                <div>
                  <Input
                    defaultValue=""
                    // @ts-ignore
                    value={field.value.value}
                    onChange={field.onChange}
                  />
                </div>
              )}
            />
            <Button
              className="w-6 h-4 p-0"
              type="button"
              variant="outline"
              onClick={() => remove(index)}
            >
              <Minus size={12} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function TaskCreation({ onCreate }: TaskCreationProps) {
  const form = useForm<TaskCreationInputType>({
    resolver: zodResolver(TaskCreationInputSchema),
    defaultValues: {
      config: {
        experimentGroups: [
          {
            name: "new sample 1",
            sampleGroups: ["a"],
            blankGroups: ["a"],
          },
        ],
        maxResponseThreshold: 1,
        minResponseRatio: 0.1,
        ms2SimilarityThreshold: 0.7,
        mzErrorThreshold: 10,
        rtTimeWindow: 0.02,
      },
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createTask = useMutation(api.tasks.createTask);
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "config.experimentGroups",
  });

  const allRawFiles = useQuery(api.rawFiles.getAllRawFiles, {});
  const allReactionDatabases = useQuery(
    api.reactions.getAllReactionDatabases,
    {}
  );

  const onSubmit = async (values: TaskCreationInputType) => {
    setIsSubmitting(true);
    const { id } = await createTask({
      reactionDb: values.reactionDb,
      rawFile: values.rawFile,
      config: values.config,
    });
    onCreate(id);
  };

  const watchedRawFile = form.watch("rawFile");
  useEffect(() => {
    console.log("Raw file value:", watchedRawFile);
  }, [watchedRawFile]);

  return (
    <div className="w-full max-w-4xl p-4 space-y-6 h-full items-center flex flex-col justify-center rounded-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-6">
          <div className="flex items-center justify-between gap-4">
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
                        console.log("nnnnnn raw", id);
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
          <Accordion type="multiple">
            <AccordionItem value="experiment-groups">
              <AccordionTrigger>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary">3</Badge>Configure Experiment
                  Groups
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Tabs defaultValue="account" className="w-full">
                  <TabsList className="overflow-x-scroll overflow-y-hidden">
                    {fields.map((sampleField, sampleIndex) => (
                      <TabsTrigger key={sampleIndex} value={sampleField.name}>
                        {sampleField.name}
                      </TabsTrigger>
                    ))}
                    <button
                      type="button"
                      className="hover:bg-slate-50 p-4 rounded-md"
                      onClick={() =>
                        append({
                          name: `new sample ${fields.length + 1}`,
                          sampleGroups: ["a"],
                          blankGroups: ["a"],
                        })
                      }
                    >
                      <Plus size={12} />
                    </button>
                  </TabsList>
                  {fields.map((sampleField, sampleIndex) => (
                    <TabsContent key={sampleIndex} value={sampleField.name}>
                      <div
                        key={sampleField.id}
                        className="flex flex-col gap-4 items-start w-full"
                      >
                        <div className="flex px-2 items-center gap-4 justify-center">
                          <FormField
                            control={form.control}
                            name={`config.experimentGroups.${sampleIndex}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Experiment Group Name</FormLabel>
                                <div className="flex items-center gap-4 justify-center w-full">
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <Button
                                    type="button"
                                    className="w-8 h-6 p-0"
                                    variant="outline"
                                    onClick={() => {
                                      if (fields.length > 1) {
                                        remove(sampleIndex);
                                      } else {
                                        toast.error(
                                          "You need to have at least one sample group"
                                        );
                                      }
                                    }}
                                  >
                                    <Minus size={12} />
                                  </Button>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-between w-full gap-4">
                          {/* Sample Groups */}
                          <SampleGroupFieldArray
                            control={form.control}
                            sampleIndex={sampleIndex}
                            groupName="sampleGroups"
                          />
                          {/* Blank Groups */}

                          <SampleGroupFieldArray
                            control={form.control}
                            sampleIndex={sampleIndex}
                            groupName="blankGroups"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
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
                        tooltip="Set the threshold for MS2 similarity filtering. A
                        default value of 0.7 is recommended."
                      >
                        MS2 Similarity Filter Threshold
                      </FormLabelWithTooltip>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.7"
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
                          metabolite responses. A value within 10ppm is
                          recommended for accurate matching."
                      >
                        ∆m/z Error Threshold
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
          <ShimmerButton type="submit" className="hover:opacity-90 py-2 px-3">
            <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  Uploading
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
