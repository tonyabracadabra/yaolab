import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AnalysisCreationInputType } from "@/lib/utils";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { MultiSelectCombobox } from "../multiselect-combobox";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { SampleInfoForm } from "./sample-info-form";

interface SampleGroupFieldArrayProps {
  options: string[];
  type: "sample" | "blank" | "drug";
  bioSampleIndex?: number;
}

const SampleGroupFieldArray = ({
  bioSampleIndex,
  type,
  options,
}: SampleGroupFieldArrayProps): JSX.Element => {
  const t = useTranslations("New");
  const { setValue, control } = useFormContext<AnalysisCreationInputType>();
  const isBioSample = type !== "drug" && bioSampleIndex !== undefined;

  // Use useWatch instead of watch for better reactivity
  const currentValues = isBioSample
    ? (useWatch({
        control,
        name: `config.bioSamples.${bioSampleIndex}.${type}` as const,
        defaultValue: [],
      }) as string[])
    : (useWatch({
        control,
        name: "config.drugSample.groups" as const,
        defaultValue: [],
      }) as string[]);

  const otherValues = isBioSample
    ? (useWatch({
        control,
        name: `config.bioSamples.${bioSampleIndex}.${
          type === "sample" ? "blank" : "sample"
        }` as const,
        defaultValue: [],
      }) as string[])
    : [];

  const handleSelect = useCallback(
    (value: string) => {
      if (isBioSample && bioSampleIndex !== undefined) {
        if (otherValues.includes(value)) {
          toast.error("Sample group and blank group cannot have same values");
          return;
        }

        const newValues = currentValues.includes(value)
          ? currentValues.filter((v: string) => v !== value)
          : [...currentValues, value];

        setValue(
          `config.bioSamples.${bioSampleIndex}.${type}` as const,
          newValues,
          {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          }
        );
      } else {
        const newGroups = currentValues.includes(value)
          ? currentValues.filter((v: string) => v !== value)
          : [...currentValues, value];

        setValue("config.drugSample.groups" as const, newGroups, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
    },
    [isBioSample, bioSampleIndex, type, setValue, currentValues, otherValues]
  );

  return (
    <div className="flex flex-col gap-2 items-start justify-start h-full">
      <FormLabel className="flex items-center justify-center gap-2">
        {type === "sample" && t("sample-groups")}
        {type === "blank" && t("blank-groups")}
        {type === "drug" && t("groups")}
      </FormLabel>
      <MultiSelectCombobox
        options={options.map((option) => ({
          value: option,
          label: option,
        }))}
        onSelect={handleSelect}
        selectedValues={currentValues}
        otherGroupSelectedValues={otherValues}
      />
    </div>
  );
};

interface SampleGroupsInterface {
  id: Id<"rawFiles">;
  enableDrugSample: boolean;
  setEnableDrugSample: (value: boolean) => void;
}

export function SampleGroups({
  id,
  enableDrugSample,
  setEnableDrugSample,
}: SampleGroupsInterface) {
  const t = useTranslations("New");
  const { control, setValue, watch } =
    useFormContext<AnalysisCreationInputType>();

  const sampleCols =
    useQuery(api.rawFiles.get, {
      id,
    })?.sampleCols || [];

  const {
    fields: bioSampleFields,
    append: appendBioSample,
    remove: removeBioSample,
  } = useFieldArray({
    control,
    name: "config.bioSamples",
  });

  return (
    <AccordionItem value="sample-groups">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">3</Badge> Sample Groups Configuration
        </div>
      </AccordionTrigger>
      <AccordionContent className="dark:bg-gray-900/80 bg-gray-100/80 rounded-xl p-4">
        <div className="space-y-6">
          {bioSampleFields.map((field, index) => (
            <div key={field.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Sample Group {index + 1}
                </h3>
                {index > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeBioSample(index)}
                  >
                    Remove Group
                  </Button>
                )}
              </div>

              <FormField
                control={control}
                name={`config.bioSamples.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-4 mt-4">
                <SampleGroupFieldArray
                  options={sampleCols}
                  bioSampleIndex={index}
                  type="sample"
                />
                <div className="flex h-full items-center justify-center translate-y-2">
                  vs
                </div>
                <SampleGroupFieldArray
                  options={sampleCols}
                  bioSampleIndex={index}
                  type="blank"
                />
              </div>
              <SampleInfoForm index={index} />
            </div>
          ))}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                appendBioSample({
                  name: `new sample ${bioSampleFields.length + 1}`,
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
                });
                toast.success(
                  "New sample group added, please configure sample groups and blank groups"
                );
              }}
            >
              Add Sample Group
            </Button>

            <div className="flex items-center gap-2">
              <Switch
                checked={enableDrugSample}
                onCheckedChange={(value) => {
                  setEnableDrugSample(value);
                  if (!value) {
                    setValue("config.drugSample", undefined);
                  } else {
                    setValue("config.drugSample", {
                      name: "My drug sample",
                      groups: [],
                    });
                  }
                }}
              />
              <span className="text-sm">Enable Drug Sample</span>
            </div>
          </div>

          {enableDrugSample && (
            <div className="space-y-4 mt-6 p-4 border rounded-lg">
              <FormField
                control={control}
                name="config.drugSample.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drug Sample Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <SampleGroupFieldArray
                options={sampleCols.filter(
                  (col) =>
                    !watch("config.bioSamples")
                      ?.flatMap((e) => e.sample)
                      .includes(col) &&
                    !watch("config.bioSamples")
                      ?.flatMap((e) => e.blank)
                      .includes(col)
                )}
                type="drug"
              />
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
