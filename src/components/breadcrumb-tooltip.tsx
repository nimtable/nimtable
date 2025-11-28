'use client'

import { ReactNode, useState } from 'react'

interface BreadcrumbTooltipProps {
  children: ReactNode
  tooltip: string
  className?: string
}

export function BreadcrumbTooltip({ children, tooltip, className = '' }: BreadcrumbTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <span 
      className={`relative inline-block overflow-visible ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs font-normal bg-muted text-muted-foreground rounded whitespace-nowrap z-[9999] pointer-events-none shadow-sm border border-border">
          {tooltip}
        </span>
      )}
    </span>
  )
}
