import { upload, get, del } from '../client'
import type { UploadResponse } from '../../types'

export const uploadFile = (
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  return upload<UploadResponse>('/upload/file', formData, {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percentCompleted)
      }
    }
  })
}

export const uploadMultiple = (
  files: File[],
  onProgress?: (index: number, percent: number) => void
): Promise<UploadResponse[]> => {
  const promises = files.map((file, index) => {
    const formData = new FormData()
    formData.append('file', file)

    return upload<UploadResponse>('/upload/file', formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(index, percentCompleted)
        }
      }
    })
  })

  return Promise.all(promises)
}

export const uploadImage = (
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  return upload<UploadResponse>('/upload/image', formData, {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percentCompleted)
      }
    }
  })
}

export const uploadEvidence = (
  file: File,
  type: string,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)

  return upload<UploadResponse>('/upload/evidence', formData, {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percentCompleted)
      }
    }
  })
}

export const deleteFile = (url: string): Promise<void> => {
  return del<void>('/upload/file', { url })
}

export const getFileUrl = (hash: string): Promise<string> => {
  return get<string>('/upload/url', { hash })
}

export const getPresignedUrl = (filename: string, contentType: string): Promise<{
  uploadUrl: string
  fileUrl: string
}> => {
  return get('/upload/presigned-url', { filename, contentType })
}

export default {
  uploadFile,
  uploadMultiple,
  uploadImage,
  uploadEvidence,
  deleteFile,
  getFileUrl,
  getPresignedUrl
}
