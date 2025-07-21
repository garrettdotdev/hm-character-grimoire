import { useState, useEffect, useRef, useCallback } from 'react'

export function useFormDirty<T extends Record<string, any>>(initialData: T) {
  const [isDirty, setIsDirty] = useState(false)
  const initialDataRef = useRef<T>()
  const initialDataStringRef = useRef<string>()

  // Initialize refs on first render or when initialData changes significantly
  useEffect(() => {
    const initialDataString = JSON.stringify(initialData)
    if (initialDataStringRef.current !== initialDataString) {
      initialDataRef.current = initialData
      initialDataStringRef.current = initialDataString
      setIsDirty(false)
    }
  }, [initialData])

  // Check if current data differs from initial data
  const checkDirty = useCallback((data: T) => {
    if (!initialDataRef.current) return false

    const currentDataString = JSON.stringify(data)
    const dirty = currentDataString !== initialDataStringRef.current
    setIsDirty(dirty)
    return dirty
  }, [])

  // Update current data and check if dirty
  const updateData = useCallback((data: T) => {
    return checkDirty(data)
  }, [checkDirty])

  // Reset to initial state
  const resetDirty = useCallback(() => {
    setIsDirty(false)
  }, [])

  // Mark as clean (useful after successful save)
  const markClean = useCallback((currentData: T) => {
    const currentDataString = JSON.stringify(currentData)
    initialDataRef.current = currentData
    initialDataStringRef.current = currentDataString
    setIsDirty(false)
  }, [])

  return {
    isDirty,
    updateData,
    resetDirty,
    markClean,
    checkDirty
  }
}
