import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Loader2, Search, Settings2 } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { kAvailableEdges, kAvailableNodes } from "../constants";
import { IonMzFilter } from "../hooks/use-ion-mz-filter";
import type { EdgeKey, GraphData, NodeKey, RatioColorScheme } from "../types";

interface GraphControlsProps {
  nodeLabel: NodeKey;
  setNodeLabel: Dispatch<SetStateAction<NodeKey>>;
  edgeLabel: EdgeKey;
  setEdgeLabel: Dispatch<SetStateAction<EdgeKey>>;
  nodeSize: NodeKey;
  setNodeSize: Dispatch<SetStateAction<NodeKey>>;
  hideEndogenousSubgraphs: boolean;
  setHideEndogenousSubgraphs: (value: boolean) => void;
  ratioModeEnabled: boolean;
  setRatioModeEnabled: (value: boolean) => void;
  highlightRedundant: boolean;
  setHighlightRedundant: (value: boolean) => void;
  colorScheme: RatioColorScheme;
  setColorScheme: Dispatch<SetStateAction<RatioColorScheme>>;
  graphData?: GraphData;
  hasDrugSample?: boolean;
  downloading: boolean;
  onDownloadGraphML: () => void;
  onDownloadRawData: () => void;
  activeFilter?: IonMzFilter;
  onFilterApply: (filter: IonMzFilter) => void;
  onFilterClear: () => void;
}

const ionFilterSchema = z.object({
  mz: z.number().min(0, "m/z must be positive").step(0.0001).optional(),
  tolerance: z
    .number()
    .min(0.0001, "Tolerance must be positive")
    .max(2, "Maximum tolerance is 2 Da")
    .step(0.0001)
    .optional(),
  intensity: z
    .number()
    .min(0, "Intensity must be between 0-100")
    .max(100)
    .step(1)
    .optional(),
});

export function GraphControls({
  nodeLabel,
  setNodeLabel,
  edgeLabel,
  setEdgeLabel,
  nodeSize,
  setNodeSize,
  hideEndogenousSubgraphs,
  setHideEndogenousSubgraphs,
  ratioModeEnabled,
  setRatioModeEnabled,
  highlightRedundant,
  setHighlightRedundant,
  graphData,
  hasDrugSample,
  downloading,
  onDownloadGraphML,
  activeFilter,
  onFilterApply,
  onFilterClear,
}: GraphControlsProps) {
  const form = useForm<IonMzFilter>({
    resolver: zodResolver(ionFilterSchema),
    defaultValues: activeFilter || {
      mz: 0,
      tolerance: 0.01,
      intensity: 50,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const formValues = form.watch();
  const hasChanges =
    JSON.stringify(formValues) !== JSON.stringify(activeFilter);

  const handleFilterSubmit = async (values: IonMzFilter) => {
    try {
      setIsSubmitting(true);
      onFilterApply(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearFilter = () => {
    onFilterClear();
    form.reset({
      mz: 0,
      tolerance: 0.01,
      intensity: 50,
    });
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name) {
        form.trigger(name);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const isIonFilterActive = activeFilter !== undefined;

  console.log(
    "isIonFilterActive",
    isIonFilterActive,
    "activeFilter",
    activeFilter
  );

  const filterTabTrigger = (
    <TabsTrigger value="search" className="text-xs relative">
      Filter
      {activeFilter && (
        <div
          className={cn(
            "absolute -top-[0px] -right-[0px] w-2 h-2 rounded-full bg-primary",
            isIonFilterActive ? "bg-emerald-500" : "bg-primary"
          )}
        />
      )}
    </TabsTrigger>
  );

  const filterTabContent = (
    <TabsContent value="search" className="p-4 mt-0">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-4 w-4 rounded-full flex items-center justify-center",
                isIonFilterActive ? "bg-emerald-500/10" : "bg-primary/10"
              )}
            >
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isIonFilterActive ? "bg-emerald-500" : "bg-primary"
                )}
              />
            </div>
            <h5 className="text-sm font-medium">Feature Ion Filter</h5>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFilterSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="mz"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label
                      htmlFor="mz"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      m/z Value
                    </Label>
                    <div className="relative">
                      <Search
                        className={cn(
                          "absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4"
                        )}
                      />
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="Enter m/z"
                          className="h-8 pl-8 text-xs bg-background"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tolerance"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label
                      htmlFor="tolerance"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Tolerance (Da)
                    </Label>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        className="h-8 text-xs bg-background"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="intensity"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label
                      htmlFor="intensity"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Min. Intensity %
                    </Label>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        className="h-8 text-xs bg-background"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                className={cn("flex-1 h-8 text-xs")}
                disabled={
                  isSubmitting || !hasChanges || !form.formState.isValid
                }
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isIonFilterActive ? "Update Filter" : "Apply Filter"}
              </Button>
              {isIonFilterActive && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-red-500/20 text-red-600 hover:bg-red-50"
                  onClick={handleClearFilter}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </TabsContent>
  );

  return (
    <div className="absolute right-6 top-6 flex items-center gap-2 z-50">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className={cn(
                "h-8 w-8 p-0 rounded-full shadow-sm hover:bg-secondary/80"
              )}
            >
              <Settings2 className={"w-4 h-4"} />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[580px] z-[9999] p-0 shadow-lg flex flex-col max-h-[60vh]"
            align="end"
            sideOffset={8}
            onInteractOutside={(e) => {
              if (
                e.target instanceof Element &&
                (e.target.closest('[role="combobox"]') ||
                  e.target.closest('[role="listbox"]'))
              ) {
                e.preventDefault();
              }
            }}
          >
            <div className="border-b border-border/50 p-4 flex-shrink-0">
              <div className="space-y-1">
                <h4 className="font-medium">Graph Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Configure visualization options and display preferences
                </p>
              </div>
            </div>

            <Tabs defaultValue="display" className="flex flex-col">
              <TabsList className="flex items-center justify-start px-4">
                <TabsTrigger value="display" className="text-xs">
                  Display
                </TabsTrigger>
                <TabsTrigger value="options" className="text-xs">
                  Options
                </TabsTrigger>
                {filterTabTrigger}
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="display" className="p-4 mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <h5 className="text-sm font-medium">
                        Node & Edge Display
                      </h5>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pl-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="nodeLabel"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Node Label
                        </Label>
                        <Select
                          value={nodeLabel}
                          onValueChange={(value: NodeKey) =>
                            setNodeLabel(value)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Select node label" />
                          </SelectTrigger>
                          <SelectContent>
                            {kAvailableNodes.map((v) => (
                              <SelectItem
                                key={v.key}
                                value={v.key}
                                className="text-xs"
                              >
                                {v.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="edgeLabel"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Edge Label
                        </Label>
                        <Select
                          value={edgeLabel}
                          onValueChange={(value: EdgeKey) =>
                            setEdgeLabel(value)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Select edge label" />
                          </SelectTrigger>
                          <SelectContent>
                            {kAvailableEdges.map((v) => (
                              <SelectItem
                                key={v.col}
                                value={v.col}
                                className="text-xs"
                              >
                                {v.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="nodeSize"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Node Size
                        </Label>
                        <Select
                          value={nodeSize}
                          onValueChange={(value: NodeKey) => setNodeSize(value)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Select node size" />
                          </SelectTrigger>
                          <SelectContent>
                            {kAvailableNodes.map((v) => (
                              <SelectItem
                                key={v.col}
                                value={v.key}
                                className="text-xs"
                              >
                                {v.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="options" className="p-4 mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <h5 className="text-sm font-medium">Display Options</h5>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 pl-6">
                      {hasDrugSample && (
                        <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <Switch
                            checked={hideEndogenousSubgraphs}
                            onCheckedChange={setHideEndogenousSubgraphs}
                            className="mt-0.5 data-[state=checked]:bg-primary"
                          />
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">
                              Hide endogenous subgraphs
                            </Label>
                            <p className="text-[11px] leading-tight text-muted-foreground">
                              Only show subgraphs with prototype compounds
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Switch
                          checked={ratioModeEnabled}
                          onCheckedChange={setRatioModeEnabled}
                          className="mt-0.5 data-[state=checked]:bg-primary"
                        />
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">
                            Compound Response Mode
                          </Label>
                          <p className="text-[11px] leading-tight text-muted-foreground">
                            Enable compound response visualization
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Switch
                          checked={highlightRedundant}
                          onCheckedChange={setHighlightRedundant}
                          className="mt-0.5 data-[state=checked]:bg-primary"
                        />
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">
                            Highlight Redundant Data
                          </Label>
                          <p className="text-[11px] leading-tight text-muted-foreground">
                            Show edges with redundant information
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {filterTabContent}
              </div>
            </Tabs>
          </PopoverContent>
        </Popover>

        <Button
          variant="secondary"
          size="sm"
          className="h-8 w-8 p-0 rounded-full shadow-sm hover:bg-secondary/80"
          disabled={downloading || !graphData}
          onClick={onDownloadGraphML}
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
