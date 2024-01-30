import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CustomReactionSchema, ReactionDatabaseSchema } from "@/convex/schema";
import { readFirstLine, useFileUpload } from "@/lib/utils";
import { useAction, useMutation } from "convex/react";
import { Loader2, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { Control, useFieldArray, useForm } from "react-hook-form";
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
import { Form, FormField, FormItem, FormLabel } from "./ui/form";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

const LocalReactionDbInputSchema = ReactionDatabaseSchema.extend({
  file: z.instanceof(File),
});
type LocalReactionDbInput = z.infer<typeof LocalReactionDbInputSchema>;
type CustomReaction = z.infer<typeof CustomReactionSchema>;

const CustomReactionFieldArray = ({
  control,
}: {
  control: Control<LocalReactionDbInput>;
}) => {
  const { fields, append, remove } = useFieldArray<LocalReactionDbInput>({
    control,
    name: "customReactions",
  });
  const [popoverOpen, setPopoverOpen] = useState(false);

  interface ReactionFormInterface {
    onReactionAdd: (reaction: CustomReaction) => void;
  }

  const ReactionForm = ({ onReactionAdd }: ReactionFormInterface) => {
    const calculateMass = useAction(api.actions.calculateMass);
    const [formula, setFormula] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    return (
      <div className="flex flex-col justify-center gap-2">
        <FormItem>
          <FormLabel>
            Formula Change{" "}
            <span className="text-sm text-gray-400">(e.g. C6H12O6)</span>
          </FormLabel>
          <Input
            defaultValue=""
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
          />
        </FormItem>
        <FormItem>
          <FormLabel>
            Reaction Description{" "}
            <span className="text-sm text-gray-400">
              (e.g. glucose to fructose)
            </span>
          </FormLabel>
          <Input
            defaultValue=""
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormItem>
        <div className="flex justify-end mt-4">
          <Button
            type="button"
            onClick={async () => {
              if (!formula) {
                toast.error("You need to provide a valid formula");
                return;
              }

              setIsLoading(true);

              try {
                const { mass } = await calculateMass({
                  formula,
                });
                onReactionAdd({
                  formula,
                  description,
                  mass,
                });
              } catch {
                toast.error("Error calculating mass, please try again later");
              } finally {
                setPopoverOpen(false);
              }
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                Caculating Mass...
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              "Confirm"
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <FormLabelWithTooltip tooltip="You can additional define custom reactions here">
          Custom Reactions
        </FormLabelWithTooltip>

        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="xs">
              <Plus size={14} />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <ReactionForm
              onReactionAdd={(r) => {
                append(r);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col overflow-scroll gap-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="w-[200px]">
                <FormLabelWithTooltip
                  tooltip="Enter the chemical formula representing the change in the composition of a metabolite. 
                This could be the addition or removal of specific elements or compounds during a metabolic reaction."
                >
                  △ Formula
                </FormLabelWithTooltip>
              </TableHead>
              <TableHead className="w-[200px]">
                <FormLabelWithTooltip
                  tooltip="Provide a brief description of the metabolic change or reaction. 
                Include information about the context in which the formula change occurs, such as the metabolic process, the compounds involved, or any relevant biochemical details. 
                This description should help users understand the nature of the formula change and its significance in the metabolic pathway."
                >
                  Description
                </FormLabelWithTooltip>
              </TableHead>
              <TableHead className="w-[200px]">
                <div className="flex items-center justify-center gap-2">
                  <FormLabelWithTooltip
                    tooltip="This field displays the calculated mass difference resulting from the formula change. 
              The mass is calculated based on the atomic weights of the elements added or removed in the formula change. 
              It represents the net change in mass of the metabolite as a result of the metabolic reaction. 
              This information is crucial for understanding the impact of the reaction on the metabolite's physical properties."
                  >
                    △ Mass
                  </FormLabelWithTooltip>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* fields map to table rows then table cells */}
            {fields.map((field, index) => (
              <TableRow key={field.id} className="py-0">
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => remove(index)}
                    className="opacity-80 group"
                  >
                    <Trash
                      size={12}
                      className="dark:stroke-red-800 dark:group-hover:stroke-red-700 stroke-red-400 group-hover:stroke-red-500"
                    />
                  </Button>
                </TableCell>
                <TableCell>{field.formula}</TableCell>
                <TableCell>{field.description}</TableCell>
                <TableCell>{field.mass}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

interface ReactionDbCreationInterface {
  onCreate: (id: Id<"reactionDatabases">) => void;
}

export function ReactionDbCreation({ onCreate }: ReactionDbCreationInterface) {
  const form = useForm<LocalReactionDbInput>();
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

  const onSubmit = async (values: LocalReactionDbInput) => {
    setIsSubmitting(true);
    if (!values.file) {
      toast.error("You need to upload a file");
      setIsSubmitting(false);
      return;
    }

    const { storageId } = await handleUpload(values.file);
    if (!storageId) {
      toast.error("Something went wrong while uploading your file, try again");
      setIsSubmitting(false);
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
          <span>✨ Create </span>
        </Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className="sm:max-w-[500px]"
      >
        <DialogHeader>
          <DialogTitle>Upload your reactions database</DialogTitle>
          <DialogDescription>
            Once you upload your reaction database file, you will automatically
            select it for your next analysis
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <Input
                    defaultValue="My Reaction Database"
                    type="text"
                    {...field}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange } }) => {
                return (
                  <FormItem>
                    <FormLabelWithTooltip tooltip="Preparing a csv file with three columns: formula, description and mass">
                      File
                    </FormLabelWithTooltip>
                    <Input
                      accept=".csv"
                      onChange={(event) => {
                        const selectedFile =
                          event.target.files && event.target.files[0];
                        if (selectedFile) {
                          readFirstLine(selectedFile).then(
                            (columns: string[]) => {
                              // TODO: use gpt for fuzzy matching later
                              const lowerCased = columns.map((column) =>
                                column.toLowerCase()
                              );
                              if (
                                !lowerCased.every(
                                  (column) => !column.includes("formula")
                                ) &&
                                !lowerCased.every(
                                  (column) => !column.includes("description")
                                ) &&
                                !lowerCased.every(
                                  (column) => !column.includes("mass")
                                )
                              ) {
                                onChange(
                                  event.target.files && event.target.files[0]
                                );
                                form.setValue("name", selectedFile.name);
                              } else {
                                toast.error(
                                  "Your file is missing the required headers: formula, description and mass, \
                                  make sure you have them in the first row of your csv file"
                                );
                                form.reset();
                              }
                            }
                          );
                        }
                      }}
                      type="file"
                    />
                  </FormItem>
                );
              }}
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
