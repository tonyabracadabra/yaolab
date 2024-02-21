import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AnalysisCreationInputType } from "@/lib/utils";
import { useQuery } from "convex/react";
import { Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { MultiSelectCombobox } from "../multiselect-combobox";
import { Switch } from "../switch";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

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
  const [currBioSample, setCurrBioSample] = useState(0);

  return (
    <AccordionItem value="experiment-groups" className="cursor-pointer">
      <AccordionTrigger>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary">3</Badge> {t("experiment-groups")}
        </div>
      </AccordionTrigger>
      <AccordionContent className="flex items-start gap-8">
        <Card>
          <CardHeader className="flex">
            <div className="flex justify-between items-start gap-4">
              <div>
                <CardTitle className="text-lg">Biological samples</CardTitle>
                <CardDescription className="text-md">
                  Configure the biological samples and blank groups
                </CardDescription>
              </div>
              <div className="flex w-[250px] flex-col gap-4 h-full justify-between">
                <div className="flex items-center gap-2 justify-center">
                  <Select
                    onValueChange={(v) => {
                      if (!v) return;
                      setCurrBioSample(+v);
                    }}
                    value={currBioSample.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose raw file to be analyzed" />
                    </SelectTrigger>
                    <SelectContent>
                      {bioSampleFields?.map((f, i) => {
                        return (
                          <SelectItem key={i} value={i.toString()}>
                            {form.watch(`config.bioSamples.${i}.name`) ||
                              `Sample ${i + 1}`}
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
                          appendBioSample({
                            name: `new sample ${bioSampleFields.length + 1}`,
                            sample: [],
                            blank: [],
                          });
                          setCurrBioSample(bioSampleFields.length);
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 w-full">
              <div className="flex w-full relative flex-col gap-4 bg-slate-100 dark:bg-slate-900 p-6 rounded-md">
                <Button
                  type="button"
                  className="absolute right-[8px] top-[8px] w-8 h-6 p-0 bg-red-50 border-0 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800"
                  variant="outline"
                  onClick={() => {
                    if (bioSampleFields.length > 1) {
                      setCurrBioSample(0);
                      removeBioSample(currBioSample);
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
                    key={`experiment-group-name-${currBioSample}`} // Adding a unique key
                    control={form.control}
                    name={`config.bioSamples.${currBioSample}.name`}
                    render={({ field: { onChange, value } }) => {
                      return (
                        <FormItem>
                          <FormLabel>{t("experiment-group-name")}</FormLabel>
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
                <div className="flex items-center justify-between gap-4">
                  <SampleGroupFieldArray
                    options={samleCols}
                    form={form}
                    bioSampleIndex={currBioSample}
                    type="sample"
                  />
                  <div className="flex h-full items-center justify-center mt-5">
                    vs
                  </div>
                  <SampleGroupFieldArray
                    options={samleCols}
                    form={form}
                    bioSampleIndex={currBioSample}
                    type="blank"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col">
                <CardTitle className="text-lg">Drug Sample</CardTitle>
                <CardDescription className="text-md">
                  Optionally configure Drug sample data can help in further
                  filtering the endogenous metabolites
                </CardDescription>
              </div>
              <div>
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
              </div>
            </div>
          </CardHeader>
          {enableDrugSample && (
            <CardContent className="flex flex-col gap-6">
              <FormField
                control={form.control}
                name="config.drugSample.name"
                render={({ field: { onChange, value } }) => (
                  <FormItem>
                    <FormLabel>{t("drug-sample-name")}</FormLabel>
                    <FormControl>
                      <Input value={value} onChange={onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <SampleGroupFieldArray
                options={
                  samleCols.filter(
                    (col) =>
                      !form
                        .watch("config.bioSamples")
                        ?.flatMap((e) => e.sample)
                        .includes(col)
                  ) || []
                }
                form={form}
                type="drug"
              />
            </CardContent>
          )}
        </Card>
      </AccordionContent>
    </AccordionItem>
  );
}
