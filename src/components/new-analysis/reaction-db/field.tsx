import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/src/components/ui/form";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAction, useQuery } from "convex/react";
import { DownloadCloud, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { UseFormReturn } from "react-hook-form";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { ReactionDbCreationDialog } from "./dialog";

interface RawFileFormFieldInterface {
  form: UseFormReturn<any>;
}

export function ReactionDbFormField({ form }: RawFileFormFieldInterface) {
  const t = useTranslations("New");
  const allReactionDatabases = useQuery(api.reactions.getAll, {});
  const downloadDefaultReactions = useAction(
    api.actions.downloadDefaultReactions
  );

  return (
    <div className="flex items-center justify-center gap-2">
      <FormField
        control={form.control}
        name="reactionDb"
        render={({ field: { onChange, value } }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 text-md min-w-[250px]">
              <Badge variant="secondary">2</Badge> {t("choose-reaction-db")}
            </FormLabel>
            <FormControl>
              <Select
                onValueChange={(v) => {
                  if (!v) return;
                  onChange(v);
                }}
                value={value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Raw File to be analyzed" />
                </SelectTrigger>
                <SelectContent>
                  {allReactionDatabases?.map((db) => (
                    <SelectItem key={db._id} value={db._id}>
                      {db.name}
                    </SelectItem>
                  ))}
                  <SelectItem key="default-pos" value="default-pos">
                    Default 116 Reactions + Positive Ions
                  </SelectItem>
                  <SelectItem key="default-neg" value="default-neg">
                    Default 116 Reactions + Negative Ions
                  </SelectItem>
                  {allReactionDatabases?.length === 0 && (
                    <SelectItem key={"none"} disabled value="none">
                      {allReactionDatabases === undefined ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        t("no-custom-reactions-created")
                      )}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              {t.rich("select-or-create-reaction-db", {
                create: () => (
                  <ReactionDbCreationDialog
                    onCreate={(id: Id<"reactionDatabases">) => onChange(id)}
                  />
                ),
              })}
            </FormDescription>
          </FormItem>
        )}
      />
      {form.watch("reactionDb").split("-")[0] === "default" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="xs"
              type="button"
              variant="secondary"
              className="flex items-center gap-2"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const { csv } = await downloadDefaultReactions({
                  mode: form.watch("reactionDb").split("-")[1] as "pos" | "neg",
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
              <DownloadCloud size={12} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg shadow-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t("download-default-reactions")}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
