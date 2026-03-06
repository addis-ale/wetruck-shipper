"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "checked"
> {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const isChecked = checked === true;
    const isIndeterminate = checked === "indeterminate";

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-[3px] border border-primary ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "checked:bg-primary checked:text-primary-foreground",
            "appearance-none cursor-pointer",
            className,
          )}
          onChange={(e) => {
            onCheckedChange?.(e.target.checked);
            props.onChange?.(e);
          }}
          {...props}
        />
        {(isChecked || isIndeterminate) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {isIndeterminate ? (
              <div className="h-0.5 w-2 bg-primary-foreground" />
            ) : (
              <CheckIcon className="h-4 w-4 text-primary-foreground" />
            )}
          </div>
        )}
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
