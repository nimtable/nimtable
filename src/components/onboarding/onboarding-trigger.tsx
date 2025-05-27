"use client"

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import { useState, useEffect } from "react"

export function OnboardingTrigger({
  open = false,
  onComplete,
}: {
  open?: boolean
  onComplete?: () => void
}) {
  const [showOnboarding, setShowOnboarding] = useState(open)

  useEffect(() => {
    if (open) {
      setShowOnboarding(true)
    }
  }, [open])

  const handleComplete = () => {
    setShowOnboarding(false)
    localStorage.setItem("nimtable-has-visited", "true")
    onComplete?.()
  }

  const handleDismiss = () => {
    setShowOnboarding(false)
    localStorage.setItem("nimtable-has-visited", "true")
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingFlow onComplete={handleComplete} onDismiss={handleDismiss} />
      )}
    </>
  )
}
