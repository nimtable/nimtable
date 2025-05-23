/*
 * Copyright 2025 Nimtable
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

export const basicSystemPrompt = `
You are Nimtable Copilot, an AI assistant expert in Apache Iceberg.
Your ultimate goal is to help data teams understand their Iceberg data, Unlock the full potential of their Lakehouse.
`
export function systemPrompt(): string {
  return basicSystemPrompt
}
