import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:58830'

export const useStudentStore = defineStore('student', {
  state: () => ({
    currentStudent: null,
    profile: null,
    recommendations: [],
    learningHistory: []
  }),
  actions: {
    async initStudent(studentId = 1) {
      try {
        const res = await axios.get(`${API_BASE}/api/students/${studentId}`)
        this.currentStudent = res.data
        return res.data
      } catch (e) {
        console.error('Failed to load student:', e)
      }
    },
    async loadProfile(studentId = 1) {
      try {
        const res = await axios.get(`${API_BASE}/api/students/${studentId}/profile`)
        this.profile = res.data
        return res.data
      } catch (e) {
        console.error('Failed to load profile:', e)
      }
    },
    async loadRecommendations(studentId = 1) {
      try {
        const res = await axios.get(`${API_BASE}/api/recommendations/${studentId}`)
        this.recommendations = res.data
        return res.data
      } catch (e) {
        console.error('Failed to load recommendations:', e)
      }
    },
    async submitFeedback(data) {
      try {
        const res = await axios.post(`${API_BASE}/api/feedback`, data)
        return res.data
      } catch (e) {
        console.error('Failed to submit feedback:', e)
      }
    }
  }
})
