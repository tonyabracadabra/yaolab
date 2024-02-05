import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "./ui/badge";

interface SelectOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: SelectOption[];
  selectedValues: string[];
  otherGroupSelectedValues?: string[];
  onSelect: (value: string) => void;
}

export function MultiSelectCombobox({
  options,
  onSelect,
  selectedValues,
  otherGroupSelectedValues = [],
}: ComboboxProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (val: string) => {
    onSelect(val);
  };

  const isSelected = (val: string) => selectedValues.includes(val);
  const isOtherGroupSelected = (val: string) =>
    otherGroupSelectedValues.includes(val);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] h-full justify-between"
        >
          {selectedValues.length > 0 ? (
            <div className="flex items-center justify-center gap-[4px] flex-wrap">
              {options
                .filter((op) => isSelected(op.value))
                .map((op, i) => (
                  <Badge key={i} variant="secondary">
                    {op.label}
                  </Badge>
                ))}
            </div>
          ) : (
            <div className="dark:text-slate-500 text-slate-200">
              Select columns...
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search columns..." />
          {options.length === 0 && (
            <CommandEmpty>No columns found.</CommandEmpty>
          )}
          <CommandGroup className="max-h-[300px] overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option.value)}
                disabled={isOtherGroupSelected(option.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    isSelected(option.value)
                      ? "opacity-100"
                      : isOtherGroupSelected(option.value)
                      ? "opacity-20"
                      : "opacity-0"
                  )}
                />
                <div
                  className={cn(
                    isOtherGroupSelected(option.value)
                      ? "text-secondary"
                      : "text-primary"
                  )}
                >
                  {option.label}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
