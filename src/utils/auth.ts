import { storage, StorageKeys } from './storage'

type UserRole = 'super_admin' | 'admin' | 'operator' | 'inspector' | 'viewer'

interface UserInfo {
  id: string
  username: string
  realName: string
  role: UserRole
  roleName: string
  avatar?: string
  phone?: string
  email?: string
  department?: string
  region?: string
  regionCode?: string
  permissions: string[]
  lastLoginTime?: string
  lastLoginIp?: string
  status: 'active' | 'disabled' | 'locked'
  createTime: string
  updateTime: string
}

const TOKEN_HEADER_KEY = 'Authorization'
const TOKEN_PREFIX = 'Bearer '

export const setToken = (token: string, expiresIn?: number): void => {
  if (expiresIn) {
    storage.setWithExpiry(StorageKeys.TOKEN, token, expiresIn)
  } else {
    storage.set(StorageKeys.TOKEN, token)
  }
}

export const getToken = (): string | null => {
  return storage.get<string>(StorageKeys.TOKEN)
}

export const setRefreshToken = (token: string): void => {
  storage.set(StorageKeys.REFRESH_TOKEN, token)
}

export const getRefreshToken = (): string | null => {
  return storage.get<string>(StorageKeys.REFRESH_TOKEN)
}

export const removeToken = (): void => {
  storage.remove(StorageKeys.TOKEN)
  storage.remove(StorageKeys.REFRESH_TOKEN)
}

export const setUserInfo = (userInfo: UserInfo): void => {
  storage.set(StorageKeys.USER_INFO, userInfo)
}

export const getUserInfo = (): UserInfo | null => {
  return storage.get<UserInfo>(StorageKeys.USER_INFO)
}

export const setPermissions = (permissions: string[]): void => {
  storage.set(StorageKeys.PERMISSIONS, permissions)
}

export const getPermissions = (): string[] => {
  return storage.get<string[]>(StorageKeys.PERMISSIONS) || []
}

export const setExpiresAt = (timestamp: number): void => {
  storage.set(StorageKeys.EXPIRES_AT, timestamp, false)
}

export const getExpiresAt = (): number | null => {
  return storage.get<number>(StorageKeys.EXPIRES_AT, false)
}

export const isLoggedIn = (): boolean => {
  const token = getToken()
  if (!token) return false
  
  const expiresAt = getExpiresAt()
  if (expiresAt && Date.now() >= expiresAt) {
    return false
  }
  
  return true
}

export const hasPermission = (permission: string | string[]): boolean => {
  const permissions = getPermissions()
  if (!permissions || permissions.length === 0) {
    return false
  }
  
  if (permissions.includes('*')) {
    return true
  }
  
  if (Array.isArray(permission)) {
    return permission.some(p => permissions.includes(p))
  }
  
  return permissions.includes(permission)
}

export const hasAllPermissions = (permissions: string[]): boolean => {
  const userPermissions = getPermissions()
  if (!userPermissions || userPermissions.length === 0) {
    return false
  }
  
  if (userPermissions.includes('*')) {
    return true
  }
  
  return permissions.every(p => userPermissions.includes(p))
}

export const hasRole = (role: string | string[]): boolean => {
  const userInfo = getUserInfo()
  if (!userInfo) return false
  
  if (Array.isArray(role)) {
    return role.includes(userInfo.role)
  }
  
  return userInfo.role === role
}

export const isSuperAdmin = (): boolean => {
  return hasRole('super_admin')
}

export const isAdmin = (): boolean => {
  return hasRole(['super_admin', 'admin'])
}

export const isOperator = (): boolean => {
  return hasRole(['super_admin', 'admin', 'operator'])
}

export const isInspector = (): boolean => {
  return hasRole(['super_admin', 'admin', 'inspector'])
}

export const canAccessRegion = (regionCode: string): boolean => {
  const userInfo = getUserInfo()
  if (!userInfo) return false
  
  if (isSuperAdmin()) {
    return true
  }
  
  if (!userInfo.regionCode) {
    return false
  }
  
  if (regionCode.startsWith(userInfo.regionCode)) {
    return true
  }
  
  return false
}

export const clearAuth = (): void => {
  storage.remove(StorageKeys.TOKEN)
  storage.remove(StorageKeys.REFRESH_TOKEN)
  storage.remove(StorageKeys.USER_INFO)
  storage.remove(StorageKeys.PERMISSIONS)
  storage.remove(StorageKeys.EXPIRES_AT)
}

export const getAuthHeader = (): Record<string, string> => {
  const token = getToken()
  if (!token) return {}
  return {
    [TOKEN_HEADER_KEY]: TOKEN_PREFIX + token
  }
}

export const getTokenFromHeader = (headers: Record<string, string>): string | null => {
  const authHeader = headers[TOKEN_HEADER_KEY] || headers[TOKEN_HEADER_KEY.toLowerCase()]
  if (!authHeader) return null
  
  if (authHeader.startsWith(TOKEN_PREFIX)) {
    return authHeader.substring(TOKEN_PREFIX.length)
  }
  
  return authHeader
}

export const parseToken = (token: string): any | null => {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export const getTokenRemainingTime = (): number => {
  const expiresAt = getExpiresAt()
  if (!expiresAt) return 0
  return Math.max(0, expiresAt - Date.now())
}

export const shouldRefreshToken = (threshold: number = 5 * 60 * 1000): boolean => {
  const remaining = getTokenRemainingTime()
  return remaining > 0 && remaining < threshold
}

export const setLoginForm = (form: { username: string; remember: boolean }): void => {
  storage.set(StorageKeys.LOGIN_FORM, form, false)
}

export const getLoginForm = (): { username: string; remember: boolean } | null => {
  return storage.get<{ username: string; remember: boolean }>(StorageKeys.LOGIN_FORM, false)
}

export const removeLoginForm = (): void => {
  storage.remove(StorageKeys.LOGIN_FORM)
}

export default {
  setToken,
  getToken,
  setRefreshToken,
  getRefreshToken,
  removeToken,
  setUserInfo,
  getUserInfo,
  setPermissions,
  getPermissions,
  setExpiresAt,
  getExpiresAt,
  isLoggedIn,
  hasPermission,
  hasAllPermissions,
  hasRole,
  isSuperAdmin,
  isAdmin,
  isOperator,
  isInspector,
  canAccessRegion,
  clearAuth,
  getAuthHeader,
  getTokenFromHeader,
  parseToken,
  getTokenRemainingTime,
  shouldRefreshToken,
  setLoginForm,
  getLoginForm,
  removeLoginForm
}
