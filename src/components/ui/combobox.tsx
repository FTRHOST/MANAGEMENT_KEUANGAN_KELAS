
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Combobox as HeadlessCombobox } from '@headlessui/react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type ComboboxProps = {
  options: { value: string; label: string }[];
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  notFoundText?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  notFoundText = "No option found.",
  disabled = false,
}: ComboboxProps) {
  const [query, setQuery] = React.useState('')

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) => {
          return option.label.toLowerCase().includes(query.toLowerCase())
        })

  const selectedOption = options.find((option) => option.value === value)

  return (
    <HeadlessCombobox value={value} onChange={onChange} disabled={disabled} __demoMode>
      <div className="relative">
        <HeadlessCombobox.Button as={React.Fragment}>
           <Button
              variant="outline"
              role="combobox"
              aria-expanded={true}
              className="w-full justify-between"
              disabled={disabled}
          >
              <HeadlessCombobox.Input
                className="w-full bg-transparent p-0 border-0 focus:ring-0"
                onChange={(event) => setQuery(event.target.value)}
                displayValue={(val: string) => options.find(o => o.value === val)?.label || ""}
                placeholder={placeholder}
              />
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </HeadlessCombobox.Button>
        
        <HeadlessCombobox.Options
          anchor="bottom"
          transition
          className={cn(
            "z-50 mt-1 max-h-60 w-[var(--trigger-width)] overflow-auto rounded-md bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm",
            "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
          )}
        >
          {filteredOptions.length === 0 && query !== '' ? (
            <div className="relative cursor-default select-none py-2 px-4 text-muted-foreground">
              {notFoundText}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <HeadlessCombobox.Option
                key={option.value}
                value={option.value}
                className={({ active }) =>
                  cn(
                    "relative cursor-default select-none py-2 pl-10 pr-4 rounded-sm",
                    active ? "bg-accent text-accent-foreground" : "text-foreground"
                  )
                }
              >
                {({ selected }) => (
                  <>
                    <span
                      className={cn(
                        "block truncate",
                        selected ? "font-medium" : "font-normal"
                      )}
                    >
                      {option.label}
                    </span>
                    {selected ? (
                      <span
                        className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent-foreground"
                      >
                        <Check className="h-4 w-4" />
                      </span>
                    ) : null}
                  </>
                )}
              </HeadlessCombobox.Option>
            ))
          )}
        </HeadlessCombobox.Options>
      </div>
    </HeadlessCombobox>
  )
}
