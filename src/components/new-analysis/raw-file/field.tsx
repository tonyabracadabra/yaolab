import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/src/components/ui/form";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Loader2, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
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

interface RawFileFormFieldInterface {
  form: UseFormReturn<any>;
}

export function RawFileFormField({ form }: RawFileFormFieldInterface) {
  const t = useTranslations("New");
  const allRawFiles = useQuery(api.rawFiles.getAll, {});
  const router = useRouter();

  return (
    <FormField
      control={form.control}
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

                toast.success(
                  `Raw file selected as ${
                    allRawFiles?.find((f) => f._id === v)?.name
                  }, please configure the experiment groups`
                );
              }}
              value={value}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select-raw-file")} />
              </SelectTrigger>
              <SelectContent
                postViewportContent={
                  <Button
                    variant="ghost"
                    className="px-8 gap-4 flex items-start justify-start"
                    onClick={() => {
                      router.push("/dashboard/raw");
                    }}
                  >
                    <Settings2 size={16} />
                    Manage
                  </Button>
                }
              >
                {allRawFiles?.map((rawFile) => {
                  return (
                    <SelectItem key={rawFile._id} value={rawFile?._id}>
                      {rawFile.name}
                    </SelectItem>
                  );
                })}
                {allRawFiles?.length === 0 && (
                  <SelectItem key={"none"} disabled value="none">
                    {allRawFiles === undefined ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "No raw files"
                    )}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </FormControl>
          <FormDescription>
            {allRawFiles?.length || 0 >= 10
              ? t.rich("raw-files-limit-exceed", {
                  delete: () => (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="font-bold text-primary"
                    >
                      <span>❌ {t("delete")}</span>
                    </Button>
                  ),
                })
              : t.rich("select-or-create-raw", {
                  create: () => (
                    <RawFileCreationDialog
                      onCreate={(id: Id<"rawFiles">) => {
                        onChange(id);
                      }}
                    />
                  ),
                })}
          </FormDescription>
        </FormItem>
      )}
    />
  );
}
