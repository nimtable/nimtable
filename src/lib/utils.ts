import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function errorToString(error: any) {
  // IcebergErrorResponse
  if (error.error && error.error.message) {
    return error.error.message
  }
  // Error
  if (error instanceof Error) {
    return error.message
  }
  // Fallback
  return String(error)
}
