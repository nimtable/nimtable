"use client"

import { ConnectCatalogStep } from "./connect-catalog-step"
import { IntroductionStep } from "./introduction-step"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useState } from "react"

type OnboardingFlowProps = {
  onComplete: () => void
  onDismiss: () => void
}

export function OnboardingFlow({ onComplete, onDismiss }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)

  const goToNextStep = () => {
    setCurrentStep(currentStep + 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
              {currentStep}
            </div>
            <h2 className="text-xl font-semibold">
              {currentStep === 1 && "Welcome to Nimtable"}
              {currentStep === 2 && "Connect Your Catalog"}
              {currentStep === 3 && "Try the Nimtable Copilot"}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="text-gray-500"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {currentStep === 1 && <IntroductionStep onNext={goToNextStep} />}
          {currentStep === 2 && (
            <ConnectCatalogStep
              onSuccess={() => {
                setTimeout(() => {
                  onComplete()
                }, 1000)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
