"use client"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

type IntroductionStepProps = {
  onNext: () => void
}

export function IntroductionStep({ onNext }: IntroductionStepProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-8">
        <img
          src="/square-light.svg"
          alt="Nimtable Logo"
          className="mx-auto h-32 w-32"
        />
      </div>

      <h1 className="mb-4 text-3xl font-bold">Welcome to Nimtable</h1>
      <p className="mb-8 max-w-lg text-gray-600">
        Your intelligent copilot and control plane for Apache Iceberg.
        Automatically govern your data lake, get AI-powered insights, and
        preview your data in seconds.
      </p>

      <Button onClick={onNext} size="lg" className="gap-2">
        Get Started
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
