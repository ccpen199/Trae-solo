import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react'
import { City, ServiceGuide, ItemCategory, SubjectType, User, ReviewStatus } from '../types'
import { cities } from '../data/cities'
import { serviceGuides as initialGuides } from '../data/serviceGuides'
import { users } from '../data/analytics'

type MaterialCountRange = 'all' | 'few' | 'medium' | 'many'
type PromiseTimeRange = 'all' | 'instant' | 'short' | 'medium' | 'long'
type HasOnlineEntry = 'all' | 'yes' | 'no'
type HasExampleImage = 'all' | 'yes' | 'no'

type SearchFilters = {
  keyword: string
  category: ItemCategory | 'all'
  subjectType: SubjectType | 'all'
  materialCount: MaterialCountRange
  promiseTime: PromiseTimeRange
  hasOnlineEntry: HasOnlineEntry
  hasExampleImage: HasExampleImage
}

type AppContextType = {
  currentCity: City
  setCurrentCity: (city: City) => void
  cities: City[]
  guides: ServiceGuide[]
  setGuides: React.Dispatch<React.SetStateAction<ServiceGuide[]>>
  filters: SearchFilters
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>
  filteredGuides: ServiceGuide[]
  currentUser: User
  loading: boolean
  setLoading: (loading: boolean) => void
  updateGuideStatus: (guideId: string, status: ReviewStatus, comment?: string) => void
  getGuideById: (id: string) => ServiceGuide | undefined
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>
  resetFilters: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentCity, setCurrentCity] = useState<City>(cities[0])
  const [guides, setGuides] = useState<ServiceGuide[]>(initialGuides)
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    category: 'all',
    subjectType: 'all',
    materialCount: 'all',
    promiseTime: 'all',
    hasOnlineEntry: 'all',
    hasExampleImage: 'all',
  })
  const [currentUser] = useState<User>(users[0])
  const [loading, setLoading] = useState<boolean>(false)

  const withLoading = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true)
    try {
      return await fn()
    } finally {
      setLoading(false)
    }
  }

  const filteredGuides = useMemo(() => {
    const category = filters.category || 'all'
    const subjectType = filters.subjectType || 'all'
    const materialCount = filters.materialCount || 'all'
    const promiseTime = filters.promiseTime || 'all'
    const hasOnlineEntry = filters.hasOnlineEntry || 'all'
    const hasExampleImage = filters.hasExampleImage || 'all'

    const parseWorkDays = (str: string): number => {
      const match = str.match(/(\d+)/)
      if (!match) return 0
      const num = parseInt(match[1], 10)
      if (str.includes('当日') || str.includes('即时') || str.includes('当场')) return 0
      return num
    }

    return guides.filter((guide) => {
      if (guide.cityId !== currentCity.id) return false
      if (guide.reviewStatus !== 'published') return false

      if (category !== 'all' && guide.category !== category) return false

      if (subjectType !== 'all') {
        if (guide.subjectType !== 'both' && guide.subjectType !== subjectType) return false
      }

      if (materialCount !== 'all') {
        const count = guide.materials.length
        if (materialCount === 'few' && count > 2) return false
        if (materialCount === 'medium' && (count < 3 || count > 5)) return false
        if (materialCount === 'many' && count < 6) return false
      }

      if (promiseTime !== 'all') {
        const days = parseWorkDays(guide.timeLimit.promise)
        if (promiseTime === 'instant' && days > 0) return false
        if (promiseTime === 'short' && (days < 1 || days > 3)) return false
        if (promiseTime === 'medium' && (days < 4 || days > 7)) return false
        if (promiseTime === 'long' && days < 8) return false
      }

      if (hasOnlineEntry !== 'all') {
        const hasOnline = guide.onlineEntries && guide.onlineEntries.length > 0
        if (hasOnlineEntry === 'yes' && !hasOnline) return false
        if (hasOnlineEntry === 'no' && hasOnline) return false
      }

      if (hasExampleImage !== 'all') {
        const hasImg = guide.materials.some((m) => m.exampleImage)
        if (hasExampleImage === 'yes' && !hasImg) return false
        if (hasExampleImage === 'no' && hasImg) return false
      }

      if (filters.keyword && filters.keyword.trim()) {
        const kw = filters.keyword.trim().toLowerCase()
        return (
          guide.title.toLowerCase().includes(kw) ||
          guide.description.toLowerCase().includes(kw) ||
          guide.department.toLowerCase().includes(kw) ||
          guide.materials.some((m) => m.name.toLowerCase().includes(kw))
        )
      }
      return true
    })
  }, [guides, currentCity, filters])

  const resetFilters = () => {
    setFilters({
      keyword: '',
      category: 'all',
      subjectType: 'all',
      materialCount: 'all',
      promiseTime: 'all',
      hasOnlineEntry: 'all',
      hasExampleImage: 'all',
    })
  }

  const updateGuideStatus = (guideId: string, status: ReviewStatus, _comment?: string) => {
    setGuides((prev) =>
      prev.map((g) =>
        g.id === guideId
          ? { ...g, reviewStatus: status, updatedAt: new Date().toISOString().split('T')[0] }
          : g
      )
    )
  }

  const getGuideById = (id: string) => guides.find((g) => g.id === id)

  return (
    <AppContext.Provider
      value={{
        currentCity,
        setCurrentCity,
        cities,
        guides,
        setGuides,
        filters,
        setFilters,
        filteredGuides,
        currentUser,
        loading,
        setLoading,
        updateGuideStatus,
        getGuideById,
        withLoading,
        resetFilters,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
