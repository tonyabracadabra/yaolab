import { ReactNode } from "react";
import { HelperTooltip } from "./help-tooltip";
import { FormLabel } from "./ui/form";

export function FormLabelWithTooltip({
  children,
  tooltip,
}: {
  children: ReactNode;
  tooltip: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <FormLabel className="whitespace-nowrap">{children}</FormLabel>
      <HelperTooltip text={tooltip} />
    </div>
  );
}
