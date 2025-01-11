import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

interface SelectOption {
  value: string;
  label: string;
}

interface MultiSelectComboboxProps {
  options: SelectOption[];
  selectedValues: string[];
  otherGroupSelectedValues?: string[];
  onSelect: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function MultiSelectCombobox({
  options,
  onSelect,
  selectedValues = [],
  otherGroupSelectedValues = [],
  className,
  placeholder,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const t = useTranslations("New");

  const filteredOptions = React.useMemo(() => {
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const handleSelect = React.useCallback(
    (currentValue: string) => {
      onSelect(currentValue);
      setOpen(true);
    },
    [onSelect]
  );

  const handleBadgeRemove = React.useCallback(
    (value: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(value);
    },
    [onSelect]
  );

  const selectedOptions = React.useMemo(
    () => options.filter((op) => selectedValues.includes(op.value)),
    [options, selectedValues]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between relative min-h-[2.5rem] h-auto py-2",
            className
          )}
          onClick={() => setOpen(!open)}
        >
          <div className="flex flex-wrap gap-1.5 pe-8">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="rounded-md text-xs py-1 px-2 gap-1"
                >
                  {option.label}
                  <X
                    className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={(e) => handleBadgeRemove(option.value, e)}
                  />
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">
                {placeholder || t("select-columns")}
              </span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 absolute right-3 top-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="flex flex-col">
          <Input
            placeholder={t("search-columns")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {filteredOptions.length === 0 && (
            <p className="py-2 px-3 text-sm text-muted-foreground">
              {t("no-columns-found")}
            </p>
          )}
          <ScrollArea className="h-[200px] w-full">
            <div className="flex flex-col">
              {filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                const isDisabled = otherGroupSelectedValues.includes(
                  option.value
                );

                return (
                  <button
                    type="button"
                    key={option.value}
                    disabled={isDisabled}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-left",
                      isDisabled && "bg-muted/50 cursor-not-allowed",
                      !isDisabled && "hover:bg-accent/50",
                      isSelected && "bg-accent"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-[0.25rem] border border-primary shrink-0",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-background"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        isSelected && "font-medium",
                        isDisabled && "text-muted-foreground line-through"
                      )}
                    >
                      {option.label}
                    </span>
                    {isDisabled && (
                      <span className="text-xs text-muted-foreground ml-auto italic">
                        Selected in other group
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
