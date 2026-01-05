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
import type { LucideIcon } from "lucide-react"

interface PageLoaderProps {
  icon: LucideIcon
  title: string
  entity?: string
  entityType?: string
}

export function PageLoader({
  icon: Icon,
  title,
  entity,
  entityType,
}: PageLoaderProps) {
  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="flex flex-col items-center gap-5 text-center max-w-xs bg-background/60 backdrop-blur-sm p-8 rounded-xl border shadow-sm">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-muted border-t-blue-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-medium">{title}</h3>
          {entity && (
            <p className="text-sm text-muted-foreground">
              {entityType && `${entityType}: `}
              <span className="font-medium text-blue-500">{entity}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
