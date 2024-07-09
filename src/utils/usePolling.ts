import { useState, useEffect, useCallback, useRef } from 'react'

type PollingFunction = () => Promise<any>

interface UsePollingResult {
  startPolling: () => void
  stopPolling: () => void
  isPolling: boolean
}

const usePolling = (
  pollingFunction: PollingFunction,
  interval: number = 3000,
): UsePollingResult => {
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const isPollingRef = useRef(isPolling)

  const startPolling = useCallback(() => {
    if (!isPollingRef.current) {
      setIsPolling(true)
      isPollingRef.current = true

      const executePolling = async () => {
        await pollingFunction()
        if (isPollingRef.current) {
          intervalRef.current = window.setTimeout(executePolling, interval)
        }
      }
      executePolling()
    }
  }, [pollingFunction, interval])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current)
      intervalRef.current = null
    }
    setIsPolling(false)
    isPollingRef.current = false
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
      }
      isPollingRef.current = false
    }
  }, [])

  useEffect(() => {
    isPollingRef.current = isPolling
  }, [isPolling])

  return { startPolling, stopPolling, isPolling }
}

export default usePolling
