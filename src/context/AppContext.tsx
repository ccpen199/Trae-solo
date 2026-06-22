import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react'
import { City, ServiceGuide, ItemCategory, SubjectType, User, ReviewStatus } from '../types'
import { cities } from '../data/cities'
import { serviceGuides as initialGuides } from '../data/serviceGuides'
import { users } from '../data/analytics'

type SearchFilters = {
  keyword: string
  category?: ItemCategory | 'all'
  subjectType?: SubjectType | 'all'
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
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentCity, setCurrentCity] = useState<City>(cities[0])
  const [guides, setGuides] = useState<ServiceGuide[]>(initialGuides)
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    category: 'all',
    subjectType: 'all',
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
    return guides.filter((guide) => {
      if (guide.cityId !== currentCity.id) return false
      if (guide.reviewStatus !== 'published') return false
      if (filters.category && filters.category !== 'all' && guide.category !== filters.category) return false
      if (filters.subjectType && filters.subjectType !== 'all') {
        if (guide.subjectType !== 'both' && guide.subjectType !== filters.subjectType) return false
      }
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase()
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
