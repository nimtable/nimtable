"use client"

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  disableDemoMode,
  enableDemoMode,
  isDemoModeEnabled,
} from "@/lib/demo-mode"

type DemoModeContextValue = {
  demoMode: boolean
  enable: () => void
  disable: () => void
}

const DemoModeContext = createContext<DemoModeContextValue>({
  demoMode: false,
  enable: () => {},
  disable: () => {},
})

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoMode] = useState<boolean>(false)

  useEffect(() => {
    setDemoMode(isDemoModeEnabled())
  }, [])

  const value = useMemo(
    () => ({
      demoMode,
      enable: () => {
        enableDemoMode()
        setDemoMode(true)
      },
      disable: () => {
        disableDemoMode()
        setDemoMode(false)
      },
    }),
    [demoMode]
  )

  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  )
}

export function useDemoMode() {
  return useContext(DemoModeContext)
}
