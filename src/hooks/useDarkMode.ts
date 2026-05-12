import { useEffect, useState } from 'react'

const STORAGE_KEY = 'gfqr.darkMode'

function readInitial(): boolean {
  if (typeof window === 'undefined') return false
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useDarkMode(): [boolean, () => void] {
  const [isDark, setIsDark] = useState<boolean>(readInitial)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      window.localStorage.setItem(STORAGE_KEY, 'dark')
    } else {
      root.classList.remove('dark')
      window.localStorage.setItem(STORAGE_KEY, 'light')
    }
  }, [isDark])

  const toggle = () => setIsDark((v) => !v)
  return [isDark, toggle]
}
