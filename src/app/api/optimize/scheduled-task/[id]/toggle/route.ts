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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { enabled } = await request.json()
    
    const response = await fetch(
      `${process.env.BACKEND_URL || 'http://localhost:8080'}/optimize/scheduled-task/${params.id}/toggle`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      }
    )
    
    if (!response.ok) {
      if (response.status === 404) {
        return Response.json(
          { error: 'Scheduled task not found' },
          { status: 404 }
        )
      }
      throw new Error('Failed to toggle scheduled task')
    }
    
    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error('Error toggling scheduled task:', error)
    return Response.json(
      { error: 'Failed to toggle scheduled task' },
      { status: 500 }
    )
  }
} 