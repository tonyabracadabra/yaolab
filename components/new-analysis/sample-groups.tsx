import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AnalysisCreationInputType } from "@/lib/utils";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { MultiSelectCombobox } from "../multiselect-combobox";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
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
  form: UseFormReturn<AnalysisCreationInputType>;
  type: "sample" | "blank" | "drug";
  bioSampleIndex?: number;
}

const SampleGroupFieldArray: React.FC<SampleGroupFieldArrayProps> = ({
  form,
  bioSampleIndex,
  type,
  options,
}) => {
  const t = useTranslations("New");
  const isBioSample = type !== "drug" && bioSampleIndex !== undefined;

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
        onSelect={async (val: string) => {
          if (isBioSample) {
            const currBioSample =
              form.getValues().config.bioSamples[bioSampleIndex];
            const other = type === "sample" ? "blank" : "sample";

            if (currBioSample[other].includes(val)) {
              toast.error(
                "Sample group and blank group cannot have same values"
              );
              return;
            }

            if (currBioSample[type].includes(val)) {
              form.setValue(
                `config.bioSamples.${bioSampleIndex}.${type}`,
                currBioSample[type].filter((v) => v !== val)
              );
            } else {
              form.setValue(`config.bioSamples.${bioSampleIndex}.${type}`, [
                ...currBioSample[type],
                val,
              ]);
            }
          } else {
            const groups = form.getValues().config.drugSample?.groups || [];
            if (groups.includes(val)) {
              form.setValue(
                `config.drugSample.groups`,
                groups.filter((v) => v !== val)
              );
            } else {
              form.setValue(`config.drugSample.groups`, [...groups, val]);
            }
          }
        }}
        selectedValues={
          isBioSample
            ? form.watch(`config.bioSamples.${bioSampleIndex}.${type}`) || []
            : form.watch(`config.drugSample.groups`) || []
        }
        otherGroupSelectedValues={
          isBioSample
            ? form.watch(
                `config.bioSamples.${bioSampleIndex}.${
                  type === "sample" ? "blank" : "sample"
                }`
              ) || []
            : []
        }
      />
    </div>
  );
};

interface SampleGroupsInterface {
  form: UseFormReturn<AnalysisCreationInputType>;
  enableDrugSample: boolean;
  setEnableDrugSample: (value: boolean) => void;
  id: Id<"rawFiles">;
}

export function SampleGroups({
  form,
  enableDrugSample,
  setEnableDrugSample,
  id,
}: SampleGroupsInterface) {
  const t = useTranslations("New");
  const samleCols =
    useQuery(api.rawFiles.get, {
      id,
    })?.sampleCols || [];

  const {
    fields: bioSampleFields,
    append: appendBioSample,
    remove: removeBioSample,
  } = useFieldArray({
    control: form.control,
    name: "config.bioSamples",
  });

  return (
    <AccordionItem value="sample-groups">
      <AccordionTrigger className="hover:no-underline">
        Sample Groups Configuration
      </AccordionTrigger>
      <AccordionContent>
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
                control={form.control}
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

              <SampleInfoForm form={form} index={index} />

              <div className="flex items-center justify-between gap-4 mt-4">
                <SampleGroupFieldArray
                  options={samleCols}
                  form={form}
                  bioSampleIndex={index}
                  type="sample"
                />
                <div className="flex h-full items-center justify-center">
                  vs
                </div>
                <SampleGroupFieldArray
                  options={samleCols}
                  form={form}
                  bioSampleIndex={index}
                  type="blank"
                />
              </div>
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
                    form.setValue("config.drugSample", undefined);
                  } else {
                    form.setValue("config.drugSample", {
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
                control={form.control}
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
                options={samleCols.filter(
                  (col) =>
                    !form
                      .watch("config.bioSamples")
                      ?.flatMap((e) => e.sample)
                      .includes(col) &&
                    !form
                      .watch("config.bioSamples")
                      ?.flatMap((e) => e.blank)
                      .includes(col)
                )}
                form={form}
                type="drug"
              />
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
