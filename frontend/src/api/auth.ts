import { http } from '../utils/request'
import type {
  LoginParams,
  RegisterWorkerParams,
  RegisterEnterpriseParams,
  ChangePasswordParams,
  LoginResult,
  User,
  Worker,
  Enterprise,
  ApiResponse,
} from '../types'

export const authApi = {
  login(data: LoginParams): Promise<ApiResponse<LoginResult>> {
    return http.post<LoginResult>('/auth/login', data)
  },

  registerWorker(data: RegisterWorkerParams): Promise<ApiResponse<{ user_id: number }>> {
    return http.post<{ user_id: number }>('/auth/register/worker', data)
  },

  registerEnterprise(data: RegisterEnterpriseParams): Promise<ApiResponse<{ user_id: number }>> {
    return http.post<{ user_id: number }>('/auth/register/enterprise', data)
  },

  faceVerify(faceData: string): Promise<ApiResponse<{ verified: boolean }>> {
    return http.post<{ verified: boolean }>('/auth/face-verify', { face_data: faceData })
  },

  getMe(): Promise<ApiResponse<{ user: User; worker?: Worker; enterprise?: Enterprise }>> {
    return http.get<{ user: User; worker?: Worker; enterprise?: Enterprise }>('/auth/me')
  },

  changePassword(data: ChangePasswordParams): Promise<ApiResponse<null>> {
    return http.post<null>('/auth/change-password', data)
  },
}

export default authApi
