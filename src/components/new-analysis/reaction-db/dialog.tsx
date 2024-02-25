import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ReactionDatabaseSchema, ReactionSchema } from "@/convex/schema";
import { readFirstKLines } from "@/lib/utils";
import { useAction, useMutation } from "convex/react";
import {
  Atom,
  DownloadCloud,
  Loader2,
  Minus,
  MinusCircle,
  Plus,
  PlusCircle,
} from "lucide-react";
import Papa from "papaparse";
import { useState } from "react";
import { Control, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormLabelWithTooltip } from "../../form-label-tooltip";
import { Button } from "../../ui/button";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { Form, FormField, FormItem, FormLabel } from "../../ui/form";
import { Input } from "../../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";

type ReactionDatabaseInput = z.infer<typeof ReactionDatabaseSchema>;
type Reaction = z.infer<typeof ReactionSchema>;

interface ReactionFormInterface {
  onReactionAdd: (reaction: Reaction) => void;
}

const ReactionForm = ({ onReactionAdd }: ReactionFormInterface) => {
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
                mzDiff: masses[0],
              });
            } catch {
              toast.error("Error calculating mass, please try again later");
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

  return (
    <div className="flex flex-col overflow-scroll gap-2 max-h-[200px] w-[450px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="xs">
                    <Plus size={14} strokeWidth={3} />
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
                      setPopoverOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </TableHead>
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
          {(!control._formValues.reactions ||
            control._formValues.reactions.length === 0) && (
            <TableRow>
              <TableCell colSpan={4} className="h-18 text-center">
                No Custom Reactions
              </TableCell>
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {/* fields map to table rows then table cells */}
          {fields.map((field, index) => (
            <TableRow key={field.id} className="py-0">
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => remove(index)}
                >
                  <Minus className="stroke-red-400" size={12} strokeWidth={4} />
                </Button>
              </TableCell>
              <TableCell className="flex items-center justify-center">
                {field.formulaChange}
              </TableCell>
              <TableCell>{field.description}</TableCell>
              <TableCell>{field.mzDiff}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

interface ReactionDbCreationInterface {
  onCreate: (id: Id<"reactionDatabases">) => void;
}

export function ReactionDbCreationDialog({
  onCreate,
}: ReactionDbCreationInterface) {
  const form = useForm<ReactionDatabaseInput>({
    defaultValues: {
      // random name with date
      name: `My Reaction Database ${new Date().toLocaleDateString()}`,
      ionMode: "pos",
    },
  });
  const t = useTranslations("New");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const calculateMass = useAction(api.actions.calculateMass);
  const createReactionDatabase = useMutation(api.reactions.create);
  const downloadDefaultReactions = useAction(
    api.actions.downloadDefaultReactions
  );

  const onClose = () => {
    form.reset();
    setOpen(false);
    setIsSubmitting(false);
  };

  const onSubmit = async () => {
    const values = form.getValues();

    setIsSubmitting(true);
    const { id } = await createReactionDatabase({
      name: values.name,
      reactions: values.reactions,
      ionMode: values.ionMode,
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
          <span>✨ {t("create")} </span>
        </Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className="sm:max-w-[500px]"
      >
        <DialogHeader>
          <DialogTitle>Customize reactions database</DialogTitle>
          <DialogDescription className="flex items-end justify-start flex-wrap gap-2 py-2">
            You can add your own by batch uploading a csv file or adding them
            one by one
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="flex flex-col gap-4">
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
                Batch Upload
              </FormLabelWithTooltip>
              <Input
                accept=".csv"
                onChange={(event) => {
                  const selectedFile =
                    event.target.files && event.target.files[0];
                  if (selectedFile) {
                    readFirstKLines(selectedFile, 1).then((lines: string[]) => {
                      if (lines.length === 0) {
                        toast.error("Your file is empty");
                        form.reset();
                        return;
                      }

                      const columns = lines[0]
                        .split(",")
                        .map((column) => column.trim());

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
                                  mzDiff: masses[index],
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
            <FormItem>
              <FormLabelWithTooltip tooltip="Choose from positive / negative ion mode to alleviate the false positive rate">
                Ion Mode
              </FormLabelWithTooltip>
              <FormField
                name="ionMode"
                render={({ field }) => {
                  return (
                    <Tabs
                      value={field.value}
                      onValueChange={field.onChange}
                      className="py-2"
                    >
                      <TabsList>
                        <TabsTrigger value="pos">
                          <PlusCircle className="w-4 h-4 mr-2" /> Positive
                        </TabsTrigger>
                        <TabsTrigger value="neg">
                          <MinusCircle className="w-4 h-4 mr-2" /> Negative
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  );
                }}
              />
            </FormItem>
            <ReactionsFieldsArray control={form.control} />
            <DialogFooter className="flex items-center justify-between pt-2 px-2">
              <DialogDescription className="flex items-center justify-start flex-wrap gap-2 text-xs w-full">
                <Atom size={16} />
                By default, the reaction database contains{" "}
                <Button
                  size="xs"
                  type="button"
                  variant="secondary"
                  className="flex items-center gap-2 text-xs"
                  onClick={async () => {
                    const { csv } = await downloadDefaultReactions({
                      mode: form.getValues().ionMode,
                    });
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "default-reactions.csv"; // Sets the filename for the download
                    document.body.appendChild(a); // Append the link to the document
                    a.click(); // Trigger the download
                    document.body.removeChild(a); // Clean up and remove the link
                    URL.revokeObjectURL(url);
                  }}
                >
                  <div>116 reactions</div>
                  <Plus size={12} />
                  <div>
                    {form.getValues().ionMode === "pos"
                      ? "4 positive ion metalome"
                      : "3 negative ion metalone"}
                  </div>
                  <DownloadCloud size={12} />
                </Button>
              </DialogDescription>
              <Button type="button" onClick={onSubmit}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    Uploading
                    <Loader2 className="animate-spin" />
                  </div>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
