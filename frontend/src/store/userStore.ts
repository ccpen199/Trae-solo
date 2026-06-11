import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, ServiceApplication, Certificate, VenueBooking } from '@/types'

interface UserState {
  isLoggedIn: boolean
  token: string | null
  userInfo: User | null
  applications: ServiceApplication[]
  certificates: Certificate[]
  bookings: VenueBooking[]
  login: (token: string, userInfo: User) => void
  logout: () => void
  updateUserInfo: (userInfo: Partial<User>) => void
  setApplications: (applications: ServiceApplication[]) => void
  addApplication: (application: ServiceApplication) => void
  updateApplication: (id: string, updates: Partial<ServiceApplication>) => void
  setCertificates: (certificates: Certificate[]) => void
  addCertificate: (certificate: Certificate) => void
  setBookings: (bookings: VenueBooking[]) => void
  addBooking: (booking: VenueBooking) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      token: null,
      userInfo: null,
      applications: [],
      certificates: [],
      bookings: [],

      login: (token, userInfo) => {
        localStorage.setItem('user_token', token)
        set({ isLoggedIn: true, token, userInfo })
      },

      logout: () => {
        localStorage.removeItem('user_token')
        set({
          isLoggedIn: false,
          token: null,
          userInfo: null,
          applications: [],
          certificates: [],
          bookings: []
        })
      },

      updateUserInfo: (userInfo) =>
        set((state) => ({
          userInfo: state.userInfo ? { ...state.userInfo, ...userInfo } : null
        })),

      setApplications: (applications) => set({ applications }),
      addApplication: (application) =>
        set((state) => ({
          applications: [application, ...state.applications]
        })),
      updateApplication: (id, updates) =>
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === id ? { ...app, ...updates } : app
          )
        })),

      setCertificates: (certificates) => set({ certificates }),
      addCertificate: (certificate) =>
        set((state) => ({
          certificates: [...state.certificates, certificate]
        })),

      setBookings: (bookings) => set({ bookings }),
      addBooking: (booking) =>
        set((state) => ({
          bookings: [booking, ...state.bookings]
        }))
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        token: state.token,
        userInfo: state.userInfo,
        applications: state.applications,
        certificates: state.certificates,
        bookings: state.bookings
      })
    }
  )
)
