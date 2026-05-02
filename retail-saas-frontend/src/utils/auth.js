const TokenKey = 'retail-saas-token'

export function getToken() {
  return localStorage.getItem(TokenKey)
}

export function setToken(token) {
  return localStorage.setItem(TokenKey, token)
}

export function removeToken() {
  return localStorage.removeItem(TokenKey)
}

export function getStorage(key) {
  return localStorage.getItem(key)
}

export function setStorage(key, value) {
  return localStorage.setItem(key, value)
}

export function removeStorage(key) {
  return localStorage.removeItem(key)
}

export function clearStorage() {
  return localStorage.clear()
}

export function getSessionStorage(key) {
  return sessionStorage.getItem(key)
}

export function setSessionStorage(key, value) {
  return sessionStorage.setItem(key, value)
}

export function removeSessionStorage(key) {
  return sessionStorage.removeItem(key)
}
