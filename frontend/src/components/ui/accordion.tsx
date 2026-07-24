"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

// --------------- Accordion Context ---------------

interface AccordionContextValue {
  expandedValue: string
  toggleItem: (value: string) => void
  collapsible: boolean
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)

function useAccordionContext() {
  const ctx = React.useContext(AccordionContext)
  if (!ctx) throw new Error("Accordion components must be used inside <Accordion>")
  return ctx
}

// --------------- Item Context ---------------

const AccordionItemContext = React.createContext<string>("")

function useAccordionItemContext() {
  return React.useContext(AccordionItemContext)
}

// --------------- Accordion ---------------

function Accordion({
  className,
  type = "single",
  collapsible = true,
  value,
  onValueChange,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  type?: "single" | "multiple"
  collapsible?: boolean
  value?: string
  onValueChange?: (value: string) => void
}) {
  const toggleItem = React.useCallback(
    (itemValue: string) => {
      if (!onValueChange) return
      if (value === itemValue && collapsible) {
        onValueChange("")
      } else {
        onValueChange(itemValue)
      }
    },
    [value, collapsible, onValueChange]
  )

  return (
    <AccordionContext.Provider
      value={{ expandedValue: value ?? "", toggleItem, collapsible }}
    >
      <div
        data-slot="accordion"
        className={cn("divide-y divide-border", className)}
        {...props}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

// --------------- AccordionItem ---------------

function AccordionItem({
  className,
  value: itemValue,
  children,
  ...props
}: React.ComponentProps<"div"> & { value: string }) {
  const { expandedValue } = useAccordionContext()
  const isExpanded = expandedValue === itemValue

  return (
    <AccordionItemContext.Provider value={itemValue}>
      <div
        data-slot="accordion-item"
        data-value={itemValue}
        data-expanded={isExpanded || undefined}
        className={cn("group/accordion-item", className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
}

// --------------- AccordionTrigger ---------------

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { toggleItem } = useAccordionContext()
  const itemValue = useAccordionItemContext()
  const { expandedValue } = useAccordionContext()
  const isExpanded = expandedValue === itemValue

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Prevent the click from bubbling to AccordionItem
      e.stopPropagation()
      toggleItem(itemValue)
    },
    [toggleItem, itemValue]
  )

  return (
    <h3 className="flex">
      <button
        data-slot="accordion-trigger"
        type="button"
        data-expanded={isExpanded || undefined}
        onClick={handleClick}
        className={cn(
          "flex flex-1 items-center justify-between py-4 text-left text-sm font-medium transition-all hover:underline",
          "data-[expanded]:[&_svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </button>
    </h3>
  )
}

// --------------- AccordionContent ---------------

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const itemValue = useAccordionItemContext()
  const { expandedValue } = useAccordionContext()
  const isExpanded = expandedValue === itemValue

  return (
    <div
      data-slot="accordion-content"
      data-expanded={isExpanded || undefined}
      className={cn(
        "overflow-hidden text-sm transition-all",
        isExpanded
          ? "pb-4 max-h-[500px] opacity-100"
          : "max-h-0 opacity-0",
        className
      )}
      {...props}
    >
      <div className="pt-0">{children}</div>
    </div>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

