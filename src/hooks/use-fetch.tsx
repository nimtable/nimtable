import { useEffect, useState } from 'react'

interface FetchState<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

export function useFetch<T>(url: string) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    loading: true,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setState({ data, error: null, loading: false })
      } catch (error) {
        setState({ 
          data: null, 
          error: error instanceof Error ? error : new Error('An error occurred'), 
          loading: false 
        })
      }
    }

    fetchData()
  }, [url])

  return state
}
