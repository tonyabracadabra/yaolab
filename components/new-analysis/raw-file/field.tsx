import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AnalysisCreationInputType } from "@/lib/utils";
import { useQuery } from "convex/react";
import { Loader2, Settings2 } from "lucide-react";
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
import { RawFileCreationDialog } from "./dialog";

export function RawFileFormField() {
  const t = useTranslations("New");
  const { control } = useFormContext<AnalysisCreationInputType>();
  const allRawFiles = useQuery(api.rawFiles.getAll, {});
  const router = useRouter();

  return (
    <FormField
      control={control}
      name="rawFile"
      render={({ field: { onChange, value } }) => (
        <FormItem className="w-full space-y-4">
          <FormLabel className="flex items-center gap-2 text-base font-medium">
            <Badge variant="secondary">1</Badge> {t("choose-raw-file")}
          </FormLabel>
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
                  <SelectValue
                    placeholder={
                      <span className="text-muted-foreground">
                        Raw File to be analyzed
                      </span>
                    }
                  />
                </SelectTrigger>
                <SelectContent
                  className="min-w-[300px]"
                  postViewportContent={
                    <Button
                      variant="ghost"
                      className="w-full px-4 py-2 gap-2 flex items-center justify-start hover:bg-accent/50"
                      onClick={() => {
                        router.push("/workspace/raw");
                      }}
                    >
                      <Settings2 className="h-4 w-4" />
                      <span>Manage Raw Files</span>
                    </Button>
                  }
                >
                  {allRawFiles?.map((file) => (
                    <SelectItem key={file._id} value={file._id}>
                      {file.name}
                    </SelectItem>
                  ))}
                  {allRawFiles?.length === 0 && (
                    <SelectItem key={"none"} disabled value="none">
                      {allRawFiles === undefined ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("no-raw-files-uploaded")
                      )}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription className="text-sm">
              {t.rich("select-or-create-raw", {
                create: () => (
                  <RawFileCreationDialog
                    onCreate={(id: Id<"rawFiles">) => onChange(id)}
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
  );
}
