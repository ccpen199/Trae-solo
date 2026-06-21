import { create } from 'zustand'
import type { Listing, SearchParams, Appointment, Contract, Payment, ServiceRequest } from '@/types'
import { mockListings, mockAppointments, mockContracts, mockPayments, mockServiceRequests } from '@/data/mockData'

interface AppState {
  listings: Listing[]
  searchParams: SearchParams
  currentListing: Listing | null
  appointments: Appointment[]
  contracts: Contract[]
  payments: Payment[]
  serviceRequests: ServiceRequest[]
  sidebarCollapsed: boolean

  setSearchParams: (params: Partial<SearchParams>) => void
  setCurrentListing: (listing: Listing | null) => void
  filterListings: () => Listing[]
  selectAppointmentSlot: (appointmentId: string, date: string, time: string) => void
  confirmAppointment: (appointmentId: string) => void
  signContract: (contractId: string, role: 'tenant' | 'landlord') => void
  fileContract: (contractId: string) => void
  makePayment: (paymentId: string) => void
  submitServiceRequest: (request: Omit<ServiceRequest, 'id' | 'status'>) => void
  rateService: (requestId: string, score: number, comment: string) => void
  toggleSidebar: () => void
}

const defaultSearchParams: SearchParams = {
  commuteMode: 'metro',
  commuteDestination: '',
  maxCommuteMinutes: 30,
  budgetMin: 2000,
  budgetMax: 15000,
  rooms: [],
  listingType: [],
  district: '',
}

export const useStore = create<AppState>((set, get) => ({
  listings: mockListings,
  searchParams: defaultSearchParams,
  currentListing: null,
  appointments: mockAppointments,
  contracts: mockContracts,
  payments: mockPayments,
  serviceRequests: mockServiceRequests,
  sidebarCollapsed: false,

  setSearchParams: (params) =>
    set((state) => ({ searchParams: { ...state.searchParams, ...params } })),

  setCurrentListing: (listing) => set({ currentListing: listing }),

  filterListings: () => {
    const { listings, searchParams } = get()
    return listings.filter((l) => {
      if (l.price < searchParams.budgetMin || l.price > searchParams.budgetMax) return false
      if (searchParams.rooms.length > 0 && !searchParams.rooms.includes(l.rooms)) return false
      if (searchParams.listingType.length > 0 && !searchParams.listingType.includes(l.type)) return false
      if (searchParams.district && l.district !== searchParams.district) return false
      return true
    })
  },

  selectAppointmentSlot: (appointmentId, date, time) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === appointmentId ? { ...a, selectedSlot: { date, time, available: false } } : a
      ),
    })),

  confirmAppointment: (appointmentId) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === appointmentId ? { ...a, status: 'confirmed' } : a
      ),
    })),

  signContract: (contractId, role) =>
    set((state) => ({
      contracts: state.contracts.map((c) =>
        c.id === contractId
          ? {
              ...c,
              signatures: {
                ...c.signatures,
                [role]: { signed: true, timestamp: new Date().toISOString() },
              },
              status: c.signatures.tenant.signed && c.signatures.landlord.signed ? 'signed' : 'signing',
              ...(role === 'tenant' && c.signatures.landlord.signed ? { status: 'signed' } : {}),
              ...(role === 'landlord' && c.signatures.tenant.signed ? { status: 'signed' } : {}),
            }
          : c
      ),
    })),

  fileContract: (contractId) =>
    set((state) => ({
      contracts: state.contracts.map((c) =>
        c.id === contractId
          ? {
              ...c,
              filingInfo: {
                filingNo: `ZJ-${Date.now()}`,
                status: 'filed' as const,
                filedAt: new Date().toISOString(),
              },
              status: 'filed' as const,
            }
          : c
      ),
    })),

  makePayment: (paymentId) =>
    set((state) => ({
      payments: state.payments.map((p) =>
        p.id === paymentId ? { ...p, status: 'completed' as const } : p
      ),
    })),

  submitServiceRequest: (request) =>
    set((state) => ({
      serviceRequests: [
        ...state.serviceRequests,
        {
          ...request,
          id: `S${String(state.serviceRequests.length + 1).padStart(3, '0')}`,
          status: 'submitted' as const,
        },
      ],
    })),

  rateService: (requestId, score, comment) =>
    set((state) => ({
      serviceRequests: state.serviceRequests.map((r) =>
        r.id === requestId
          ? { ...r, rating: { score, comment, ratedAt: new Date().toISOString() } }
          : r
      ),
    })),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
