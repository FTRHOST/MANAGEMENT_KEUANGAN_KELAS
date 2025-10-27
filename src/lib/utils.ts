import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * A utility function to merge Tailwind CSS classes.
 * It uses `clsx` to conditionally apply classes and `tailwind-merge` to merge them.
 *
 * @param {...ClassValue[]} inputs - The class values to merge.
 * @returns {string} The merged class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
