import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MSTool, RawFileCreationInputSchema } from "@/convex/schema";
import { readFirstLine, useFileUpload } from "@/lib/utils";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormLabelWithTooltip } from "./form-label-tooltip";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface RawFileCreationInterface {
  onCreate: (id: Id<"rawFiles">) => void;
}

const LocalRawFileInputSchema = RawFileCreationInputSchema.extend({
  mgf: z.instanceof(File),
  targetedIons: z.instanceof(File),
});
type RawFileCreationInput = z.infer<typeof LocalRawFileInputSchema>;

export function RawFileCreation({ onCreate }: RawFileCreationInterface) {
  const form = useForm<RawFileCreationInput>({
    defaultValues: {
      name: "My Raw File",
      tool: "MDial",
    },
  });
  const { handleUpload } = useFileUpload();
  const [open, setOpen] = useState(false);
  const createRawFile = useMutation(api.rawFiles.createRawFile);
  const [sampleColumns, setSampleColumns] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onClose = () => {
    form.reset();
    setOpen(false);
    setIsSubmitting(false);
    setSampleColumns([]);
  };

  const onSubmit = async (values: RawFileCreationInput) => {
    setIsSubmitting(true);
    try {
      const [{ storageId: mgfId }, { storageId: targetdIonsId }] =
        await Promise.all([
          handleUpload(values.mgf),
          handleUpload(values.targetedIons),
        ]);

      const { id } = await createRawFile({
        ...values,
        sampleColumns,
        mgf: mgfId,
        targetedIons: targetdIonsId,
      });
      onCreate(id);
      onClose();
    } catch (error) {
      toast.error("Something went wrong while uploading your file, try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSampleColumns = async (file: File) => {
    const columns = await readFirstLine(file);
    const tool = form.watch("tool");
    if (tool === "MDial") {
      return columns.slice(columns.indexOf("MS/MS spectrum") + 1);
    } else if (tool === "MZine") {
      return columns
        .filter((column) => column.includes(".raw Peak"))
        .map((column) => column.split(".")[0]);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          onClose();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="xs" className="font-bold text-primary">
          <span>✨ Create </span>
        </Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className="sm:max-w-[425px]"
      >
        <DialogHeader>
          <DialogTitle>Upload your raw file</DialogTitle>
          <DialogDescription>
            Once you upload your raw file, you will automatically select it for
            your next analysis
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col justify-center gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tool"
              defaultValue="MDial"
              render={({ field: { onChange, value } }) => (
                <FormItem>
                  <FormLabelWithTooltip tooltip="You can choose the raw file type here">
                    File Type
                  </FormLabelWithTooltip>
                  <Select onValueChange={onChange} defaultValue={value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="File Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(MSTool.Values).map((tool, i) => (
                        <SelectItem
                          className="cursor-pointer hover:bg-slate-100"
                          key={i}
                          value={tool}
                        >
                          {tool}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mgf"
              render={({ field: { onChange, value } }) => {
                return (
                  <FormItem>
                    <FormLabelWithTooltip
                      tooltip="Upload the MGF (Mascot Generic Format) file containing your mass spectrometry data. \
                    This file should include detailed spectral data such as mass-to-charge ratios (m/z) and ion intensities from MS/MS experiments."
                    >
                      MGF File
                    </FormLabelWithTooltip>
                    <Input
                      accept=".mgf"
                      onChange={async (event) => {
                        const selectedFile =
                          event.target.files && event.target.files[0];
                        if (selectedFile) {
                          onChange(event.target.files && event.target.files[0]);
                        }
                      }}
                      type="file"
                    />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="targetedIons"
              render={({ field: { onChange, value } }) => {
                return (
                  <FormItem>
                    <FormLabelWithTooltip
                      tooltip="Upload the file containing a list of target ions for analysis. \
                    This file should enumerate specific ions or fragments of interest, usually identified by their mass-to-charge ratios (m/z), \
                    which you intend to analyze or filter in your mass spectrometry data."
                    >
                      Ion list File
                    </FormLabelWithTooltip>
                    <Input
                      accept=".csv,.txt"
                      onChange={async (event) => {
                        const selectedFile =
                          event.target.files && event.target.files[0];
                        if (selectedFile) {
                          form.setValue("name", selectedFile.name);
                          try {
                            const cols =
                              (await getSampleColumns(selectedFile)) || [];
                            setSampleColumns(cols);
                            // if mzine, then replace its first line with the new columns
                            if (form.watch("tool") === "MZine") {
                              const file = await selectedFile.text();
                              const lines = file.split("\n");
                              lines[0] = cols.join(",");
                              const newFile = new File(
                                [lines.join("\n")],
                                selectedFile.name,
                                {
                                  type: selectedFile.type,
                                  lastModified: selectedFile.lastModified,
                                }
                              );
                              onChange(newFile);
                            } else {
                              onChange(selectedFile);
                            }
                          } catch (error) {
                            toast.error("Error processing the file");
                          }
                        }
                      }}
                      type="file"
                    />
                  </FormItem>
                );
              }}
            />
            <div className="flex gap-2 flex-col">
              <FormLabel>Sample Columns</FormLabel>
              <div className="flex items-center justify-center gap-2 flex-wrap max-h-[120px] overflow-auto">
                {sampleColumns.map((sampleName: string, index: number) => (
                  <Badge key={index}>{sampleName}</Badge>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    Uploading
                    <Loader2 className="animate-spin" />
                  </div>
                ) : (
                  "Upload and create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
