import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import { downloadDefaultReactions } from "@/actions/default-reactions";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { DownloadCloud, Loader2, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";
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

export function ReactionDbFormField() {
  const t = useTranslations("New");
  const { control, watch } = useFormContext();
  const allReactionDatabases = useQuery(api.reactions.getAll, {});
  const router = useRouter();
  const reactionDb = watch("reactionDb");

  return (
    <div className="w-full">
      <FormField
        control={control}
        name="reactionDb"
        render={({ field: { onChange, value } }) => (
          <FormItem className="w-full space-y-4">
            <div className="flex items-center justify-between gap-2">
              <FormLabel className="flex items-center gap-2 text-base font-medium">
                <Badge variant="secondary">2</Badge> {t("choose-reaction-db")}
              </FormLabel>
              {reactionDb?.split("-")[0] === "default" && (
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

                        const { csv } = await downloadDefaultReactions(
                          reactionDb.split("-")[1] as "pos" | "neg"
                        );
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "default-reactions.csv";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <DownloadCloud className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">{t("download-default-reactions")}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="w-full space-y-2">
              <FormControl>
                <Select
                  onValueChange={(v) => {
                    if (!v) return;
                    onChange(v);
                  }}
                  value={value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Reaction database to use" />
                  </SelectTrigger>
                  <SelectContent
                    className="min-w-[300px]"
                    postViewportContent={
                      <Button
                        variant="ghost"
                        className="w-full px-4 py-2 gap-2 flex items-center justify-start hover:bg-accent/50"
                        onClick={() => {
                          router.push("/workspace/reactions");
                        }}
                      >
                        <Settings2 className="h-4 w-4" />
                        <span>Manage Reaction DBs</span>
                      </Button>
                    }
                  >
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
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t("no-custom-reactions-created")
                        )}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription className="text-sm">
                {t.rich("select-or-create-reaction-db", {
                  create: () => (
                    <ReactionDbCreationDialog
                      onCreate={(id: Id<"reactionDatabases">) => onChange(id)}
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="font-bold text-primary px-2"
                        >
                          <span>✨ {t("create")}</span>
                        </Button>
                      }
                    />
                  ),
                })}
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
