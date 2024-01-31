import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ReactionDatabaseSchema, ReactionSchema } from "@/convex/schema";
import { readFirstLine, useFileUpload } from "@/lib/utils";
import { useAction, useMutation } from "convex/react";
import { Loader2, Plus, Trash } from "lucide-react";
import Papa from "papaparse";
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

type ReactionDatabaseInput = z.infer<typeof ReactionDatabaseSchema>;
type Reaction = z.infer<typeof ReactionSchema>;

const ReactionsFieldsArray = ({
  control,
}: {
  control: Control<ReactionDatabaseInput>;
}) => {
  const { fields, append, remove } = useFieldArray<ReactionDatabaseInput>({
    control,
    name: "reactions",
  });
  const [popoverOpen, setPopoverOpen] = useState(false);

  interface ReactionFormInterface {
    onReactionAdd: (reaction: Reaction) => void;
    onReactionsAdd?: (reactions: Reaction[]) => void;
  }

  const ReactionForm = ({
    onReactionAdd,
    onReactionsAdd,
  }: ReactionFormInterface) => {
    const calculateMass = useAction(api.actions.calculateMass);
    const [formulaChange, setFormulaChange] = useState("");
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
            value={formulaChange}
            onChange={(e) => setFormulaChange(e.target.value)}
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
              if (!formulaChange) {
                toast.error("You need to provide a valid formula");
                return;
              }

              setIsLoading(true);

              try {
                const { masses } = await calculateMass({
                  formulaChanges: [formulaChange],
                });
                if (masses.length === 0) {
                  toast.error("Error calculating mass, please try again later");
                  return;
                }

                onReactionAdd({
                  formulaChange,
                  description,
                  mass: masses[0],
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
          Reactions
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

      <div className="flex flex-col overflow-scroll gap-2 h-[200px] w-[450px]">
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
                <TableCell>{field.formulaChange}</TableCell>
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
  const form = useForm<ReactionDatabaseInput>();
  const [open, setOpen] = useState(false);
  const { handleUpload } = useFileUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const calculateMass = useAction(api.actions.calculateMass);

  const createReactionDatabase = useMutation(api.reactions.create);

  const onClose = () => {
    form.reset();
    setOpen(false);
    setIsSubmitting(false);
  };

  const onSubmit = async (values: ReactionDatabaseInput) => {
    setIsSubmitting(true);
    const { id } = await createReactionDatabase({
      name: values.name,
      reactions: values.reactions,
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

            <FormItem>
              <FormLabelWithTooltip tooltip="Preparing a csv file with two columns: formula, description">
                Batch Upload Reactions
              </FormLabelWithTooltip>
              <Input
                accept=".csv"
                onChange={(event) => {
                  const selectedFile =
                    event.target.files && event.target.files[0];
                  if (selectedFile) {
                    readFirstLine(selectedFile).then((columns: string[]) => {
                      // TODO: use gpt for fuzzy matching later
                      const lowerCased = columns.map((column) =>
                        column.toLowerCase()
                      );
                      const columnFormulaIndex = lowerCased.findIndex(
                        (column) => column.includes("formula")
                      );
                      const columnDescriptionIndex = lowerCased.findIndex(
                        (column) => column.includes("description")
                      );

                      if (
                        columnFormulaIndex !== -1 &&
                        columnDescriptionIndex !== -1
                      ) {
                        form.setValue("name", selectedFile.name);

                        // parse the csv file with papa parse, then convert all data to reaction objects and call
                        // append for each reaction

                        type CsvRowType = { [key: string]: string };
                        Papa.parse<CsvRowType>(selectedFile, {
                          header: true,
                          skipEmptyLines: true,
                          complete: async function (results) {
                            const partialReactions = results.data.map((row) => {
                              // Cast the row to the specific structure
                              const formula = row[columns[columnFormulaIndex]];
                              const description =
                                row[columns[columnDescriptionIndex]];

                              return {
                                formulaChange: formula,
                                description,
                              };
                            });
                            const { masses } = await calculateMass({
                              formulaChanges: partialReactions.map(
                                (reaction) => reaction.formulaChange
                              ),
                            });

                            // append to the form reactions field array
                            form.setValue("reactions", [
                              ...form.getValues().reactions,
                              ...partialReactions.map((reaction, index) => {
                                return {
                                  ...reaction,
                                  mass: masses[index],
                                };
                              }),
                            ]);
                          },
                        });
                      } else {
                        toast.error(
                          "Your file is missing the required headers: formula, description, \
                                  make sure you have them in the first row of your csv file"
                        );
                        form.reset();
                      }
                    });
                  }
                }}
                type="file"
              />
            </FormItem>
            <ReactionsFieldsArray control={form.control} />
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
