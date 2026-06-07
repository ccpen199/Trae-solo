import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

interface User {
  id: string
  username: string
  nickname: string
  role: 'user' | 'creator' | 'admin'
  lat?: number
  lng?: number
}

interface LocationState {
  lat: number
  lng: number
  accuracy?: number
  status: 'granted' | 'denied' | 'pending'
  lastUpdated?: string
}

interface AppContextType {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  logout: () => void
  location: LocationState | null
  requestLocation: () => Promise<{ lat: number; lng: number; accuracy?: number } | null>
  refreshLocation: () => Promise<void>
  deviceFingerprint: string
  isDeviceBound: boolean
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  toast: { message: string; type: string; visible: boolean }
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [location, setLocation] = useState<LocationState | null>(null)
  const [deviceFingerprint, setDeviceFingerprint] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false })

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        setUserState(JSON.parse(userStr))
      } catch {}
    }

    const fp = `${navigator.userAgent.slice(0, 20)}-${screen.width}x${screen.height}-${new Date().getTimezoneOffset()}`
    setDeviceFingerprint(fp)
    localStorage.setItem('device_fingerprint', fp)

    if (navigator.geolocation) {
      setLocation((prev) => (prev ? prev : { status: 'pending', lat: 39.9042, lng: 116.4074 }))
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            status: 'granted',
            lastUpdated: new Date().toISOString(),
          })
        },
        () => {
          setLocation((prev) =>
            prev ? { ...prev, status: 'denied' } : { status: 'denied', lat: 39.9042, lng: 116.4074 },
          )
        },
        { timeout: 8000 },
      )
    }
  }, [])

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser)
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser))
    } else {
      localStorage.removeItem('user')
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUserState(null)
  }, [])

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setToast({ message: '浏览器不支持定位功能', type: 'error', visible: true })
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000)
      return null
    }

    setLocation((prev) =>
      prev ? { ...prev, status: 'pending' } : { status: 'pending', lat: 39.9042, lng: 116.4074 },
    )

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true })
      })

      const result = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        status: 'granted' as const,
        lastUpdated: new Date().toISOString(),
      }

      setLocation(result)
      setToast({ message: `定位成功！精度 ${Math.round(pos.coords.accuracy)}m`, type: 'success', visible: true })
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000)

      return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
    } catch {
      setLocation((prev) =>
        prev ? { ...prev, status: 'denied' } : { status: 'denied', lat: 39.9042, lng: 116.4074 },
      )
      setToast({ message: '定位失败，请检查定位权限', type: 'error', visible: true })
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000)
      return null
    }
  }, [])

  const refreshLocation = useCallback(async () => {
    await requestLocation()
  }, [requestLocation])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000)
  }, [])

  const value = useMemo(
    () => ({
      user,
      setUser,
      isAuthenticated: !!user && !!localStorage.getItem('token'),
      logout,
      location,
      requestLocation,
      refreshLocation,
      deviceFingerprint,
      isDeviceBound: !!deviceFingerprint,
      showToast,
      toast,
    }),
    [user, setUser, logout, location, requestLocation, refreshLocation, deviceFingerprint, showToast, toast],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
