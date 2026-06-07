import { get, post } from '../client'
import type {
  Certificate,
  PagedResponse,
  PaginationParams
} from '../../types'

export const getCertificateList = (
  params?: PaginationParams & { status?: string; certType?: string }
): Promise<PagedResponse<Certificate>> => {
  return get<PagedResponse<Certificate>>('/certificate/list', params)
}

export const getCertificateDetail = (id: number): Promise<Certificate> => {
  return get<Certificate>(`/certificate/${id}`)
}

export const getMyCertificates = (
  params?: PaginationParams & { status?: string; certType?: string }
): Promise<PagedResponse<Certificate>> => {
  return get<PagedResponse<Certificate>>('/certificate/my', params)
}

export const generateCertificate = (data: {
  certType: string
  businessId: number
}): Promise<Certificate> => {
  return post<Certificate>('/certificate/generate', data)
}

export const verifyCertificate = (certNumber: string): Promise<Certificate | null> => {
  return get<Certificate | null>('/certificate/verify', { certNumber })
}

export const downloadCertificate = (id: number): Promise<string> => {
  return get<string>(`/certificate/${id}/download`)
}

export const getCertificateQrCode = (id: number): Promise<string> => {
  return get<string>(`/certificate/${id}/qrcode`)
}

export const getCertificateTypes = (): Promise<Array<{ code: string; name: string; description?: string }>> => {
  return get<Array<{ code: string; name: string; description?: string }>>('/certificate/types')
}

export const revokeCertificate = (id: number): Promise<Certificate> => {
  return post<Certificate>(`/certificate/${id}/revoke`)
}

export default {
  getCertificateList,
  getCertificateDetail,
  getMyCertificates,
  generateCertificate,
  verifyCertificate,
  downloadCertificate,
  getCertificateQrCode,
  getCertificateTypes,
  revokeCertificate
}
