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
        <FormItem>
          <FormLabel className="flex items-center gap-2 text-md min-w-[250px]">
            <Badge variant="secondary">1</Badge> {t("choose-raw-file")}
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
              <SelectContent
                postViewportContent={
                  <Button
                    variant="ghost"
                    className="px-8 gap-4 flex items-start justify-start"
                    onClick={() => {
                      router.push("/workspace/raw-files");
                    }}
                  >
                    <Settings2 size={16} />
                    Manage
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
                      <Loader2 className="animate-spin" />
                    ) : (
                      t("no-raw-files-uploaded")
                    )}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </FormControl>
          <FormDescription>
            {t.rich("select-or-create-raw", {
              create: () => (
                <RawFileCreationDialog
                  onCreate={(id: Id<"rawFiles">) => onChange(id)}
                />
              ),
            })}
          </FormDescription>
        </FormItem>
      )}
    />
  );
}
