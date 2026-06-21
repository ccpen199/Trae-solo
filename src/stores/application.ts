import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Application, ApplicationStatus, PageParams, PageResult, Evaluation, ApplicationFormField, EvaluationSource } from '@/types'
import {
  getApplicationList,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
  supplementMaterials,
  getApplicationStats,
  createEvaluation,
  getEvaluationList
} from '@/api/application'

export const useApplicationStore = defineStore('application', () => {
  const applications = ref<Application[]>([])
  const currentApplication = ref<Application | null>(null)
  const evaluations = ref<Evaluation[]>([])
  const pagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 })
  const stats = ref({ total: 0, processing: 0, completed: 0, pending: 0, rejected: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)

  const processingList = computed(() => applications.value.filter(a => ['submitted', 'accepted', 'reviewing', 'approved'].includes(a.status)))
  const completedList = computed(() => applications.value.filter(a => a.status === 'completed'))
  const pendingList = computed(() => applications.value.filter(a => a.status === 'supplement'))
  const rejectedList = computed(() => applications.value.filter(a => a.status === 'rejected'))

  async function fetchList(params: PageParams & {
    keyword?: string
    userId?: string
    serviceId?: string
    departmentId?: string
    status?: ApplicationStatus
    dateFrom?: string
    dateTo?: string
  }): Promise<PageResult<Application>> {
    loading.value = true
    error.value = null
    try {
      const res = await getApplicationList(params)
      if (res.code === 0 && res.data) {
        applications.value = res.data.list
        pagination.value = {
          page: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
          totalPages: res.data.totalPages
        }
        return res.data
      }
      throw new Error(res.message || '获取办件列表失败')
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(id: string): Promise<Application | null> {
    loading.value = true
    error.value = null
    try {
      const res = await getApplicationById(id)
      if (res.code === 0) {
        currentApplication.value = res.data
        return res.data
      }
      throw new Error(res.message || '获取办件详情失败')
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function submitApplication(data: {
    serviceId: string
    serviceName: string
    departmentId: string
    departmentName: string
    userId: string
    userName: string
    idCard: string
    phone: string
    formData: ApplicationFormField[]
    materials: Array<{ name: string; url: string; required?: boolean }>
  }): Promise<Application> {
    loading.value = true
    error.value = null
    try {
      const res = await createApplication(data)
      if (res.code === 0 && res.data) {
        applications.value.unshift(res.data)
        stats.value.total += 1
        stats.value.processing += 1
        return res.data
      }
      throw new Error(res.message || '提交办件失败')
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function changeStatus(id: string, status: ApplicationStatus, remark?: string): Promise<Application> {
    loading.value = true
    error.value = null
    try {
      const res = await updateApplicationStatus(id, status, remark)
      if (res.code === 0 && res.data) {
        const idx = applications.value.findIndex(a => a.id === id)
        if (idx >= 0) applications.value[idx] = res.data
        if (currentApplication.value?.id === id) currentApplication.value = res.data
        return res.data
      }
      throw new Error(res.message || '更新办件状态失败')
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function submitSupplement(id: string, materials: Array<{ name: string; url: string; required?: boolean }>): Promise<Application> {
    loading.value = true
    error.value = null
    try {
      const res = await supplementMaterials(id, materials)
      if (res.code === 0 && res.data) {
        const idx = applications.value.findIndex(a => a.id === id)
        if (idx >= 0) applications.value[idx] = res.data
        if (currentApplication.value?.id === id) currentApplication.value = res.data
        stats.value.pending = Math.max(0, stats.value.pending - 1)
        stats.value.processing += 1
        return res.data
      }
      throw new Error(res.message || '补充材料失败')
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchStats(userId?: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await getApplicationStats(userId)
      if (res.code === 0 && res.data) {
        stats.value = res.data
      }
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function submitEvaluation(data: {
    applicationId: string
    applicationNo: string
    source: EvaluationSource
    overallRating: number
    speedRating: number
    attitudeRating: number
    qualityRating: number
    tags: string[]
    content: string
    images?: string[]
    anonymous?: boolean
  }): Promise<Evaluation> {
    loading.value = true
    error.value = null
    try {
      const res = await createEvaluation(data)
      if (res.code === 0 && res.data) {
        evaluations.value.unshift(res.data)
        return res.data
      }
      throw new Error(res.message || '提交评价失败')
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchEvaluations(params: PageParams & {
    source?: string
    departmentId?: string
    rating?: number
  }): Promise<PageResult<Evaluation>> {
    loading.value = true
    error.value = null
    try {
      const res = await getEvaluationList(params)
      if (res.code === 0 && res.data) {
        evaluations.value = res.data.list
        return res.data
      }
      throw new Error(res.message || '获取评价列表失败')
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  function setCurrentApplication(app: Application | null) {
    currentApplication.value = app
  }

  return {
    applications,
    currentApplication,
    evaluations,
    pagination,
    stats,
    loading,
    error,
    processingList,
    completedList,
    pendingList,
    rejectedList,
    fetchList,
    fetchDetail,
    submitApplication,
    changeStatus,
    submitSupplement,
    fetchStats,
    submitEvaluation,
    fetchEvaluations,
    setCurrentApplication
  }
})
