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

export async function GET() {
  try {
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/optimize/scheduled-tasks`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch scheduled tasks')
    }
    
    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error('Error fetching scheduled tasks:', error)
    return Response.json(
      { error: 'Failed to fetch scheduled tasks' },
      { status: 500 }
    )
  }
} 