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

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { User, Lock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
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
    const redirectPath = searchParams.get("redirect") || "/"

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
        <div className="min-h-screen w-full overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
            {/* Enhanced animated background elements with flowing animations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                {/* Improved gradient overlay with more depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/85 to-blue-800/90 z-10"></div>

                {/* Animated flowing background elements */}
                <div className="absolute top-[-5%] left-[-10%] w-[70%] h-[60%] bg-blue-400/8 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-3xl animate-wave animate-flow-diagonal"></div>

                <div
                    className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[70%] bg-blue-500/8 rounded-[40%_60%_70%_30%/60%_40%_30%_60%] blur-3xl animate-wave animate-flow-diagonal-reverse"
                    style={{ animationDelay: "-5s" }}
                ></div>

                <div
                    className="absolute top-[20%] right-[10%] w-[45%] h-[40%] bg-indigo-400/8 rounded-[50%_60%_30%_40%/40%_30%_70%_60%] blur-2xl animate-wave animate-flow-x"
                    style={{ animationDelay: "-10s" }}
                ></div>

                <div
                    className="absolute bottom-[30%] left-[15%] w-[40%] h-[35%] bg-blue-300/8 rounded-[30%_60%_70%_40%/50%_60%_30%_60%] blur-2xl animate-wave animate-flow-y"
                    style={{ animationDelay: "-15s" }}
                ></div>

                {/* Refined animated circles with better positioning and effects */}
                <div
                    className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-400/10 animate-pulse-slow blur-2xl animate-flow-x"
                    style={{ animationDelay: "-8s" }}
                ></div>

                <div
                    className="absolute bottom-1/4 right-1/3 w-[700px] h-[700px] rounded-full bg-blue-500/10 animate-pulse-slower blur-3xl animate-flow-diagonal"
                    style={{ animationDelay: "-12s" }}
                ></div>

                <div
                    className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-300/10 animate-float blur-xl animate-flow-y"
                    style={{ animationDelay: "-6s" }}
                ></div>

                <div
                    className="absolute bottom-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-indigo-400/10 animate-float-reverse blur-xl animate-flow-diagonal-reverse"
                    style={{ animationDelay: "-10s" }}
                ></div>

                {/* Enhanced grid pattern overlay with better opacity */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMxNDI3NEUiIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6TTAgMzBoMzB2MzBIMHoiIGZpbGw9IiMxNDI3NEUiIGZpbGwtb3BhY2l0eT0iLjUiLz48cGF0aCBkPSJNMzAgMGgzMHYzMEgzMHpNMCAwaDMwdjMwSDB6IiBmaWxsPSIjMTQyNzRFIiBmaWxsLW9wYWNpdHk9Ii4yNSIvPjwvZz48L3N2Zz4=')] opacity-4 z-0"></div>
            </div>

            {/* Refined content container with improved transitions */}
            <div
                className={`relative z-20 w-full max-w-6xl mx-auto px-6 py-12 transition-all duration-1000 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
                <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20">
                    {/* Enhanced left side - Branding with improved typography and spacing */}
                    <div
                        className="w-full md:w-3/5 text-center md:text-left mb-10 md:mb-0 animate-fade-in-up"
                        style={{ animationDelay: "0.2s" }}
                    >
                        <div className="flex items-center justify-center md:justify-start -ml-10">
                            <Image
                                src="/horizontal-dark.svg"
                                alt="Nimtable Logo"
                                width={160}
                                height={50}
                                className="h-32 w-auto filter"
                            />
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                            <span className="text-white">The Control Plane for </span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-100">
                                Apache Iceberg™
                            </span>
                        </h1>

                        <p className="text-blue-100/80 text-lg md:text-xl max-w-md mx-auto md:mx-0 leading-relaxed">
                            A lightweight, easy-to-use platform to monitor, optimize, and govern your Iceberg-based lakehouse.
                        </p>
                    </div>

                    {/* Enhanced right side - Login form with improved styling and interactions */}
                    <div className="w-full md:w-1/2 max-w-md animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden transition-all duration-500 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] group">
                            {/* Added accent bar at the top */}
                            <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600"></div>

                            <div className="p-8 md:p-10">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-white mb-2">Login to Nimtable</h2>
                                    <p className="text-blue-100/70 text-sm">Enter your credentials to access your data catalogs</p>
                                </div>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-500/20 border-l-4 border-red-500 rounded-lg flex items-start gap-3 text-red-200 animate-fade-in shadow-sm">
                                        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-300" />
                                        <div>
                                            <h4 className="text-sm font-semibold text-red-300 mb-0.5">Authentication Failed</h4>
                                            <p className="text-sm">{error}</p>
                                        </div>
                                    </div>
                                )}

                                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="username" className="text-blue-100 text-sm font-medium">
                                            Username
                                        </Label>
                                        <div className="relative group/input">
                                            <User
                                                className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${error ? "text-red-400" : "text-blue-300 group-focus-within/input:text-blue-400"}`}
                                            />
                                            <Input
                                                id="username"
                                                type="text"
                                                placeholder="Enter your username"
                                                className={`pl-10 h-11 bg-white/10 text-white placeholder:text-blue-200/40 transition-all ${error
                                                    ? "border-red-500 focus-visible:ring-red-500/50 focus-visible:border-red-500"
                                                    : "border-white/20 focus-visible:ring-blue-400/50 focus-visible:border-blue-400/50"
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
                                        <Label htmlFor="password" className="text-blue-100 text-sm font-medium">
                                            Password
                                        </Label>
                                        <div className="relative group/input">
                                            <Lock
                                                className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${error ? "text-red-400" : "text-blue-300 group-focus-within/input:text-blue-400"}`}
                                            />
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="Enter your password"
                                                className={`pl-10 h-11 bg-white/10 text-white placeholder:text-blue-200/40 transition-all ${error
                                                    ? "border-red-500 focus-visible:ring-red-500/50 focus-visible:border-red-500 animate-pulse-once"
                                                    : "border-white/20 focus-visible:ring-blue-400/50 focus-visible:border-blue-400/50"
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
                                        className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40 group-hover:translate-y-0.5 duration-300"
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
                                    className="h-8 w-auto filter brightness-0 invert -mr-2 -mt-[2px]"
                                />
                                <p className="text-xs text-blue-200/70">v1.0 — Managed Iceberg Made Simple</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
