/*
 * Copyright 2026 Nimtable
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface IcebergErrorResponse {
  error: {
    message: string
  }
}

export function errorToString(error: unknown): string {
  if (typeof error === "string") {
    return error
  }
  // Nimtable backend error shape (generated as `_Error`)
  // { code: string; message: string; details?: string }
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    const message = (error as { message: string }).message
    const details =
      "details" in error &&
      typeof (error as { details?: unknown }).details === "string"
        ? (error as { details: string }).details
        : ""
    return details ? `${message} (${details})` : message
  }
  // IcebergErrorResponse
  if (
    error &&
    typeof error === "object" &&
    "error" in error &&
    error.error &&
    typeof error.error === "object" &&
    "message" in error.error &&
    typeof error.error.message === "string"
  ) {
    return (error as IcebergErrorResponse).error.message
  }
  // Error
  if (error instanceof Error) {
    return error.message
  }
  // Fallback
  return "Unknown error"
}
