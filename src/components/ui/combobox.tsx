
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Combobox as HeadlessCombobox } from '@headlessui/react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
    <HeadlessCombobox value={value} onChange={onChange} disabled={disabled} as="div" className="relative w-full">
      <div className="relative">
        <HeadlessCombobox.Button as={React.Fragment}>
            <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
                disabled={disabled}
            >
                {selectedOption ? selectedOption.label : placeholder}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </HeadlessCombobox.Button>
        <HeadlessCombobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover text-popover-foreground shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            <div className="p-1">
                <HeadlessCombobox.Input 
                    as={Input}
                    placeholder={placeholder}
                    onChange={(event) => setQuery(event.target.value)} 
                    className="w-full h-9"
                    autoComplete="off"
                />
            </div>
            <div className="max-h-48 overflow-y-auto">
                {filteredOptions.length === 0 && query !== '' ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-muted-foreground">
                    {notFoundText}
                    </div>
                ) : (
                filteredOptions.map((option) => (
                    <HeadlessCombobox.Option
                        key={option.value}
                        className={({ active }) =>
                            cn(
                            'relative cursor-default select-none py-2 pl-10 pr-4',
                            active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                            )
                        }
                        value={option.value}
                        >
                        {({ selected }) => (
                            <>
                            <span
                                className={cn(
                                'block truncate',
                                selected ? 'font-medium' : 'font-normal'
                                )}
                            >
                                {option.label}
                            </span>
                            {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                <Check className="h-5 w-5" aria-hidden="true" />
                                </span>
                            ) : null}
                            </>
                        )}
                    </HeadlessCombobox.Option>
                ))
                )}
            </div>
        </HeadlessCombobox.Options>
      </div>
    </HeadlessCombobox>
  )
}
