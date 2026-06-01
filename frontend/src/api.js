import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const healthCheck = () => api.get('/health')

export const getStats = () => api.get('/stats/overview')

export const getStatsOverview = async () => {
  const data = await getStats()
  return {
    ...data,
    active_jobs: data.active_jobs ?? data.total_jobs ?? 0,
    total_interviews: data.total_interviews ?? data.interviews_30d ?? 0
  }
}

export const parseResume = (file, userId = 1) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('user_id', userId)
  return api.post('/resumes/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const listResumes = (userId) => api.get('/resumes', { params: { user_id: userId } })

export const getResume = (id) => api.get(`/resumes/${id}`)

export const startInterview = (data) => api.post('/interviews/start', data)

export const submitAnswer = (sessionId, data) => api.post(`/interviews/${sessionId}/answer`, data)

export const evaluateInterview = (sessionId) => api.post(`/interviews/${sessionId}/evaluate`)

export const listInterviews = (userId) => api.get('/interviews', { params: { user_id: userId } })

export const createCareerPlan = (data) => api.post('/career-plan', data)

export const listCareerPlans = (userId) => api.get('/career-plans', { params: { user_id: userId } })

export const searchTalent = (data) => api.post('/talent/search', data)

export const listTalentSearches = (companyId) => api.get('/talent/searches', { params: { company_id: companyId } })

export const sendMessage = (data) => api.post('/messages/send', data)

export const getDashboard = (companyId) => api.get('/dashboard', { params: { company_id: companyId } })

const formatMonth = (date) => `${date.getMonth() + 1}月`

const normalizeSkillTrend = (data, months = 6) => {
  if (data.skills && data.months && data.trends) return data

  const rows = Array.isArray(data.trend_data) ? data.trend_data : []
  const rawTopSkills = data.top_skills || []
  const rawFastestGrowing = data.fastest_growing || []
  const rawDeclining = data.declining || []

  const skills = rawTopSkills.slice(0, 5).map(item => item.skill)
  const fallbackSkills = [...new Set(rows.map(item => item.skill_name))].slice(0, 5)
  const selectedSkills = skills.length > 0 ? skills : fallbackSkills

  const dateMap = new Map()
  rows.forEach(item => {
    const d = new Date(item.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!dateMap.has(key)) dateMap.set(key, new Date(d.getFullYear(), d.getMonth(), 1))
  })
  const monthKeys = [...dateMap.keys()].sort().slice(-months)
  const monthLabels = monthKeys.map(key => {
    const [year, month] = key.split('-').map(Number)
    return `${month}月`
  })

  const totals = Object.fromEntries(selectedSkills.map(skill => [
    skill,
    Object.fromEntries(monthKeys.map(key => [key, 0]))
  ]))

  rows.forEach(item => {
    const d = new Date(item.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (totals[item.skill_name]?.[key] !== undefined) {
      totals[item.skill_name][key] += item.demand_count
    }
  })

  return {
    skills: selectedSkills,
    months: monthLabels,
    trends: selectedSkills.map(skill => monthKeys.map(key => totals[skill][key] || 0)),
    fastest_growing: rawFastestGrowing.length > 0 ? rawFastestGrowing : rawTopSkills.map(s => ({
      skill: s.skill,
      growth_rate: s.growth_rate || 0,
      current_demand: s.current_demand || 0,
      total_demand: s.total_demand || 0
    })),
    declining: rawDeclining
  }
}

const normalizeTalentFlow = (data) => {
  if (data.industries && data.roles && data.matrix) return data

  const rows = Array.isArray(data.heatmap_data) ? data.heatmap_data : []
  const industries = [...new Set(rows.map(item => item.source))]
  const roles = [...new Set(rows.map(item => item.target))]
  const matrix = rows.map(item => [
    industries.indexOf(item.source),
    roles.indexOf(item.target),
    item.value
  ])

  return {
    industries,
    roles,
    matrix,
    max_value: Math.max(100, ...rows.map(item => item.value || 0))
  }
}

const normalizeRecruitmentFunnel = (data) => {
  if (data.stages?.length && Array.isArray(data.stages) && typeof data.stages[0] === 'object' && 'count' in data.stages[0]) return data

  const rates = Array.isArray(data.conversion_rates) ? data.conversion_rates : []
  const firstStage = rates[0]
    ? [{ stage: rates[0].from, count: rates[0].from_count, conversion_rate: 100 }]
    : []
  const stages = [
    ...firstStage,
    ...rates.map(item => ({
      stage: item.to,
      count: item.to_count,
      conversion_rate: item.conversion_rate
    }))
  ]

  return {
    ...data,
    stages,
    avg_hiring_days: data.avg_hiring_days != null ? data.avg_hiring_days : 28,
    roi: typeof data.roi === 'object' && data.roi !== null ? (data.roi.interviews_per_hire ?? data.roi.applications_per_hire ?? 0) : (data.roi ?? 0)
  }
}

export const getTalentFlow = async () => {
  const data = await api.get('/dashboard/talent-flow')
  return normalizeTalentFlow(data)
}

export const getSkillTrends = () => api.get('/dashboard/skill-trends')

export const getSkillTrend = async (months = 6) => {
  const data = await getSkillTrends()
  return normalizeSkillTrend(data, months)
}

export const getRecruitmentFunnel = async (periodOrCompanyId) => {
  const params = typeof periodOrCompanyId === 'number' ? { company_id: periodOrCompanyId } : {}
  const data = await api.get('/dashboard/recruitment-funnel', { params })
  return normalizeRecruitmentFunnel(data)
}

export const getAnticheatLogs = () => api.get('/anticheat/logs')

export const listAnticheatLogs = () => getAnticheatLogs()

export const listJobs = () => api.get('/jobs')

export const listCompanies = () => api.get('/companies')

export const listUsers = () => api.get('/users')

export default api
