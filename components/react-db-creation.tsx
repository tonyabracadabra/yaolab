import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useFileUpload } from "@/lib/utils";
import { AccordionItem, AccordionTrigger } from "@radix-ui/react-accordion";
import { useMutation } from "convex/react";
import { Loader2, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Control, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Accordion, AccordionContent } from "./ui/accordion";
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
import { Form, FormField, FormItem, FormLabel } from "./ui/form";
import { Input } from "./ui/input";

type ReactionDatabase = Doc<"reactionDatabases">;
type CustomReaction = ReactionDatabase["customReactions"][0];
type LocalReactionDb = {
  file: File;
  name: string;
  customReactions: CustomReaction[];
};

const CustomReactionFieldArray = ({
  control,
}: {
  control: Control<LocalReactionDb>;
}) => {
  const { fields, append, remove } = useFieldArray<LocalReactionDb>({
    control,
    name: "customReactions",
  });

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="custom">
        <AccordionTrigger className="text-sm">
          Custom Reactions
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col">
            <Plus
              onClick={() => {
                append({
                  formulaChange: "",
                  reactionDescription: "",
                });
              }}
            />
            <div className="flex flex-col overflow-scroll gap-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center space-x-3 gap-2"
                >
                  <FormField
                    control={control}
                    name={`customReactions.${index}`}
                    render={({ field }) => (
                      <div className="flex items-center justify-center gap-2">
                        <FormItem>
                          <FormLabel>Formula Change</FormLabel>
                          <Input
                            defaultValue=""
                            value={field.value.formulaChange}
                            onChange={field.onChange}
                          />
                        </FormItem>
                        <FormItem>
                          <FormLabel>Reaction Description</FormLabel>
                          <Input
                            defaultValue=""
                            value={field.value.reactionDescription}
                            onChange={field.onChange}
                          />
                        </FormItem>
                      </div>
                    )}
                  />
                  <Button
                    className="w-6 h-4 p-0"
                    type="button"
                    variant="outline"
                    onClick={() => remove(index)}
                  >
                    <Minus size={12} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

interface ReactionDbCreationInterface {
  onCreate: (id: Id<"reactionDatabases">) => void;
}

export function ReactionDbCreation({ onCreate }: ReactionDbCreationInterface) {
  const form = useForm<LocalReactionDb>();
  const [open, setOpen] = useState(false);
  const { handleUpload } = useFileUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createReactionDatabase = useMutation(
    api.reactions.createReactionDatabase
  );

  const onClose = () => {
    form.reset();
    setOpen(false);
    setIsSubmitting(false);
  };

  const onSubmit = async (values: LocalReactionDb) => {
    setIsSubmitting(true);
    const { storageId } = await handleUpload(values.file);
    if (!storageId) {
      toast.error("Something went wrong while uploading your file, try again");
      return;
    }

    const { id } = await createReactionDatabase({
      name: values.name,
      file: storageId,
      customReactions: values.customReactions,
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
          <DialogTitle>Upload your reactions database</DialogTitle>
          <DialogDescription>
            Once you upload your reaction database file, you will automatically
            select it for your next analysis
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange } }) => {
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
                  <Input type="text" {...field} />
                </FormItem>
              )}
            />
            <CustomReactionFieldArray control={form.control} />
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
