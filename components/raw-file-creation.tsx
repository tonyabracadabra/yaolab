import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FileType, RawFileCreationInputSchema } from "@/convex/schema";
import { useFileUpload } from "@/lib/utils";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormLabelWithTooltip } from "./form-label-tooltip";
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
  file: z.instanceof(File),
});
type RawFileCreationInput = z.infer<typeof LocalRawFileInputSchema>;

export function RawFileCreation({ onCreate }: RawFileCreationInterface) {
  const form = useForm<RawFileCreationInput>({
    defaultValues: {
      fileType: "MDial",
    },
  });
  const { handleUpload } = useFileUpload();
  const [open, setOpen] = useState(false);
  const createRawFile = useMutation(api.rawFiles.createRawFile);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onClose = () => {
    form.reset();
    setOpen(false);
    setIsSubmitting(false);
  };

  const onSubmit = async (values: RawFileCreationInput) => {
    setIsSubmitting(true);
    const { storageId } = await handleUpload(values.file);
    if (!storageId) {
      toast.error("Something went wrong while uploading your file, try again");
      return;
    }

    const { id } = await createRawFile({
      ...values,
      file: storageId,
    });

    onCreate(id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="xs" className="font-bold">
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
              name="file"
              render={({ field: { onChange, value } }) => {
                return (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <Input
                      onChange={(event) => {
                        const selectedFile =
                          event.target.files && event.target.files[0];
                        if (selectedFile) {
                          onChange(event.target.files && event.target.files[0]);
                          form.setValue("name", selectedFile.name);
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
              name="fileType"
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
                      {Object.values(FileType.Values).map((fileType) => (
                        <SelectItem
                          className="cursor-pointer hover:bg-slate-100"
                          key={fileType}
                          value={fileType}
                        >
                          {fileType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
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
