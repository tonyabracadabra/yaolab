import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AnalysisCreationInputType } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";

interface SampleInfoFormProps {
  form: UseFormReturn<AnalysisCreationInputType>;
  index: number;
}

export function SampleInfoForm({ form, index }: SampleInfoFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-background">
        <FormField
          control={form.control}
          name={`config.bioSamples.${index}.metadata.source`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="text-sm font-medium text-muted-foreground">
                Sample {index + 1} Source
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Blood, Tissue, Cell culture"
                  className="h-9"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          variant="ghost"
          size="sm"
          className="mt-6"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </Button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-background/50">
          <FormField
            control={form.control}
            name={`config.bioSamples.${index}.metadata.species`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-muted-foreground">
                  Species
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Human, Mouse, Rat"
                    className="h-9"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`config.bioSamples.${index}.metadata.age`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-muted-foreground">
                  Age
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Age"
                    className="h-9"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`config.bioSamples.${index}.metadata.diseaseState`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-muted-foreground">
                  Disease State
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Healthy, Diabetic, Cancer"
                    className="h-9"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`config.bioSamples.${index}.metadata.notes`}
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel className="text-sm text-muted-foreground">
                  Additional Notes
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Any additional information about the sample"
                    className="h-9"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}
