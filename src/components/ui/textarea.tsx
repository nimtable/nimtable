import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Use the forwarded ref or our internal ref
  const actualRef = (ref as React.RefObject<HTMLTextAreaElement>) || textareaRef

  const adjustHeight = React.useCallback(() => {
    const textarea = actualRef.current
    if (!textarea) return

    // Reset height to auto to get the natural height
    textarea.style.height = "auto"

    // Calculate the new height
    const newHeight = textarea.scrollHeight

    // Set the new height
    textarea.style.height = `${newHeight}px`
  }, [actualRef])

  // Adjust height on value change
  React.useEffect(() => {
    adjustHeight()
  }, [props.value, adjustHeight])

  // Adjust height on mount
  React.useLayoutEffect(() => {
    adjustHeight()
  }, [adjustHeight])

  return (
    <textarea
      {...props}
      ref={actualRef}
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none overflow-hidden",
        className
      )}
      style={{
        ...props.style,
      }}
      onInput={adjustHeight}
    />
  )
})
AutoResizeTextarea.displayName = "AutoResizeTextarea"

export { Textarea, AutoResizeTextarea }
