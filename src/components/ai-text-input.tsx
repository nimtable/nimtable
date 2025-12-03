"use client"

import React, {
  useState,
  useTransition,
  useCallback,
  useEffect,
  useRef,
} from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Check, FileText } from "lucide-react"

/**
 * AITextInput Component
 *
 * A flexible text input component with AI generation capabilities that supports
 * both editing and preview modes. Perfect for content creation with AI assistance.
 *
 */

export interface AITextInputProps {
  /** Title displayed in the card header */
  title: string
  /** Placeholder text for the main textarea */
  placeholder: string
  /** content value */
  content: string
  /** Placeholder for AI prompt input */
  aiPromptPlaceholder: string
  /** Callback when save button is clicked */
  saveAction: (content: string) => Promise<void>
  /** Custom AI generation function. */
  aiGenerateAction: (
    additionalPrompt?: string,
    currentContent?: string
  ) => Promise<void>
  /** Additional CSS classes */
  className?: string
  /** Whether to start in edit mode (default: true if no initialValue) */
  startInEditMode: boolean
  /** Last updated time */
  lastUpdatedTime?: string
  /** Loading state from parent component */
  loading?: boolean
  /** Error state */
  error?: string
  /** Success message after save */
  successMessage?: string
}

export function AITextInput({
  placeholder = "Enter your content here...",
  content = "",
  aiPromptPlaceholder,
  saveAction,
  aiGenerateAction,
  startInEditMode,
  loading = false,
  error,
  successMessage,
  lastUpdatedTime,
}: AITextInputProps) {
  const [isTransitionPending, startTransition] = useTransition()

  const [isEditMode, setIsEditMode] = useState(startInEditMode)
  const [isAiGenerating, setIsAiGenerating] = useState(false)

  const loading_ = isTransitionPending || loading || isAiGenerating

  const handleAiGenerate = async () => {
    setIsAiGenerating(true)
    startTransition(async () => {
      try {
        await aiGenerateAction(undefined, content)
      } catch (error) {
        console.error("Error generating content:", error)
      } finally {
        setIsAiGenerating(false)
      }
    })
  }

  // Preview Component
  const PreviewContent = () => {
    return (
      <div>
        <div className="relative">
          <textarea
            value={content || placeholder}
            readOnly
            onClick={() => setIsEditMode(true)}
            className="w-full p-4 border border-border rounded bg-muted/30 text-sm text-card-foreground placeholder:text-muted-foreground placeholder:italic min-h-[100px] resize-none cursor-text"
          />
          {loading_ && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isAiGenerating ? "Generating content..." : "Loading..."}
              </div>
            </div>
          )}
        </div>
        {successMessage && (
          <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            {successMessage}
          </div>
        )}
      </div>
    )
  }

  // Edit Component
  const EditContent = () => {
    const [editContent, setEditContent] = useState(content)
    const [isEditingContext, setIsEditingContext] = useState(true)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto focus and move cursor to end when EditContent mounts
    useEffect(() => {
      const textarea = textareaRef.current
      if (textarea) {
        // Focus the textarea
        textarea.focus()
        // Move cursor to the end
        const length = editContent.length
        textarea.setSelectionRange(length, length)
      }
    }, [editContent.length])

    const handleSave = useCallback(async () => {
      try {
        startTransition(async () => {
          await saveAction(editContent)
        })
        setIsEditingContext(false)
        setIsEditMode(false) // Switch to preview after saving
      } catch (error) {
        console.error("Error saving content:", error)
        throw error // Re-throw to let calling function handle it
      }
    }, [saveAction, editContent])

    const handleCancel = () => {
      setEditContent(content) // Reset to original content
      setIsEditingContext(false)
      setIsEditMode(false)
    }

    return (
      <div>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onFocus={() => setIsEditingContext(true)}
            placeholder={placeholder}
            className="w-full p-4 border border-border rounded bg-muted/30 text-sm text-card-foreground placeholder:text-muted-foreground placeholder:italic min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading_}
          />
          {loading_ && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isAiGenerating ? "Generating content..." : "Saving..."}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        {isEditingContext && (
          <div className="flex justify-end gap-2 mt-3">
            <Button onClick={handleCancel} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading_} className="gap-2">
              <Check className="w-4 h-4" />
              Save
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-card-foreground">
            Table Context
          </h3>
        </div>
        {!isEditMode && (
          <Button
            variant="secondary"
            className="gap-2"
            onClick={handleAiGenerate}
            disabled={loading_}
          >
            <Sparkles className="w-4 h-4" />
            AI Generate
          </Button>
        )}
      </div>

      <div className="mt-10">
        {isEditMode ? <EditContent /> : <PreviewContent />}
      </div>
      {lastUpdatedTime && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(lastUpdatedTime).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}
