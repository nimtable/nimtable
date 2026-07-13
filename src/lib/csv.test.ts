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

import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { rowsToCsv, serializeCsvCell } from "./csv"

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ""
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const nextChar = line[index + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === "," && !inQuotes) {
      cells.push(current)
      current = ""
      continue
    }

    current += char
  }

  cells.push(current)
  return cells
}

describe("serializeCsvCell", () => {
  it("escapes strings that contain CSV control characters", () => {
    assert.equal(serializeCsvCell("plain"), "plain")
    assert.equal(serializeCsvCell("hello,world"), '"hello,world"')
    assert.equal(serializeCsvCell('hello "world"'), '"hello ""world"""')
    assert.equal(serializeCsvCell("hello\nworld"), '"hello\nworld"')
  })

  it("serializes scalar nullish values", () => {
    assert.equal(serializeCsvCell(null), "")
    assert.equal(serializeCsvCell(undefined), "")
    assert.equal(serializeCsvCell(123), "123")
    assert.equal(serializeCsvCell(true), "true")
  })

  it("formats timestamp arrays without timezone conversion", () => {
    assert.equal(
      serializeCsvCell([2026, 7, 11, 15, 54, 42]),
      "2026-07-11 15:54:42"
    )
    assert.equal(serializeCsvCell([2026, 7, 12, 0, 8]), "2026-07-12 00:08:00")
    assert.equal(
      serializeCsvCell([2026, 7, 12, 20, 4, 18, 546000000]),
      "2026-07-12 20:04:18.546000000"
    )
  })

  it("keeps non-timestamp arrays and objects in one CSV cell", () => {
    assert.equal(serializeCsvCell(["a", "b"]), '"[""a"",""b""]"')
    assert.equal(serializeCsvCell({ a: 1, b: 2 }), '"{""a"":1,""b"":2}"')
  })
})

describe("rowsToCsv", () => {
  it("keeps timestamp values within the expected column count", () => {
    const columns = [
      "dn_request_id",
      "request_timestamp",
      "request_kind_id",
      "request_kind_id_2",
      "facility_id",
      "body_part",
      "body_part_2",
      "body_part_3",
      "note",
      "center_comment",
      "doctor_comment",
      "report_request",
      "report_text",
      "report_impression",
      "report_comment",
      "s3_object_key",
      "s3_object_size",
      "created_at",
      "updated_at",
    ]
    const rows = [
      [
        "REQ-0001",
        [2026, 7, 11, 15, 54, 42],
        0,
        -1,
        7023,
        "Chest",
        "",
        "",
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        "uploads/example.zip",
        132606948,
        [2026, 7, 12, 20, 4, 18, 546000000],
        [2026, 7, 12, 20, 4, 18, 546000000],
      ],
    ]

    const csv = rowsToCsv(columns, rows)
    const [, dataLine] = csv.split("\n")

    assert.equal(parseCsvLine(dataLine).length, columns.length)
  })
})
