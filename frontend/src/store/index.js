import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const isLoggedIn = computed(() => !!token.value)
  const isTeacher = computed(() => user.value?.role === 'teacher')

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUser = (newUser) => {
    user.value = newUser
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const fetchProfile = async () => {
    try {
      const response = await userApi.getProfile()
      setUser(response.data.user)
      return response.data
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    isTeacher,
    setToken,
    setUser,
    logout,
    fetchProfile
  }
})

export const useGameStore = defineStore('game', () => {
  const gameTypes = ref([])
  const currentGame = ref(null)
  const currentLevel = ref(null)
  const gameQuestions = ref([])
  const userAnswers = ref([])
  const score = ref(0)

  const setGameTypes = (types) => {
    gameTypes.value = types
  }

  const setCurrentGame = (game) => {
    currentGame.value = game
  }

  const setCurrentLevel = (level) => {
    currentLevel.value = level
  }

  const setGameQuestions = (questions) => {
    gameQuestions.value = questions
    userAnswers.value = []
  }

  const addAnswer = (questionId, selectedIndex) => {
    const existing = userAnswers.value.findIndex(a => a.questionId === questionId)
    if (existing >= 0) {
      userAnswers.value[existing].selectedIndex = selectedIndex
    } else {
      userAnswers.value.push({ questionId, selectedIndex })
    }
  }

  const resetGame = () => {
    currentGame.value = null
    currentLevel.value = null
    gameQuestions.value = []
    userAnswers.value = []
    score.value = 0
  }

  return {
    gameTypes,
    currentGame,
    currentLevel,
    gameQuestions,
    userAnswers,
    score,
    setGameTypes,
    setCurrentGame,
    setCurrentLevel,
    setGameQuestions,
    addAnswer,
    resetGame
  }
})
