import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MSTool, RawFileCreationInputSchema } from "@/convex/schema";
import { useFileUpload } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useAction, useMutation } from "convex/react";
import { CheckCircle2Icon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormLabelWithTooltip } from "../../form-label-tooltip";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Checkbox } from "../../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../../ui/form";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

interface RawFileCreationInterface {
  onCreate: (id: Id<"rawFiles">) => void;
}

const LocalRawFileInputSchema = RawFileCreationInputSchema.extend({
  mgf: z.instanceof(File),
  targetedIons: z.instanceof(File),
});
type RawFileCreationInput = z.infer<typeof LocalRawFileInputSchema>;

export function RawFileCreationDialog({ onCreate }: RawFileCreationInterface) {
  const form = useForm<RawFileCreationInput>({
    defaultValues: {
      name: "My Raw File",
      tool: "MSDial",
    },
  });
  const t = useTranslations("New");
  const { handleUpload } = useFileUpload();
  const preprocessIons = useAction(api.actions.preprocessIons);
  const [open, setOpen] = useState(false);
  const createRawFile = useMutation(api.rawFiles.create);
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const [checked, setChecked] = useState(false);
  const { getToken } = useAuth();

  const onClose = () => {
    form.reset();
    setOpen(false);
    setStatus("idle");
  };

  const onSubmit = async () => {
    if (!checked) {
      toast.error(
        "You need to accept the terms and conditions to upload files"
      );
      return;
    }

    const values = form.getValues();
    setStatus("processing");
    try {
      const [{ storageId: mgfId }, { storageId: targetedIonsId }] =
        await Promise.all([
          handleUpload({
            file: values.mgf,
            maxFileSize: 50,
            completeMsg: "MGF file uploaded successfully",
          }),
          handleUpload({
            file: values.targetedIons,
            maxFileSize: 50,
            completeMsg: "Targeted Ions file uploaded successfully",
          }),
        ]);

      const token = await getToken({ template: "convex", skipCache: true });
      if (!token) {
        toast.error("You need to be logged in to upload files");
        return;
      }

      const { storageId: processedId, sampleCols } = await preprocessIons({
        targetedIons: targetedIonsId,
        tool: values.tool,
        token,
      });

      setStatus("done");
      const { id } = await createRawFile({
        ...values,
        sampleCols,
        mgf: mgfId,
        targetedIons: processedId,
      });

      toast.success(
        `Raw files created successfully, with sample columns: ${sampleCols}!`
      );
      onCreate(id);
      onClose();
    } catch (error: unknown) {
      let errorMessage =
        "Something went wrong while uploading your file, try again";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      toast.error(errorMessage);
    } finally {
      setStatus("idle");
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
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="font-bold text-primary"
        >
          <span>✨ {t("create")}</span>
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
          <form className="flex flex-col justify-center gap-4">
            <div className="flex items-center justify-center gap-4">
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
                name="desc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="tool"
              defaultValue="MSDial"
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
                        <SelectItem key={i} value={tool}>
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
              render={({ field: { onChange } }) => {
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
                      accept={form.watch("tool") === "MSDial" ? ".txt" : ".csv"}
                      onChange={async (event) => {
                        const selectedFile =
                          event.target.files && event.target.files[0];
                        if (selectedFile) {
                          onChange(selectedFile);
                          form.setValue("name", selectedFile.name);
                        }
                      }}
                      type="file"
                    />
                  </FormItem>
                );
              }}
            />

            <DialogFooter className="flex items-center justify-between gap-6">
              <Card className="p-4 flex flex-col gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={checked}
                    onCheckedChange={(v) => setChecked(v as boolean)}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Accept terms and conditions
                  </label>
                </div>
                <FormDescription>
                  By checking the box, you agree to our terms and conditions to
                  upload your files and share your data with us
                </FormDescription>
                <div className="flex flex-row-reverse px-4">
                  <Button type="button" onClick={onSubmit}>
                    {status === "processing" && (
                      <div className="flex items-center gap-2">
                        Preprocessing your files
                        <Loader2 className="animate-spin" />
                      </div>
                    )}
                    {status === "done" && (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2Icon size={16} />
                        Done
                      </div>
                    )}
                    {status === "idle" && "Upload"}
                  </Button>
                </div>
              </Card>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
