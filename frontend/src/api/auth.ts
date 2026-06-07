import { post, get } from './http'

export interface LoginParams {
  phone: string
  password: string
}

export interface RegisterParams {
  phone: string
  password: string
  username: string
}

export function loginApi(data: LoginParams) {
  return post('/auth/login', data)
}

export function registerApi(data: RegisterParams) {
  return post('/auth/register', {
    phone: data.phone,
    password: data.password,
    nickname: data.username
  })
}

export function getUserInfoApi() {
  return get('/auth/userinfo')
}

export function logoutApi() {
  return post('/auth/logout')
}
