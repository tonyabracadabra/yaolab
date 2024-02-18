import { cn } from "@/lib/utils";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as React from "react";

// Define switch size variants
const switchSizeVariants = {
  small: "h-4 w-8", // Adjust the height and width for a small switch
  medium: "h-6 w-11", // Default size as previously defined
  large: "h-8 w-14", // Adjust the height and width for a large switch
};

// Extend the component props to include 'size'
interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  size?: keyof typeof switchSizeVariants; // Use the keys of the switchSizeVariants object as the possible size values
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size = "medium", ...props }, ref) => {
  // Determine the size class from the variants
  const sizeClass = switchSizeVariants[size];

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        sizeClass,
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
          {
            "translate-x-3": size === "small", // Adjust translation for small size
            "translate-x-5": size === "medium", // Default translation
            "translate-x-6": size === "large", // Adjust translation for large size
          },
          {
            "h-3 w-3": size === "small", // Adjust thumb size for small
            "h-5 w-5": size === "medium", // Default thumb size
            "h-6 w-6": size === "large", // Adjust thumb size for large
          }
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = "Switch";

export { Switch };
