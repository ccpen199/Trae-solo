const TOKEN_KEY = 'recruit_token'
const USER_KEY = 'recruit_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  return localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  return localStorage.removeItem(TOKEN_KEY)
}

export function getUser() {
  const userStr = localStorage.getItem(USER_KEY)
  return userStr ? JSON.parse(userStr) : null
}

export function setUser(user) {
  return localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function removeUser() {
  return localStorage.removeItem(USER_KEY)
}

export function logout() {
  removeToken()
  removeUser()
}
