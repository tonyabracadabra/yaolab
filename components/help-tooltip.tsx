import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function HelperTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <QuestionMarkCircledIcon className="opacity-50 hover:bg-slate-200 rounded-full" />
      </TooltipTrigger>
      <TooltipContent className="max-w-[500px]">{text}</TooltipContent>
    </Tooltip>
  );
}
