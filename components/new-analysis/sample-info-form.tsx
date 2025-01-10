import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AnalysisCreationInputType } from "@/lib/utils";
import { Beaker, Brain, FileText, Heart } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface SampleInfoFormProps {
  form: UseFormReturn<AnalysisCreationInputType>;
  index: number;
}

export function SampleInfoForm({ form, index }: SampleInfoFormProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="sample-info" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:no-underline [&[data-state=open]>div>div]:text-primary">
          <div className="flex items-center gap-4">
            <FormField
              control={form.control}
              name={`config.bioSamples.${index}.metadata.source`}
              render={({ field }) => (
                <FormItem className="flex-1 flex-col flex items-start justify-start">
                  <FormLabel className="text-sm px-2 font-medium text-muted-foreground">
                    Sample {index + 1} Source
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Blood, Tissue, Cell culture"
                      className="h-9"
                      {...field}
                      onClick={(e) => e.stopPropagation()}
                      type="text"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-4 mt-2">
            <FormField
              control={form.control}
              name={`config.bioSamples.${index}.metadata.species`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Species
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Human, Mouse, Rat"
                      className="h-9"
                      {...field}
                      type="text"
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
                  <FormLabel className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
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
                  <FormLabel className="text-sm text-muted-foreground flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Disease State
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Healthy, Diabetic, Cancer"
                      className="h-9"
                      {...field}
                      type="text"
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
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground flex items-center gap-2">
                    <Beaker className="h-4 w-4" />
                    Additional Notes
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Any additional information"
                      className="h-9"
                      {...field}
                      type="text"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
