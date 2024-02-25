import { AnalysisCreationInputType } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { UseFormReturn } from "react-hook-form";
import { FormLabelWithTooltip } from "../form-label-tooltip";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { FormControl, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";

interface AdvancedSettingInterface {
  form: UseFormReturn<AnalysisCreationInputType>;
}

export function AdvancedSetting({ form }: AdvancedSettingInterface) {
  const t = useTranslations("New");

  return (
    <AccordionItem value="advanced">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">4</Badge>
          {t("advanced-settings")}
        </div>
      </AccordionTrigger>
      <AccordionContent className="flex gap-4 px-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("target-ion-filtering")}
            </CardTitle>
            <CardDescription className="text-md">
              {t("target-ion-filtering-desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
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
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("molecular-network-construction")}
            </CardTitle>
            <CardDescription className="text-md">
              {t("molecular-network-construction-desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("redundancy-identification")}
            </CardTitle>
            <CardDescription className="text-md">
              {t("redundancy-identification-desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
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
          </CardContent>
        </Card>
      </AccordionContent>
    </AccordionItem>
  );
}
