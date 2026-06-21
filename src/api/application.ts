import type { ApiResponse, Application, Evaluation, PageParams, PageResult, ApplicationStatus, ApplicationFormField, ApplicationMaterial } from '@/types'
import { mockApplications } from '@/mock/data/applications'
import { mockEvaluations } from '@/mock/data/evaluations'
import { sleep, paginate, generateId, generateNo } from '@/utils'

function success<T>(data: T): ApiResponse<T> {
  return {
    code: 0,
    message: 'success',
    data,
    timestamp: Date.now(),
    traceId: generateId()
  }
}

export async function getApplicationList(params: PageParams & {
  keyword?: string
  userId?: string
  serviceId?: string
  departmentId?: string
  status?: ApplicationStatus
  dateFrom?: string
  dateTo?: string
}): Promise<ApiResponse<PageResult<Application>>> {
  await sleep(400)
  let list = [...mockApplications]
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    list = list.filter(a =>
      a.applyNo.toLowerCase().includes(kw) ||
      a.serviceName.toLowerCase().includes(kw) ||
      a.userName.toLowerCase().includes(kw)
    )
  }
  if (params.userId) {
    list = list.filter(a => a.userId === params.userId)
  }
  if (params.serviceId) {
    list = list.filter(a => a.serviceId === params.serviceId)
  }
  if (params.departmentId) {
    list = list.filter(a => a.departmentId === params.departmentId)
  }
  if (params.status) {
    list = list.filter(a => a.status === params.status)
  }
  if (params.dateFrom) {
    list = list.filter(a => a.submitTime >= params.dateFrom)
  }
  if (params.dateTo) {
    list = list.filter(a => a.submitTime <= params.dateTo + ' 23:59:59')
  }
  return success(paginate(list, params.page, params.pageSize))
}

export async function getApplicationById(id: string): Promise<ApiResponse<Application | null>> {
  await sleep(300)
  const app = mockApplications.find(a => a.id === id) || null
  return success(app)
}

export async function getApplicationByNo(applyNo: string): Promise<ApiResponse<Application | null>> {
  await sleep(300)
  const app = mockApplications.find(a => a.applyNo === applyNo) || null
  return success(app)
}

export async function createApplication(data: {
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
}): Promise<ApiResponse<Application>> {
  await sleep(800)
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const deadlineDate = new Date()
  deadlineDate.setDate(deadlineDate.getDate() + 5)
  const deadline = deadlineDate.toISOString().replace('T', ' ').slice(0, 19)
  const newApp: Application = {
    id: 'a_' + generateId(),
    applyNo: generateNo('SL'),
    serviceId: data.serviceId,
    serviceName: data.serviceName,
    departmentId: data.departmentId,
    departmentName: data.departmentName,
    userId: data.userId,
    userName: data.userName,
    idCard: data.idCard,
    phone: data.phone,
    status: 'submitted',
    currentStep: 1,
    totalSteps: 5,
    formData: data.formData,
    materials: data.materials.map((m, i) => ({
      id: 'mat_' + i,
      name: m.name,
      required: m.required ?? true,
      url: m.url,
      status: 'uploaded'
    })) as ApplicationMaterial[],
    timeline: [
      {
        id: 'tl_new_1',
        status: 'submitted',
        title: '提交申请',
        description: '您已成功提交申请，等待受理',
        operator: data.userName,
        operatorRole: '申请人',
        time: now
      }
    ],
    submitTime: now,
    deadline,
    isOverdue: false
  }
  mockApplications.unshift(newApp)
  return success(newApp)
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus, remark?: string): Promise<ApiResponse<Application>> {
  await sleep(500)
  const app = mockApplications.find(a => a.id === id) || mockApplications[0]
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const updated: Application = { ...app, status }
  if (remark) {
    updated.timeline = [
      ...app.timeline,
      {
        id: 'tl_' + generateId(),
        status,
        title: status,
        description: remark,
        operator: '系统管理员',
        operatorRole: '工作人员',
        time: now
      }
    ]
  }
  const idx = mockApplications.findIndex(a => a.id === id)
  if (idx >= 0) mockApplications[idx] = updated
  return success(updated)
}

export async function supplementMaterials(id: string, materials: Array<{ name: string; url: string; required?: boolean }>): Promise<ApiResponse<Application>> {
  await sleep(500)
  const app = mockApplications.find(a => a.id === id) || mockApplications[0]
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const newMats: ApplicationMaterial[] = materials.map((m, i) => ({
    id: 'mat_s_' + i,
    name: m.name,
    required: m.required ?? true,
    url: m.url,
    status: 'uploaded'
  }))
  const updated: Application = {
    ...app,
    materials: [...app.materials, ...newMats],
    status: 'reviewing',
    timeline: [
      ...app.timeline,
      {
        id: 'tl_' + generateId(),
        status: 'reviewing',
        title: '补充材料完成',
        description: '已补充相关材料，等待重新审核',
        operator: app.userName,
        operatorRole: '申请人',
        time: now
      }
    ]
  }
  const idx = mockApplications.findIndex(a => a.id === id)
  if (idx >= 0) mockApplications[idx] = updated
  return success(updated)
}

export async function getApplicationStats(userId?: string): Promise<ApiResponse<{
  total: number; processing: number; completed: number; pending: number; rejected: number
}>> {
  await sleep(300)
  let list = mockApplications
  if (userId) list = list.filter(a => a.userId === userId)
  return success({
    total: list.length,
    processing: list.filter(a => ['submitted', 'accepted', 'reviewing', 'approved'].includes(a.status)).length,
    completed: list.filter(a => a.status === 'completed').length,
    pending: list.filter(a => a.status === 'supplement').length,
    rejected: list.filter(a => a.status === 'rejected').length
  })
}

export async function createEvaluation(data: {
  applicationId: string
  applicationNo: string
  source: 'application' | 'ticket' | 'venue' | 'general'
  overallRating: number
  speedRating: number
  attitudeRating: number
  qualityRating: number
  convenienceRating?: number
  tags: string[]
  content: string
  images?: string[]
  anonymous?: boolean
}): Promise<ApiResponse<Evaluation>> {
  await sleep(500)
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const app = mockApplications.find(a => a.id === data.applicationId)
  const evaluation: Evaluation = {
    id: 'e_' + generateId(),
    source: data.source,
    sourceId: data.applicationId,
    sourceNo: data.applicationNo,
    sourceName: app?.serviceName || '办件服务',
    userId: app?.userId || 'u_001',
    userName: app?.userName || '张三',
    overallRating: data.overallRating,
    speedRating: data.speedRating,
    attitudeRating: data.attitudeRating,
    qualityRating: data.qualityRating,
    convenienceRating: data.convenienceRating ?? data.overallRating,
    tags: data.tags,
    content: data.content,
    images: data.images || [],
    departmentId: app?.departmentId || 'd_001',
    departmentName: app?.departmentName || '抚州市人社局',
    isRectified: false,
    anonymous: data.anonymous || false,
    createTime: now
  }
  mockEvaluations.unshift(evaluation)
  return success(evaluation)
}

export async function getEvaluationList(params: PageParams & {
  source?: string
  departmentId?: string
  rating?: number
}): Promise<ApiResponse<PageResult<Evaluation>>> {
  await sleep(400)
  let list = [...mockEvaluations]
  if (params.source) {
    list = list.filter(e => e.source === params.source)
  }
  if (params.departmentId) {
    list = list.filter(e => e.departmentId === params.departmentId)
  }
  if (params.rating) {
    list = list.filter(e => e.overallRating === params.rating)
  }
  return success(paginate(list, params.page, params.pageSize))
}

export async function getEvaluationById(id: string): Promise<ApiResponse<Evaluation | null>> {
  await sleep(200)
  const ev = mockEvaluations.find(e => e.id === id) || null
  return success(ev)
}
