import { cn } from "@/lib/utils";
import React, { CSSProperties } from "react";

export interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerSize?: string;
  borderRadius?: string;
  children?: React.ReactNode;
}

const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerSize = "0.05em",
      borderRadius = "100px",
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        style={
          {
            "--spread": "90deg",
            "--shimmer-color": "var(--shimmer-col, #ffffff)",
            "--radius": borderRadius,
            "--speed": "3s",
            "--cut": shimmerSize,
            "--bg": "var(--button-bg, rgba(0, 0, 0, 1))",
          } as CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 [background:var(--bg)] [border-radius:var(--radius)]",
          "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-[1px]",
          "text-white dark:[--button-bg:rgba(255,255,255,1)] dark:[--shimmer-col:#000000] dark:text-black dark:border-black/10",
          disabled &&
            "cursor-not-allowed opacity-50 hover:no-underline active:translate-y-0",
          className
        )}
        disabled={disabled}
        ref={ref}
        {...props}
      >
        {/* Only show effects when not disabled */}
        {!disabled && (
          <>
            {/* spark container */}
            <div className="-z-30 blur-[2px] absolute inset-0 overflow-visible [container-type:size]">
              <div className="absolute inset-0 h-[100cqh] animate-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
                <div className="animate-spin-around absolute inset-[-100%] w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
              </div>
            </div>

            {/* Highlight */}
            <div className="insert-0 absolute h-full w-full rounded-2xl px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ffffff1f] dark:shadow-[inset_0_-8px_10px_#0000001f] transform-gpu transition-all duration-300 ease-in-out group-hover:shadow-[inset_0_-6px_10px_#ffffff3f] group-hover:dark:shadow-[inset_0_-6px_10px_#0000003f] group-active:shadow-[inset_0_-10px_10px_#ffffff3f] group-active:dark:shadow-[inset_0_-10px_10px_#0000003f]" />
          </>
        )}

        {children}

        {/* backdrop */}
        <div className="absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]" />
      </button>
    );
  }
);

ShimmerButton.displayName = "ShimmerButton";

export default ShimmerButton;
