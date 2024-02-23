import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { ChangeEvent } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type InputWithTooltipProps = {
  label: string;
  tooltipText: string;
  defaultValue: number | string;
  type?: "number" | "text";
  value: number | string;
  onChange: (value: string | number) => void;
};

export function InputWithTooltip({
  label,
  tooltipText,
  value,
  onChange,
  defaultValue,
  type = "number",
}: InputWithTooltipProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    onChange(type === "number" && inputValue ? Number(inputValue) : inputValue);
  };

  return (
    <div className="flex items-start gap-4 flex-col justify-center">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        <Tooltip>
          <TooltipTrigger
            asChild
            className="hover:bg-slate-600 hover:cursor-pointer rounded-lg"
          >
            <QuestionMarkCircledIcon />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-[200px]">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Input
        type={type}
        defaultValue={defaultValue}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}
