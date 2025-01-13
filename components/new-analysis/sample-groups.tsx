import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AnalysisCreationInputType } from "@/lib/utils";
import { CrossCircledIcon } from "@radix-ui/react-icons";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo } from "react";
import { Path, useFieldArray, useFormContext, useWatch } from "react-hook-form";
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

  // 使用 Path 类型来确保类型安全
  const bioSamplePath =
    bioSampleIndex !== undefined
      ? (`config.bioSamples.${bioSampleIndex}.${type}` as Path<AnalysisCreationInputType>)
      : undefined;

  const otherTypePath =
    bioSampleIndex !== undefined
      ? (`config.bioSamples.${bioSampleIndex}.${type === "sample" ? "blank" : "sample"}` as Path<AnalysisCreationInputType>)
      : undefined;

  const bioSampleValues = useWatch({
    control,
    name:
      bioSamplePath ||
      (`config.bioSamples.0.${type}` as Path<AnalysisCreationInputType>),
    defaultValue: [],
  }) as string[];

  const drugSampleValues = useWatch({
    control,
    name: "config.drugSample.groups" as Path<AnalysisCreationInputType>,
    defaultValue: [],
  }) as string[];

  const otherTypeValues = useWatch({
    control,
    name:
      otherTypePath ||
      (`config.bioSamples.0.${type === "sample" ? "blank" : "sample"}` as Path<AnalysisCreationInputType>),
    defaultValue: [],
  }) as string[];

  // Use useMemo to handle the actual values we want to use
  const currentValues = useMemo(() => {
    if (!bioSamplePath && type !== "drug") return [];
    return isBioSample ? bioSampleValues : drugSampleValues;
  }, [isBioSample, bioSampleValues, drugSampleValues, bioSamplePath, type]);

  const otherValues = useMemo(() => {
    if (!otherTypePath) return [];
    return isBioSample ? otherTypeValues : [];
  }, [isBioSample, otherTypeValues, otherTypePath]);

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
          `config.bioSamples.${bioSampleIndex}.${type}` as Path<AnalysisCreationInputType>,
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

        setValue(
          "config.drugSample.groups" as Path<AnalysisCreationInputType>,
          newGroups,
          {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          }
        );
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
  const { control, setValue, watch } =
    useFormContext<AnalysisCreationInputType>();

  const rawFileData = useQuery(api.rawFiles.get, { id });
  const sampleCols = useMemo(
    () => rawFileData?.sampleCols || [],
    [rawFileData?.sampleCols]
  );

  const {
    fields: bioSampleFields,
    append: appendBioSample,
    remove: removeBioSample,
  } = useFieldArray({
    control,
    name: "config.bioSamples",
  });

  useEffect(() => {
    if (enableDrugSample && sampleCols.length > 0) {
      // Get all used columns in bio samples
      const usedColumns =
        watch("config.bioSamples")?.flatMap((e) => [...e.sample, ...e.blank]) ||
        [];

      // Find the first available column
      const availableColumn = sampleCols.find(
        (col) => !usedColumns.includes(col)
      );

      if (availableColumn) {
        setValue(
          "config.drugSample",
          {
            name: "My drug sample",
            groups: [availableColumn],
          },
          {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          }
        );
      }
    }
  }, [enableDrugSample, sampleCols, setValue, watch]);

  return (
    <AccordionItem value="sample-groups">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">3</Badge> Sample Groups Configuration
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4">
        <div className="space-y-6 px-1">
          {bioSampleFields.map((field, index) => (
            <div
              key={field.id}
              className="group relative rounded-xl border border-border/40 bg-card transition-all hover:border-border/80"
            >
              <div className="absolute right-4 top-4">
                {index > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBioSample(index)}
                    className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <CrossCircledIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-medium text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <FormField
                    control={control}
                    name={`config.bioSamples.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            className="h-9 bg-transparent px-0 text-base font-medium border-0 border-b border-border/40 rounded-none hover:border-border/80 focus-visible:border-primary focus-visible:ring-0 transition-colors"
                            placeholder="Enter group name..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-[1fr,auto,1fr] items-start gap-4">
                  <div className="space-y-1">
                    <SampleGroupFieldArray
                      options={sampleCols}
                      bioSampleIndex={index}
                      type="sample"
                    />
                  </div>
                  <div className="flex h-full items-center justify-center pt-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      vs
                    </span>
                  </div>
                  <div className="space-y-1">
                    <SampleGroupFieldArray
                      options={sampleCols}
                      bioSampleIndex={index}
                      type="blank"
                    />
                  </div>
                </div>

                <SampleInfoForm index={index} />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                appendBioSample({
                  name: `Sample Group ${bioSampleFields.length + 1}`,
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
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Sample Group</span>
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
              <span className="text-sm text-muted-foreground">
                Enable Drug Sample
              </span>
            </div>
          </div>

          {enableDrugSample && (
            <div className="group relative rounded-xl border border-border/40 bg-card p-6 transition-all hover:border-border/80">
              <FormField
                control={control}
                name="config.drugSample.name"
                render={({ field }) => (
                  <FormItem className="mb-6">
                    <FormControl>
                      <Input
                        {...field}
                        className="h-9 bg-transparent px-0 text-base font-medium border-0 border-b border-border/40 rounded-none hover:border-border/80 focus-visible:border-primary focus-visible:ring-0 transition-colors"
                        placeholder="Enter drug sample name..."
                      />
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
