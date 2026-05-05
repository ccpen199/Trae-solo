import { post, get } from './request'

export interface LoginParams {
  username: string
  password: string
}

export interface UserInfo {
  id: string
  username: string
  realName?: string
  phone?: string
  email?: string
  departmentId?: string
}

export interface MenuItem {
  id: string
  parentId?: string
  name: string
  path?: string
  icon?: string
  sortOrder: number
  type: number
  permission?: string
  children?: MenuItem[]
}

export interface LoginResult {
  token: string
  user: UserInfo
  roles: string[]
  permissions: string[]
  menus: MenuItem[]
}

export interface CurrentUserResult {
  user: UserInfo
  roles: string[]
  permissions: string[]
  menus: MenuItem[]
}

export function login(params: LoginParams): Promise<LoginResult> {
  return post('/auth/login', params).then((res) => res.data as LoginResult)
}

export function getCurrentUser(): Promise<CurrentUserResult> {
  return get('/auth/me').then((res) => res.data as CurrentUserResult)
}

export function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  return post('/auth/change-password', { oldPassword, newPassword }).then()
}
