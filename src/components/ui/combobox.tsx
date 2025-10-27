
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Combobox as HeadlessCombobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type ComboboxProps = {
  options: { value: string; label: string }[];
  value?: string;
  onChange: (value: string) => void;
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

  const selectedOption = options.find((option) => option.value === value)

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) => {
          return option.label.toLowerCase().includes(query.toLowerCase())
        })

  return (
    <HeadlessCombobox value={value} onChange={onChange} disabled={disabled} onClose={() => setQuery('')}>
      <div className="relative">
        <HeadlessCombobox.Input
          as={React.Fragment}
          onChange={(event) => setQuery(event.target.value)}
          displayValue={(val: string) => options.find(o => o.value === val)?.label || ""}
        >
          <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between"
              disabled={disabled}
              as="div"
          >
              <span className="truncate">
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </HeadlessCombobox.Input>
        
        <ComboboxOptions
          anchor="bottom"
          transition
          className={cn(
            "z-50 mt-1 max-h-60 w-[var(--radix-combobox-trigger-width)] overflow-auto rounded-md bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm",
            "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
          )}
        >
          {filteredOptions.length === 0 && query !== '' ? (
            <div className="relative cursor-default select-none py-2 px-4 text-muted-foreground">
              {notFoundText}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <ComboboxOption
                key={option.value}
                value={option.value}
                className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-accent data-[focus]:text-accent-foreground"
              >
                <Check
                  className={cn(
                    "invisible size-4",
                    "group-data-[selected]:visible"
                  )}
                />
                <div className="text-sm/6">{option.label}</div>
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </HeadlessCombobox>
  )
}
