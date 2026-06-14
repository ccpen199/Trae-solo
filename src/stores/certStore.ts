import { create } from 'zustand'

type Step = 'home' | 'verify' | 'result'
type Status = 'idle' | 'verifying' | 'success' | 'failed'

interface CertData {
  certNo: string
  certTime: string
  deviceFingerprint: string
  validUntil: string
  name: string
  idCard: string
}

interface CertStore {
  step: Step
  status: Status
  certData: CertData | null
  error: string | null
  idCard: string
  name: string
  reset: () => void
  setStep: (step: Step) => void
  setStatus: (status: Status) => void
  setCertData: (data: CertData | null) => void
  setError: (error: string | null) => void
  setIdCard: (id: string) => void
  setName: (name: string) => void
}

export const useCertStore = create<CertStore>((set) => ({
  step: 'home',
  status: 'idle',
  certData: null,
  error: null,
  idCard: '',
  name: '',
  reset: () => set({ step: 'home', status: 'idle', certData: null, error: null, idCard: '', name: '' }),
  setStep: (step) => set({ step }),
  setStatus: (status) => set({ status }),
  setCertData: (certData) => set({ certData }),
  setError: (error) => set({ error }),
  setIdCard: (idCard) => set({ idCard }),
  setName: (name) => set({ name }),
}))
