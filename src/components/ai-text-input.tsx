"use client"

import React, {
  useState,
  useTransition,
  useCallback,
  useEffect,
  useRef,
} from "react"
import { Button } from "@/components/ui/button"
import { AutoResizeTextarea } from "@/components/ui/textarea"
import { Sparkles, Save, Loader2, Edit3, X } from "lucide-react"
import { cn } from "@/lib/utils"

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
}: AITextInputProps) {
  const [isTransitionPending, startTransition] = useTransition()

  const [isEditMode, setIsEditMode] = useState(startInEditMode)
  const [isAiGenerating, setIsAiGenerating] = useState(false)

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleCancel = () => {
    setIsEditMode(false)
  }

  const loading_ = isTransitionPending || loading || isAiGenerating

  // Preview Component
  const PreviewContent = () => {
    const [additionalPrompt, setAdditionalPrompt] = useState("")
    const [showAdditionalPrompt, setShowAdditionalPrompt] = useState(false)

    const handleAiGenerate = async () => {
      setIsAiGenerating(true)
      startTransition(async () => {
        try {
          console.log("handleAiGenerate", additionalPrompt, content)
          await aiGenerateAction(additionalPrompt, content)
          // Clear the prompt and hide input after successful generation
          setAdditionalPrompt("")
          setShowAdditionalPrompt(false)
        } catch (error) {
          console.error("Error generating content:", error)
          // You might want to show an error toast here
        } finally {
          setIsAiGenerating(false)
        }
      })
    }

    return (
      <div className="space-y-2">
        <div className="rounded-md border border-muted/30 bg-muted/30 p-1.5 font-mono">
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-gray-800 text-xs">
              {isTransitionPending ? "Generating..." : content || placeholder}
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            {successMessage}
          </div>
        )}

        {/* Action Buttons */}
        {!loading_ && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-end">
              <div className="flex gap-2">
                {!showAdditionalPrompt ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdditionalPrompt(true)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs h-7"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Generate
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleAiGenerate}
                    disabled={loading_}
                    className="bg-blue-600 hover:bg-blue-700 text-xs h-7"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Generate
                  </Button>
                )}
                <Button
                  onClick={handleEdit}
                  className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs h-7"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>

            {/* AI Prompt Input - Collapsible */}
            <div
              className={cn(
                "transition-all duration-200 ease-in-out overflow-hidden",
                showAdditionalPrompt
                  ? "max-h-32 opacity-100"
                  : "max-h-0 opacity-0"
              )}
            >
              <AutoResizeTextarea
                key="ai-prompt-textarea"
                placeholder={aiPromptPlaceholder}
                value={additionalPrompt}
                onChange={(e) => setAdditionalPrompt(e.target.value)}
                className="border-dashed border-blue-200 focus:border-blue-400 text-xs min-h-[32px]"
                disabled={loading_}
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading_ && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isAiGenerating ? "Generating content..." : "Loading..."}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Edit Component
  const EditContent = () => {
    const [editContent, setEditContent] = useState(content)
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
    }, []) // Empty dependency array ensures this runs only on mount

    const handleSave = useCallback(async () => {
      try {
        startTransition(async () => {
          await saveAction(editContent)
        })
        setIsEditMode(false) // Switch to preview after saving
      } catch (error) {
        console.error("Error saving content:", error)
        throw error // Re-throw to let calling function handle it
      }
    }, [saveAction, editContent])

    return (
      <div className="space-y-2">
        {/* Main Text Area */}
        <div className="prose prose-sm max-w-none">
          <div className="rounded-md border border-muted/30 bg-muted/30 p-1.5 font-mono">
            <AutoResizeTextarea
              ref={textareaRef}
              placeholder={placeholder}
              value={editContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setEditContent(e.target.value)
              }}
              className="text-xs md:text-xs text-muted-foreground border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-medium"
              disabled={loading_}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          {
            <Button
              onClick={handleCancel}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs h-7"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          }
          <Button
            onClick={() => startTransition(() => handleSave())}
            disabled={!editContent.trim() || loading_}
            className="bg-gray-900 hover:bg-gray-800 text-xs h-7"
          >
            {loading_ ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground">
        Table Summary
      </h4>
      {isEditMode ? <EditContent /> : <PreviewContent />}
    </div>
  )
}
