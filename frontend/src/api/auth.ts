import request from '@/utils/request'

export function sendCode(phone: string) {
  return request({
    url: '/auth/send-code',
    method: 'post',
    data: { phone }
  })
}

export function register(data: { phone: string; password: string; code: string; gesturePassword?: string }) {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

export function login(phone: string, password: string) {
  return request({
    url: '/auth/login',
    method: 'post',
    data: { phone, password }
  })
}

export function gestureLogin(phone: string, gesturePassword: string) {
  return request({
    url: '/auth/gesture-login',
    method: 'post',
    data: { phone, gesturePassword }
  })
}

export function getUserProfile() {
  return request({
    url: '/auth/profile',
    method: 'get'
  })
}
