import { post, get } from '../client'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User
} from '../../types'

export const login = (data: LoginRequest): Promise<LoginResponse> => {
  return post<LoginResponse>('/auth/login', data)
}

export const register = (data: RegisterRequest): Promise<LoginResponse> => {
  return post<LoginResponse>('/auth/register', data)
}

export const logout = (): Promise<void> => {
  return post<void>('/auth/logout')
}

export const getCurrentUser = (): Promise<User> => {
  return get<User>('/auth/me')
}

export const updateProfile = (data: Partial<User>): Promise<User> => {
  return post<User>('/auth/profile', data)
}

export const changePassword = (data: {
  oldPassword: string
  newPassword: string
}): Promise<void> => {
  return post<void>('/auth/password', data)
}

export const sendSmsCode = (phone: string): Promise<void> => {
  return post<void>('/auth/sms-code', { phone })
}

export const resetPassword = (data: {
  phone: string
  code: string
  newPassword: string
}): Promise<void> => {
  return post<void>('/auth/reset-password', data)
}

export default {
  login,
  register,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  sendSmsCode,
  resetPassword
}
