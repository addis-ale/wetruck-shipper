"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn("w-fit", defaultClassNames.root, className)}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col sm:flex-row relative",
          defaultClassNames.months,
        ),
        month: cn("flex flex-col gap-4 w-full", defaultClassNames.month),
        month_caption: cn(
          "flex items-center justify-center h-9 w-full px-2",
          defaultClassNames.month_caption,
        ),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_next,
        ),
        caption_label: cn(
          "select-none text-sm font-medium",
          defaultClassNames.caption_label,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none p-1",
          defaultClassNames.weekday,
        ),
        week: cn("flex w-full mt-1", defaultClassNames.week),
        weeks: cn(defaultClassNames.weeks),
        day: cn(
          "relative w-full h-full p-0 text-center text-sm focus-within:relative [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          defaultClassNames.day,
        ),
        day_button: cn(
          "inline-flex items-center justify-center rounded-md text-sm size-9 p-0 font-normal transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&.day-today]:bg-accent [&.day-today]:text-accent-foreground",
          defaultClassNames.day_button,
        ),
        range_start: "rounded-l-md bg-primary text-primary-foreground",
        range_middle: "rounded-none bg-accent text-accent-foreground",
        range_end: "rounded-r-md bg-primary text-primary-foreground",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside:
          "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...rest }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", chevronClassName)} {...rest} />
          ) : (
            <ChevronRight
              className={cn("size-4", chevronClassName)}
              {...rest}
            />
          ),
        ...components,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
