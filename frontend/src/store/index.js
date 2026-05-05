import { reactive, watch } from 'vue'

const SESSION_KEY = 'personal_website_session'

function loadStoredSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('读取会话失败:', e)
  }
  return null
}

const stored = loadStoredSession()

const state = reactive({
  user: stored?.user || null,
  sessionId: stored?.sessionId || null,
  isLoggedIn: !!(stored?.sessionId && stored?.user)
})

function setSession(user, sessionId) {
  state.user = user
  state.sessionId = sessionId
  state.isLoggedIn = true
  
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    user,
    sessionId
  }))
}

function clearSession() {
  state.user = null
  state.sessionId = null
  state.isLoggedIn = false
  
  localStorage.removeItem(SESSION_KEY)
}

function getSessionId() {
  return state.sessionId
}

function isAdmin() {
  return state.isLoggedIn && state.user?.role === 'admin'
}

export const useStore = () => ({
  state,
  setSession,
  clearSession,
  getSessionId,
  isAdmin
})
