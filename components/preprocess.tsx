"use client";

import { Button } from "@/components/ui/button";
import * as z from "zod";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Controller,
  FieldValues,
  UseFormReturn,
  useFieldArray,
  useForm,
} from "react-hook-form";

const FormSchema = z.object({
  fileType: z.string(),
  file: z.any(),
  maxResponseThreshold: z.number(),
  minResponseRatio: z.number(),
  ms2SimilarityThreshold: z.number(),
  mzErrorThreshold: z.number(),
  rtTimeWindow: z.number(),
  experimentGroups: z.array(
    z.object({
      name: z.string(),
      sampleGroups: z.array(z.string()),
      blankGroups: z.array(z.string()),
    })
  ),
});

interface SampleGroupFieldArrayProps {
  control: UseFormReturn["control"];
  sampleIndex: number;
  groupName: "sampleGroups" | "blankGroups";
}

const SampleGroupFieldArray: React.FC<SampleGroupFieldArrayProps> = ({
  control,
  sampleIndex,
  groupName,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `experimentGroups.${sampleIndex}.${groupName}`,
  });

  return (
    <div className="flex flex-col gap-2 items-start justify-start h-full">
      <Button type="button" onClick={() => append({})}>
        Add to {groupName}
      </Button>
      <div className="flex flex-col max-h-[300px] overflow-scroll gap-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-3 gap-2">
            <Controller
              control={control}
              name={`experimentGroups.${sampleIndex}.${groupName}.${index}`}
              render={({ field }) => <Input {...field} />}
            />
            <Button type="button" onClick={() => remove(index)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Preprocess() {
  const form = useForm();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "experimentGroups",
  });

  // 2. Define a submit handler.
  function onSubmit(data: FieldValues) {
    // Cast the generic FieldValues to the specific type defined by the Zod schema

    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(data);
  }

  return (
    <div className="w-full max-w-3xl p-4 space-y-6 h-full overflow-auto shadow-lg rounded-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-6">
          <div className="flex gap-4 items-center justify-between w-full">
            <FormField
              control={form.control}
              name="fileType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="File Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="light">MZine</SelectItem>
                      <SelectItem value="dark">MSDial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    You can choose the raw file type here
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <Input type="file"></Input>
                  <FormDescription>
                    You can choose the raw file type here
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Configure Experiment Groups</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col justify-center gap-3">
                  {fields.map((sampleField, sampleIndex) => (
                    <div
                      key={sampleField.id}
                      className="flex flex-col gap-4 items-start"
                    >
                      <div className="flex items-center gap-4 justify-center">
                        <FormField
                          control={form.control}
                          name={`samples.${sampleIndex}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Experiment Group Name</FormLabel>
                              <div className="flex items-center gap-4 justify-center w-full">
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <Button
                                  type="button"
                                  className="w-full whitespace-nowrap"
                                  onClick={() => remove(sampleIndex)}
                                >
                                  Remove Experiment Group
                                </Button>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-between gap-4">
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
                  ))}

                  <Button
                    type="button"
                    onClick={() =>
                      append({ name: "", sampleGroups: [], blankGroups: [] })
                    }
                  >
                    Add New Experiment Group
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Advanced Settings</AccordionTrigger>
              <AccordionContent>
                <FormField
                  control={form.control}
                  name="maxResponseThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Response Threshold</FormLabel>
                      <FormControl>
                        <Input placeholder="shadcn" {...field} />
                      </FormControl>
                      <FormDescription>
                        Define the Minimum acceptable maximum response value for
                        the compound in the dosed sample group. The
                        compound&rsquo;s response must meet or exceed this
                        threshold to be considered significant
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minResponseRatio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Response Ratio</FormLabel>
                      <FormControl>
                        <Input placeholder="shadcn" {...field} />
                      </FormControl>
                      <FormDescription>
                        Set the threshold for the lowest acceptable ratio of the
                        compound&rsquo;s maximum response value in the dosed
                        sample group to that in the blank group. A ratio less
                        than this value indicates insufficient response.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ms2SimilarityThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MS2 Similarity Filter Threshold</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.7"
                          defaultValue={0.7}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Set the threshold for MS2 similarity filtering. A
                        default value of 0.7 is recommended.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4 items-center justify-between w-full">
                  <FormField
                    control={form.control}
                    name="mzErrorThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>∆m/z Error Threshold</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            defaultValue={10}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Set the maximum allowable ∆m/z error for matching
                          metabolite responses. A value within 10ppm is
                          recommended for accurate matching.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rtTimeWindow"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>∆Rt Time Window (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={"0.02"}
                            defaultValue={0.02}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Define the time window in minutes (∆Rt) for redundancy
                          checks. A default value of 0.02min helps in
                          distinguishing redundant entries effectively.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  );
}
