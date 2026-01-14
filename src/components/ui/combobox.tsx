"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  allowCustomValue?: boolean; // Allow values not in options list
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  disabled = false,
  className,
  id,
  allowCustomValue = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((option) => option.value === value);
  
  // If value exists but not in options (e.g., existing data), show the value itself
  // or add it as a temporary option
  const displayValue = selectedOption 
    ? selectedOption.label 
    : value && allowCustomValue
    ? value 
    : placeholder;
  
  // Include current value in options if it's not already there (for existing data)
  const effectiveOptions = React.useMemo(() => {
    if (!value || selectedOption || !allowCustomValue) {
      return options;
    }
    // Add current value as an option if it's not in the list
    return [
      ...options,
      { value, label: value },
    ];
  }, [options, value, selectedOption, allowCustomValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0" 
        align="start"
        sideOffset={4}
        style={{
          width: "var(--radix-popover-trigger-width)",
          minWidth: "200px",
        }}
      >
        <Command shouldFilter={true}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {effectiveOptions.length > 0 && (
              <CommandGroup>
                {effectiveOptions.map((option) => {
                  // Use both label and value for search to improve discoverability
                  const searchValue = `${option.label} ${option.value}`;
                  return (
                    <CommandItem
                      key={option.value}
                      value={searchValue}
                      disabled={option.disabled}
                      onSelect={() => {
                        // Always use the option's value, not the search value
                        onValueChange(
                          option.value === value ? "" : option.value
                        );
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

