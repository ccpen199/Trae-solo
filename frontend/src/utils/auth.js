const USER_KEY = 'user'

export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getUser() {
  const userStr = localStorage.getItem(USER_KEY)
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch (e) {
    return null
  }
}

export function removeUser() {
  localStorage.removeItem(USER_KEY)
}

export function isLoggedIn() {
  return !!getUser()
}

export function getUserRole() {
  const user = getUser()
  return user?.role || null
}

export function getToken() {
  const user = getUser()
  return user?.token || null
}
