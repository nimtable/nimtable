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
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { AlertCircle, LockIcon, User } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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
  const { login } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect") || "/dashboard"

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
        const errorMessage = "Invalid username or password"
        setError(errorMessage)
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        })
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
      const errorMessage = "An error occurred during login"
      setError(errorMessage)
      toast({
        title: "Login error",
        description: errorMessage,
        variant: "destructive",
      })
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
    <div
      className="fixed h-screen w-screen overflow-auto bg-cover text-center"
      style={{
        backgroundImage: `url(/login_bg.png)`,
      }}
    >
      <div className="inline-block">
        <div className="relative mx-auto flex min-h-screen items-center justify-center pb-10">
          <div className="hidden pr-8 pt-12 text-start lg:block">
            <p className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Nimtable Logo"
                width={50}
                height={50}
              />
              <span className="text-4xl font-medium leading-[38px] text-[#FAFAFA]">
                Nimtable
              </span>
            </p>
            <p className="w-[480px] pb-8 pt-5 text-[32px] font-medium leading-[38px] text-[#FAFAFA]">
              The Control Plane for <br /> Apache Iceberg™
            </p>

            <Image
              src="/login_logo.png"
              alt="Nimtable Logo"
              width={166}
              height={40}
              className="h-10"
            />

            <p className="text-base text-gray-500 mt-7">
              A lightweight, easy-to-use platform to monitor, optimize, <br />{" "}
              and govern your Iceberg-based lakehouse.
            </p>
          </div>
          <div className="flex flex-col bg-white border-[#E6E6E6] rounded-2xl w-90 px-10 py-8">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-[#062535] text-left block"
                >
                  Username
                </Label>
                <div className="group/input relative">
                  <User
                    className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${error ? "text-red-400" : "text-[#062535] group-focus-within/input:text-[#062535]"}`}
                  />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    className={`h-12 bg-white/10 pl-10 text-[#062535] transition-all placeholder:text-[#062535]/40 ${
                      error
                        ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50"
                        : ""
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
                  className="text-sm font-medium text-[#062535] text-left block"
                >
                  Password
                </Label>
                <div className="group/input relative">
                  <LockIcon
                    className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${error ? "text-red-400" : "text-[#062535] group-focus-within/input:text-[#062535]"}`}
                  />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className={`h-12 bg-white/10 pl-10 text-[#062535] transition-all placeholder:text-[#062535]/40 ${
                      error
                        ? "animate-pulse-once border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50"
                        : ""
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
                className="h-12 w-full from-[#062535] to-[#062535] font-medium text-white shadow-lg shadow-[#062535]/20 transition-all duration-300 hover:from-[#062535] hover:to-[#062535] hover:shadow-[#062535]/40 group-hover:translate-y-0.5"
              >
                Login
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
