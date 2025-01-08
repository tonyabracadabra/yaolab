import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AnalysisCreationInputType } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";

interface SampleInfoFormProps {
  form: UseFormReturn<AnalysisCreationInputType>;
  index: number;
}

export function SampleInfoForm({ form, index }: SampleInfoFormProps) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
      <FormField
        control={form.control}
        name={`config.bioSamples.${index}.metadata.source`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sample Source</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Blood, Tissue, Cell culture"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`config.bioSamples.${index}.metadata.species`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Species</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Human, Mouse, Rat" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`config.bioSamples.${index}.metadata.gender`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gender</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`config.bioSamples.${index}.metadata.age`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Age</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="Age"
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
            <FormLabel>Disease State</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Healthy, Diabetic, Cancer" {...field} />
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
            <FormLabel>Additional Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any additional information about the sample"
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
