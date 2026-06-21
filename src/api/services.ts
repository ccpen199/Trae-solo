import type { ApiResponse, Department, ServiceItem, Policy, Venue, PageParams, PageResult, ServiceCategory } from '@/types'
import { mockDepartments, mockServices } from '@/mock/data/services'
import { mockPolicies } from '@/mock/data/policies'
import { mockVenues } from '@/mock/data/venues'
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

export async function getDepartmentList(): Promise<ApiResponse<Department[]>> {
  await sleep(300)
  return success(mockDepartments)
}

export async function getDepartmentById(id: string): Promise<ApiResponse<Department | null>> {
  await sleep(200)
  const dept = mockDepartments.find(d => d.id === id) || null
  return success(dept)
}

export async function getServiceList(params: PageParams & {
  keyword?: string
  departmentId?: string
  category?: ServiceCategory
  status?: string
  hot?: boolean
  handleMethod?: 'online' | 'offline' | 'both'
  timeLimit?: 'instant' | '1day' | '3day' | '7day' | '15day'
  instantOnly?: boolean
  type?: 'personal' | 'enterprise' | 'convenience'
}): Promise<ApiResponse<PageResult<ServiceItem>>> {
  await sleep(400)
  let list = [...mockServices]
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    const keywords = kw.split('').length > 0 ? [kw] : []
    const stopWords = ['查询', '办理', '申请', '服务', '证明', '登记']
    const coreKw = stopWords.reduce((s, w) => s.replace(new RegExp(w, 'g'), ''), kw).trim()
    if (coreKw && coreKw !== kw) {
      keywords.push(coreKw)
    }
    list = list.filter(s => {
      const searchFields = [s.name, s.shortName, s.description, s.category].join(' ').toLowerCase()
      return keywords.some(k => searchFields.includes(k))
    })
  }
  if (params.departmentId) {
    list = list.filter(s => s.departmentId === params.departmentId)
  }
  if (params.category) {
    list = list.filter(s => s.category === params.category)
  }
  if (params.status) {
    list = list.filter(s => s.status === params.status)
  }
  if (params.hot) {
    list = list.filter(s => s.hotLevel >= 4)
  }
  if (params.handleMethod) {
    list = list.filter(s => s.handleMethod === params.handleMethod)
  }
  if (params.timeLimit) {
    const dayMap: Record<string, number> = {
      instant: 0,
      '1day': 1,
      '3day': 3,
      '7day': 7,
      '15day': 15
    }
    const maxDays = dayMap[params.timeLimit]
    list = list.filter(s => s.promiseDays <= maxDays)
  }
  if (params.instantOnly) {
    list = list.filter(s => s.isInstant)
  }
  if (params.type) {
    list = list.filter(s => s.serviceType === params.type)
  }
  return success(paginate(list, params.page, params.pageSize))
}

export async function getServiceById(id: string): Promise<ApiResponse<ServiceItem | null>> {
  await sleep(300)
  const service = mockServices.find(s => s.id === id) || null
  return success(service)
}

export async function getHotServices(limit: number = 8): Promise<ApiResponse<ServiceItem[]>> {
  await sleep(200)
  const list = mockServices.filter(s => s.hotLevel >= 4).slice(0, limit)
  return success(list)
}

export async function getRecommendServices(limit: number = 6): Promise<ApiResponse<ServiceItem[]>> {
  await sleep(200)
  const list = [...mockServices].sort((a, b) => b.satisfaction - a.satisfaction).slice(0, limit)
  return success(list)
}

export async function getServicesByCategory(category: ServiceCategory): Promise<ApiResponse<ServiceItem[]>> {
  await sleep(200)
  const list = mockServices.filter(s => s.category === category)
  return success(list)
}

export async function getPolicyList(params: PageParams & {
  keyword?: string
  category?: string
  departmentId?: string
  status?: string
}): Promise<ApiResponse<PageResult<Policy>>> {
  await sleep(400)
  let list = [...mockPolicies]
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    list = list.filter(p =>
      p.title.toLowerCase().includes(kw) ||
      p.summary.toLowerCase().includes(kw)
    )
  }
  if (params.category) {
    list = list.filter(p => p.category === params.category)
  }
  if (params.departmentId) {
    list = list.filter(p => p.departmentId === params.departmentId)
  }
  if (params.status) {
    list = list.filter(p => p.status === params.status)
  }
  return success(paginate(list, params.page, params.pageSize))
}

export async function getPolicyById(id: string): Promise<ApiResponse<Policy | null>> {
  await sleep(300)
  const policy = mockPolicies.find(p => p.id === id) || null
  return success(policy)
}

export async function getVenueList(params: PageParams & {
  keyword?: string
  type?: string
  district?: string
  isOpen?: boolean
}): Promise<ApiResponse<PageResult<Venue>>> {
  await sleep(400)
  let list = [...mockVenues]
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    list = list.filter(v => v.name.toLowerCase().includes(kw) || v.description.toLowerCase().includes(kw))
  }
  if (params.type) {
    list = list.filter(v => v.type === params.type)
  }
  if (params.district) {
    list = list.filter(v => v.district === params.district)
  }
  if (params.isOpen !== undefined) {
    list = list.filter(v => v.isOpen === params.isOpen)
  }
  return success(paginate(list, params.page, params.pageSize))
}

export async function getVenueById(id: string): Promise<ApiResponse<Venue | null>> {
  await sleep(300)
  const venue = mockVenues.find(v => v.id === id) || null
  return success(venue)
}
