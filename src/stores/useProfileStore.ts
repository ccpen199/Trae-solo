import { create } from "zustand"
import type { CitizenProfile } from "@/types"
import { citizenProfile } from "@/mocks/citizenProfile"

interface ProfileState {
  profile: CitizenProfile
  loading: boolean
  fetchProfile: () => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: citizenProfile,
  loading: false,
  fetchProfile: () => {
    set({ loading: true })
    setTimeout(() => {
      set({ profile: citizenProfile, loading: false })
    }, 500)
  },
}))
