import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { samplePositions, type JobPosition } from '../data/mockData'

interface PositionStore {
  positions: JobPosition[]
  addPosition: (pos: JobPosition) => void
  updatePosition: (id: string, updates: Partial<JobPosition>) => void
  removePosition: (id: string) => void
}

const PositionStoreContext = createContext<PositionStore | null>(null)

export function PositionStoreProvider({ children }: { children: ReactNode }) {
  const [positions, setPositions] = useState<JobPosition[]>([...samplePositions])

  const addPosition = useCallback((pos: JobPosition) => {
    setPositions((prev) => [pos, ...prev])
  }, [])

  const updatePosition = useCallback((id: string, updates: Partial<JobPosition>) => {
    setPositions((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }, [])

  const removePosition = useCallback((id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return (
    <PositionStoreContext.Provider value={{ positions, addPosition, updatePosition, removePosition }}>
      {children}
    </PositionStoreContext.Provider>
  )
}

export function usePositionStore() {
  const ctx = useContext(PositionStoreContext)
  if (!ctx) throw new Error('usePositionStore must be used within PositionStoreProvider')
  return ctx
}
