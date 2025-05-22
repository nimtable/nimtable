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

"use client"

import type React from "react"

import { useRouter, useSearchParams } from "next/navigation"
import { User, Lock, AlertCircle } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

// Add a pulse animation for error states
const pulseErrorAnimation = `
  @keyframes pulse-once {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
    }
    50% {
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
    }
  }
  .animate-pulse-once {
    animation: pulse-once 0.8s ease-out;
  }
`

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect") || "/dashboard"

  // Animation effect when component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const success = await login(username, password)
      if (success) {
        toast({
          title: "Login successful",
          description: "Welcome back to Nimtable",
        })
        router.push(redirectPath)
      } else {
        setError("Invalid username or password")
        // Add shake animation to the form
        if (formRef.current) {
          formRef.current.classList.add("animate-shake")
          // Remove the class after animation completes
          setTimeout(() => {
            if (formRef.current) {
              formRef.current.classList.remove("animate-shake")
            }
          }, 500)
        }
      }
    } catch (err) {
      setError("An error occurred during login")
      console.error(err)
    }
  }

  // Add the animation style
  useEffect(() => {
    if (error) {
      // Add the animation style to the document head
      const styleElement = document.createElement("style")
      styleElement.innerHTML = pulseErrorAnimation
      document.head.appendChild(styleElement)

      return () => {
        document.head.removeChild(styleElement)
      }
    }
  }, [error])

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      {/* Enhanced animated background elements with flowing animations */}
      <div className="absolute left-0 top-0 h-full w-full overflow-hidden">
        {/* Improved gradient overlay with more depth */}
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-blue-950/95 via-blue-900/85 to-blue-800/90"></div>

        {/* Animated flowing background elements */}
        <div className="bg-blue-400/8 animate-wave animate-flow-diagonal absolute left-[-10%] top-[-5%] h-[60%] w-[70%] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-3xl"></div>

        <div
          className="bg-blue-500/8 animate-wave animate-flow-diagonal-reverse absolute bottom-[-10%] right-[-5%] h-[70%] w-[60%] rounded-[40%_60%_70%_30%/60%_40%_30%_60%] blur-3xl"
          style={{ animationDelay: "-5s" }}
        ></div>

        <div
          className="bg-indigo-400/8 animate-wave animate-flow-x absolute right-[10%] top-[20%] h-[40%] w-[45%] rounded-[50%_60%_30%_40%/40%_30%_70%_60%] blur-2xl"
          style={{ animationDelay: "-10s" }}
        ></div>

        <div
          className="bg-blue-300/8 animate-wave animate-flow-y absolute bottom-[30%] left-[15%] h-[35%] w-[40%] rounded-[30%_60%_70%_40%/50%_60%_30%_60%] blur-2xl"
          style={{ animationDelay: "-15s" }}
        ></div>

        {/* Refined animated circles with better positioning and effects */}
        <div
          className="animate-pulse-slow animate-flow-x absolute left-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-blue-400/10 blur-2xl"
          style={{ animationDelay: "-8s" }}
        ></div>

        <div
          className="animate-pulse-slower animate-flow-diagonal absolute bottom-1/4 right-1/3 h-[700px] w-[700px] rounded-full bg-blue-500/10 blur-3xl"
          style={{ animationDelay: "-12s" }}
        ></div>

        <div
          className="animate-float animate-flow-y absolute right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-blue-300/10 blur-xl"
          style={{ animationDelay: "-6s" }}
        ></div>

        <div
          className="animate-float-reverse animate-flow-diagonal-reverse absolute bottom-1/3 left-1/3 h-[300px] w-[300px] rounded-full bg-indigo-400/10 blur-xl"
          style={{ animationDelay: "-10s" }}
        ></div>

        {/* Enhanced grid pattern overlay with better opacity */}
        <div className="opacity-4 absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMxNDI3NEUiIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6TTAgMzBoMzB2MzBIMHoiIGZpbGw9IiMxNDI3NEUiIGZpbGwtb3BhY2l0eT0iLjUiLz48cGF0aCBkPSJNMzAgMGgzMHYzMEgzMHpNMCAwaDMwdjMwSDB6IiBmaWxsPSIjMTQyNzRFIiBmaWxsLW9wYWNpdHk9Ii4yNSIvPjwvZz48L3N2Zz4=')]"></div>
      </div>

      {/* Refined content container with improved transitions */}
      <div
        className={`relative z-20 mx-auto w-full max-w-6xl px-6 py-12 transition-all duration-1000 ease-out ${mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
      >
        <div className="flex flex-col items-center gap-10 md:flex-row md:gap-20">
          {/* Enhanced left side - Branding with improved typography and spacing */}
          <div
            className="animate-fade-in-up mb-10 w-full text-center md:mb-0 md:w-3/5 md:text-left"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="-ml-10 flex items-center justify-center md:justify-start">
              <Image
                src="/horizontal-dark.svg"
                alt="Nimtable Logo"
                width={160}
                height={50}
                className="h-32 w-auto filter"
              />
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              <span className="text-white">The Control Plane for </span>
              <span className="bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent">
                Apache Iceberg™
              </span>
            </h1>

            <p className="mx-auto max-w-md text-lg leading-relaxed text-blue-100/80 md:mx-0 md:text-xl">
              A lightweight, easy-to-use platform to monitor, optimize, and
              govern your Iceberg-based lakehouse.
            </p>
          </div>

          {/* Enhanced right side - Login form with improved styling and interactions */}
          <div
            className="animate-fade-in-up w-full max-w-md md:w-1/2"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="group overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)]">
              {/* Added accent bar at the top */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600"></div>

              <div className="p-8 md:p-10">
                <div className="mb-8">
                  <h2 className="mb-2 text-2xl font-bold text-white">
                    Login to Nimtable
                  </h2>
                  <p className="text-sm text-blue-100/70">
                    Enter your credentials to access your data catalogs
                  </p>
                </div>

                {error && (
                  <div className="animate-fade-in mb-6 flex items-start gap-3 rounded-lg border-l-4 border-red-500 bg-red-500/20 p-4 text-red-200 shadow-sm">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-300" />
                    <div>
                      <h4 className="mb-0.5 text-sm font-semibold text-red-300">
                        Authentication Failed
                      </h4>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}

                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="username"
                      className="text-sm font-medium text-blue-100"
                    >
                      Username
                    </Label>
                    <div className="group/input relative">
                      <User
                        className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${error ? "text-red-400" : "text-blue-300 group-focus-within/input:text-blue-400"}`}
                      />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        className={`h-11 bg-white/10 pl-10 text-white transition-all placeholder:text-blue-200/40 ${
                          error
                            ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50"
                            : "border-white/20 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/50"
                        }`}
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value)
                          if (error) setError(null) // Clear error when user starts typing again
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-blue-100"
                    >
                      Password
                    </Label>
                    <div className="group/input relative">
                      <Lock
                        className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${error ? "text-red-400" : "text-blue-300 group-focus-within/input:text-blue-400"}`}
                      />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className={`h-11 bg-white/10 pl-10 text-white transition-all placeholder:text-blue-200/40 ${
                          error
                            ? "animate-pulse-once border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50"
                            : "border-white/20 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/50"
                        }`}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          if (error) setError(null) // Clear error when user starts typing again
                        }}
                        required
                      />
                      {error && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-400">
                          <AlertCircle className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full bg-gradient-to-r from-blue-500 to-blue-600 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/40 group-hover:translate-y-0.5"
                  >
                    Login
                  </Button>
                </form>
              </div>
            </div>

            {/* Enhanced footer text with better styling */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center">
                <Image
                  src="/horizontal-dark.svg"
                  alt="Nimtable Logo"
                  width={120}
                  height={32}
                  className="-mr-2 -mt-[2px] h-8 w-auto brightness-0 invert filter"
                />
                <p className="text-xs text-blue-200/70">
                  v1.0 — Managed Iceberg Made Simple
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
