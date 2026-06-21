import type { ApiResponse, User, LoginForm, LoginResponse, UserProfile, PageParams, PageResult } from '@/types'
import { mockUsers, mockCurrentUser } from '@/mock/data/users'
import { mockUserProfile } from '@/mock/data/profile'
import { sleep, paginate, generateId } from '@/utils'

function success<T>(data: T): ApiResponse<T> {
  return {
    code: 0,
    message: 'success',
    data,
    timestamp: Date.now(),
    traceId: generateId()
  }
}

export async function login(form: LoginForm): Promise<ApiResponse<LoginResponse>> {
  await sleep(500)
  const user = mockCurrentUser
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 7200000 })) + '.mocksignature'
  const refreshToken = 'refresh_' + btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 604800000 }))
  return success({
    token,
    refreshToken,
    expiresIn: 7200,
    user
  })
}

export async function logout(): Promise<ApiResponse<null>> {
  await sleep(200)
  return success(null)
}

export async function refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string; refreshToken: string; expiresIn: number }>> {
  await sleep(300)
  const user = mockCurrentUser
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 7200000 })) + '.mocksignature'
  const newRefreshToken = 'refresh_' + btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 604800000 }))
  return success({ token, refreshToken: newRefreshToken, expiresIn: 7200 })
}

export async function getCurrentUser(): Promise<ApiResponse<User>> {
  await sleep(200)
  return success(mockCurrentUser)
}

export async function getUserProfile(userId?: string): Promise<ApiResponse<UserProfile>> {
  await sleep(300)
  return success(mockUserProfile)
}

export async function getUserList(params: PageParams & { keyword?: string; role?: string; verified?: boolean }): Promise<ApiResponse<PageResult<User>>> {
  await sleep(400)
  let list = [...mockUsers]
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    list = list.filter(u =>
      u.username.toLowerCase().includes(kw) ||
      u.realName.toLowerCase().includes(kw) ||
      u.phone.includes(kw)
    )
  }
  if (params.role) {
    list = list.filter(u => u.role === params.role)
  }
  if (params.verified !== undefined) {
    list = list.filter(u => u.verified === params.verified)
  }
  return success(paginate(list, params.page, params.pageSize))
}

export async function getUserById(id: string): Promise<ApiResponse<User | null>> {
  await sleep(200)
  const user = mockUsers.find(u => u.id === id) || null
  return success(user)
}

export async function updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
  await sleep(300)
  const user = mockUsers.find(u => u.id === id) || mockCurrentUser
  return success({ ...user, ...data, updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19) })
}

export async function sendSmsCode(phone: string): Promise<ApiResponse<{ verifyId: string; expiresIn: number }>> {
  await sleep(300)
  return success({ verifyId: 'v_' + generateId(), expiresIn: 300 })
}

export async function verifyRealName(data: { realName: string; idCard: string; faceImage?: string }): Promise<ApiResponse<{ verified: boolean }>> {
  await sleep(800)
  return success({ verified: true })
}
