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

function escapeCsvText(text: string): string {
  const escaped = text.replace(/"/g, '""')
  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped
}

function isIntegerInRange(
  value: unknown,
  min: number,
  max: number
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  )
}

function isTimestampArray(value: unknown[]): value is number[] {
  if (value.length < 5 || value.length > 7) return false
  if (!value.every(Number.isInteger)) return false

  const [year, month, day, hour, minute, second = 0, nano = 0] = value

  return (
    isIntegerInRange(year, 1000, 9999) &&
    isIntegerInRange(month, 1, 12) &&
    isIntegerInRange(day, 1, 31) &&
    isIntegerInRange(hour, 0, 23) &&
    isIntegerInRange(minute, 0, 59) &&
    isIntegerInRange(second, 0, 59) &&
    isIntegerInRange(nano, 0, 999999999)
  )
}

function padDatePart(value: number, length = 2): string {
  return String(value).padStart(length, "0")
}

function formatTimestampArray(value: number[]): string {
  const [year, month, day, hour, minute, second = 0, nano = 0] = value
  const timestamp =
    `${padDatePart(year, 4)}-${padDatePart(month)}-${padDatePart(day)} ` +
    `${padDatePart(hour)}:${padDatePart(minute)}:${padDatePart(second)}`

  return nano > 0 ? `${timestamp}.${padDatePart(nano, 9)}` : timestamp
}

function stringifyComplexCsvValue(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

export function serializeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ""

  if (typeof value === "string") return escapeCsvText(value)

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  if (Array.isArray(value)) {
    if (isTimestampArray(value)) {
      return escapeCsvText(formatTimestampArray(value))
    }

    return escapeCsvText(stringifyComplexCsvValue(value))
  }

  return escapeCsvText(stringifyComplexCsvValue(value))
}

export function rowsToCsv(columns: string[], rows: unknown[][]): string {
  const headers = columns.map(serializeCsvCell).join(",")
  const csvRows = rows
    .map((row) =>
      columns.map((_, index) => serializeCsvCell(row[index])).join(",")
    )
    .join("\n")

  return `${headers}\n${csvRows}`
}
