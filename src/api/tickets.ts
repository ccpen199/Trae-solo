import type {
  ApiResponse,
  Ticket,
  PageParams,
  PageResult,
  TicketStatus,
  TicketType,
  TicketPriority,
  TicketReply,
  Evaluation,
  RectificationRecord,
  ReviewRecord,
  DispatchRule,
  ReplyMethod
} from '@/types'
import {
  mockTickets,
  mockRectificationRecords,
  mockReviewRecords,
  mockDispatchRules,
  evaluationTags
} from '@/mock/data/tickets'
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

export async function getTicketList(params: PageParams & {
  keyword?: string
  userId?: string
  type?: TicketType
  status?: TicketStatus
  priority?: TicketPriority
  departmentId?: string
  isOverdue?: boolean
  dateFrom?: string
  dateTo?: string
  rectificationStatus?: string
}): Promise<ApiResponse<PageResult<Ticket>>> {
  await sleep(400)
  let list = [...mockTickets]
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    list = list.filter(t =>
      t.ticketNo.toLowerCase().includes(kw) ||
      t.title.toLowerCase().includes(kw) ||
      t.content.toLowerCase().includes(kw)
    )
  }
  if (params.userId) {
    list = list.filter(t => t.userId === params.userId)
  }
  if (params.type) {
    list = list.filter(t => t.type === params.type)
  }
  if (params.status) {
    list = list.filter(t => t.status === params.status)
  }
  if (params.priority) {
    list = list.filter(t => t.priority === params.priority)
  }
  if (params.departmentId) {
    list = list.filter(t => t.departmentId === params.departmentId)
  }
  if (params.isOverdue !== undefined) {
    list = list.filter(t => t.isOverdue === params.isOverdue)
  }
  if (params.dateFrom) {
    list = list.filter(t => t.submitTime >= params.dateFrom)
  }
  if (params.dateTo) {
    list = list.filter(t => t.submitTime <= params.dateTo + ' 23:59:59')
  }
  return success(paginate(list, params.page, params.pageSize))
}

export async function getTicketById(id: string): Promise<ApiResponse<Ticket | null>> {
  await sleep(300)
  const ticket = mockTickets.find(t => t.id === id) || null
  return success(ticket)
}

export async function getTicketByNo(ticketNo: string): Promise<ApiResponse<Ticket | null>> {
  await sleep(300)
  const ticket = mockTickets.find(t => t.ticketNo === ticketNo) || null
  return success(ticket)
}

export async function createTicket(data: {
  type: TicketType
  title: string
  content: string
  category: string
  subCategory?: string
  userId: string
  userName: string
  phone: string
  email?: string
  location?: string
  anonymous?: boolean
  priority?: TicketPriority
  attachments?: string[]
  replyMethod?: ReplyMethod
  departmentId?: string
  departmentName?: string
}): Promise<ApiResponse<Ticket>> {
  await sleep(600)
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const ticket: Ticket = {
    id: 't_' + generateId(),
    ticketNo: generateNo('GD'),
    type: data.type,
    title: data.title,
    content: data.content,
    category: data.category,
    subCategory: data.subCategory || '',
    userId: data.userId,
    userName: data.userName,
    phone: data.phone,
    email: data.email,
    location: data.location,
    anonymous: data.anonymous || false,
    priority: data.priority || 'medium',
    status: 'pending',
    replyMethod: data.replyMethod || 'message',
    departmentId: data.departmentId,
    departmentName: data.departmentName,
    slaHours: data.type === 'help' ? 12 : data.priority === 'urgent' ? 24 : 72,
    remainingHours: data.type === 'help' ? 12 : data.priority === 'urgent' ? 24 : 72,
    isOverdue: false,
    attachments: data.attachments || [],
    replies: [],
    timeline: [
      {
        id: 'tl_001',
        status: 'pending',
        title: '提交成功',
        description: '诉求已提交成功，等待系统分拨',
        operator: data.anonymous ? '匿名用户' : data.userName,
        operatorRole: '诉求人',
        time: now
      }
    ],
    submitTime: now,
    currentStep: 0,
    totalSteps: 5
  }
  mockTickets.unshift(ticket)
  return success(ticket)
}

export async function assignTicket(id: string, data: {
  departmentId: string
  departmentName: string
  assignee?: string
  assigneeRole?: string
}): Promise<ApiResponse<Ticket>> {
  await sleep(400)
  const ticket = mockTickets.find(t => t.id === id) || mockTickets[0]
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const updated: Ticket = {
    ...ticket,
    status: 'assigned',
    departmentId: data.departmentId,
    departmentName: data.departmentName,
    assignee: data.assignee,
    assigneeRole: data.assigneeRole,
    assignTime: now,
    currentStep: 1,
    timeline: [
      ...ticket.timeline,
      {
        id: 'tl_assign',
        status: 'assigned',
        title: '系统分拨',
        description: `工单已分配至 ${data.departmentName}`,
        operator: '系统',
        operatorRole: '智能分拨系统',
        time: now
      }
    ]
  }
  const idx = mockTickets.findIndex(t => t.id === id)
  if (idx >= 0) mockTickets[idx] = updated
  return success(updated)
}

export async function acceptTicket(id: string, data: {
  assignee: string
  assigneeRole: string
}): Promise<ApiResponse<Ticket>> {
  await sleep(300)
  const ticket = mockTickets.find(t => t.id === id) || mockTickets[0]
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const updated: Ticket = {
    ...ticket,
    status: 'processing',
    assignee: data.assignee,
    assigneeRole: data.assigneeRole,
    acceptTime: now,
    currentStep: 2,
    timeline: [
      ...ticket.timeline,
      {
        id: 'tl_accept',
        status: 'accepted',
        title: '部门受理',
        description: `${ticket.departmentName}已受理您的诉求`,
        operator: data.assignee,
        operatorRole: data.assigneeRole,
        time: now
      }
    ]
  }
  const idx = mockTickets.findIndex(t => t.id === id)
  if (idx >= 0) mockTickets[idx] = updated
  return success(updated)
}

export async function updateTicketStatus(id: string, status: TicketStatus, remark?: string): Promise<ApiResponse<Ticket>> {
  await sleep(500)
  const ticket = mockTickets.find(t => t.id === id) || mockTickets[0]
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const updated: Ticket = { ...ticket, status }
  if (remark) {
    updated.replies = [
      ...ticket.replies,
      {
        id: 'r_' + generateId(),
        content: remark,
        operator: '工作人员',
        operatorRole: '工单处理员',
        time: now
      }
    ]
  }
  if (status === 'assigned' && !ticket.assignTime) {
    updated.assignTime = now
  }
  if (status === 'completed' || status === 'closed') {
    updated.closeTime = now
  }
  const idx = mockTickets.findIndex(t => t.id === id)
  if (idx >= 0) mockTickets[idx] = updated
  return success(updated)
}

export async function replyTicket(id: string, reply: {
  content: string
  operator: string
  operatorRole: string
  attachments?: string[]
}): Promise<ApiResponse<Ticket>> {
  await sleep(400)
  const ticket = mockTickets.find(t => t.id === id) || mockTickets[0]
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const replyObj: TicketReply = {
    id: 'r_' + generateId(),
    content: reply.content,
    operator: reply.operator,
    operatorRole: reply.operatorRole,
    attachments: reply.attachments,
    time: now
  }
  const updated: Ticket = {
    ...ticket,
    status: 'replied',
    firstReplyTime: ticket.firstReplyTime || now,
    replies: [...ticket.replies, replyObj],
    currentStep: Math.max(ticket.currentStep, 3),
    timeline: [
      ...ticket.timeline,
      {
        id: 'tl_reply_' + generateId(),
        status: 'replied',
        title: '官方回复',
        description: reply.content,
        operator: reply.operator,
        operatorRole: reply.operatorRole,
        attachments: reply.attachments,
        time: now
      }
    ]
  }
  const idx = mockTickets.findIndex(t => t.id === id)
  if (idx >= 0) mockTickets[idx] = updated
  return success(updated)
}

export async function rateTicket(id: string, data: {
  rating: number
  comment?: string
  tags?: string[]
  speedRating?: number
  attitudeRating?: number
  qualityRating?: number
  convenienceRating?: number
  anonymous?: boolean
}): Promise<ApiResponse<Ticket>> {
  await sleep(300)
  const ticket = mockTickets.find(t => t.id === id) || mockTickets[0]
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  
  const status: TicketStatus = data.rating <= 2 ? 'rectifying' : 'completed'
  const rectificationStatus = data.rating <= 2 ? 'pending' : undefined
  
  const updated: Ticket = {
    ...ticket,
    status,
    rating: data.rating,
    comment: data.comment,
    closeTime: ticket.closeTime || now,
    rectificationStatus,
    currentStep: data.rating <= 2 ? 5 : 5,
    timeline: [
      ...ticket.timeline,
      {
        id: 'tl_rate',
        status: 'completed',
        title: '满意度评价',
        description: `您已完成评价：${data.rating}星${data.comment ? ` - ${data.comment}` : ''}`,
        operator: ticket.anonymous ? '匿名用户' : ticket.userName,
        operatorRole: '诉求人',
        time: now
      }
    ]
  }

  if (data.rating <= 2) {
    updated.timeline.push({
      id: 'tl_rect_start',
      status: 'rectifying',
      title: '整改启动',
      description: '因评价不满意，已自动启动整改程序，将在5个工作日内完成整改',
      operator: '系统',
      operatorRole: '整改督办',
      time: now
    })
    updated.currentStep = 6

    const rectRecord: RectificationRecord = {
      id: 'rect_' + generateId(),
      ticketId: id,
      status: 'pending',
      triggerReason: `用户评价${data.rating}星，${data.comment || '对服务不满意'}`,
      responsibleDept: ticket.departmentName || '',
      responsiblePerson: ticket.assignee || '',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19),
      createTime: now
    }
    mockRectificationRecords.unshift(rectRecord)
  }

  const idx = mockTickets.findIndex(t => t.id === id)
  if (idx >= 0) mockTickets[idx] = updated
  return success(updated)
}

export async function getTicketStats(userId?: string, departmentId?: string): Promise<ApiResponse<{
  total: number
  pending: number
  assigned: number
  processing: number
  replied: number
  evaluating: number
  rectifying: number
  reviewing: number
  completed: number
  closed: number
  archived: number
  overdue: number
  avgRating: number
  pendingEvaluation: number
  badReview: number
}>> {
  await sleep(300)
  let list = mockTickets
  if (userId) list = list.filter(t => t.userId === userId)
  if (departmentId) list = list.filter(t => t.departmentId === departmentId)
  const rated = list.filter(t => t.rating !== undefined)
  const avgRating = rated.length > 0 ? rated.reduce((sum, t) => sum + (t.rating || 0), 0) / rated.length : 0
  return success({
    total: list.length,
    pending: list.filter(t => t.status === 'pending').length,
    assigned: list.filter(t => t.status === 'assigned').length,
    processing: list.filter(t => t.status === 'processing' || t.status === 'accepted').length,
    replied: list.filter(t => t.status === 'replied').length,
    evaluating: list.filter(t => t.status === 'evaluating').length,
    rectifying: list.filter(t => t.status === 'rectifying').length,
    reviewing: list.filter(t => t.status === 'reviewing').length,
    completed: list.filter(t => t.status === 'completed').length,
    closed: list.filter(t => t.status === 'closed').length,
    archived: list.filter(t => t.status === 'archived').length,
    overdue: list.filter(t => t.isOverdue).length,
    avgRating: Number(avgRating.toFixed(2)),
    pendingEvaluation: list.filter(t => t.status === 'replied' || t.status === 'evaluating').length,
    badReview: list.filter(t => t.rating && t.rating <= 2).length
  })
}

export async function getRectificationRecords(ticketId: string): Promise<ApiResponse<RectificationRecord[]>> {
  await sleep(300)
  const records = mockRectificationRecords.filter(r => r.ticketId === ticketId)
  return success(records)
}

export async function confirmRectificationSatisfied(recordId: string, satisfied: boolean): Promise<ApiResponse<boolean>> {
  await sleep(400)
  const record = mockRectificationRecords.find(r => r.id === recordId)
  if (record) {
    record.userSatisfied = satisfied
    record.status = satisfied ? 'verified' : 'failed'
    if (satisfied) {
      record.verifyTime = new Date().toISOString().replace('T', ' ').slice(0, 19)
    }
  }
  return success(true)
}

export async function applyReview(ticketId: string, reason: string): Promise<ApiResponse<ReviewRecord>> {
  await sleep(400)
  const ticket = mockTickets.find(t => t.id === ticketId) || mockTickets[0]
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  
  const record: ReviewRecord = {
    id: 'rev_' + generateId(),
    ticketId,
    reason,
    applicant: ticket.userName,
    applicantId: ticket.userId,
    status: 'pending',
    applyTime: now
  }
  mockReviewRecords.unshift(record)

  const updated: Ticket = {
    ...ticket,
    status: 'reviewing',
    reviewStatus: 'pending',
    currentStep: ticket.totalSteps + 1,
    timeline: [
      ...ticket.timeline,
      {
        id: 'tl_review',
        status: 'reviewing',
        title: '申请复查',
        description: `已申请复查：${reason}`,
        operator: ticket.anonymous ? '匿名用户' : ticket.userName,
        operatorRole: '诉求人',
        time: now
      }
    ]
  }
  const idx = mockTickets.findIndex(t => t.id === ticketId)
  if (idx >= 0) mockTickets[idx] = updated

  return success(record)
}

export async function getReviewRecords(ticketId: string): Promise<ApiResponse<ReviewRecord[]>> {
  await sleep(300)
  const records = mockReviewRecords.filter(r => r.ticketId === ticketId)
  return success(records)
}

export async function getDispatchRules(): Promise<ApiResponse<DispatchRule[]>> {
  await sleep(200)
  return success([...mockDispatchRules].sort((a, b) => a.priority - b.priority))
}

export async function createDispatchRule(data: Omit<DispatchRule, 'id' | 'createTime' | 'updateTime'>): Promise<ApiResponse<DispatchRule>> {
  await sleep(300)
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const rule: DispatchRule = {
    ...data,
    id: 'rule_' + generateId(),
    createTime: now,
    updateTime: now
  }
  mockDispatchRules.push(rule)
  return success(rule)
}

export async function updateDispatchRule(id: string, data: Partial<DispatchRule>): Promise<ApiResponse<DispatchRule>> {
  await sleep(300)
  const idx = mockDispatchRules.findIndex(r => r.id === id)
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  if (idx >= 0) {
    mockDispatchRules[idx] = {
      ...mockDispatchRules[idx],
      ...data,
      updateTime: now
    }
    return success(mockDispatchRules[idx])
  }
  return success(mockDispatchRules[0])
}

export async function deleteDispatchRule(id: string): Promise<ApiResponse<boolean>> {
  await sleep(300)
  const idx = mockDispatchRules.findIndex(r => r.id === id)
  if (idx >= 0) {
    mockDispatchRules.splice(idx, 1)
    return success(true)
  }
  return success(false)
}

export async function testDispatchRule(text: string): Promise<ApiResponse<{ rule: DispatchRule | null; matched: boolean }>> {
  await sleep(200)
  const lowerText = text.toLowerCase()
  const sortedRules = [...mockDispatchRules].sort((a, b) => a.priority - b.priority)
  for (const rule of sortedRules) {
    if (!rule.enabled) continue
    if (rule.keywords.some(kw => lowerText.includes(kw.toLowerCase()))) {
      return success({ rule, matched: true })
    }
  }
  return success({ rule: null, matched: false })
}

export async function getEvaluationTags(): Promise<ApiResponse<typeof evaluationTags>> {
  await sleep(200)
  return success(evaluationTags)
}

export async function cancelTicket(id: string, reason: string): Promise<ApiResponse<Ticket>> {
  await sleep(300)
  const ticket = mockTickets.find(t => t.id === id) || mockTickets[0]
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const updated: Ticket = {
    ...ticket,
    status: 'closed',
    closeTime: now,
    timeline: [
      ...ticket.timeline,
      {
        id: 'tl_cancel',
        status: 'closed',
        title: '诉求撤销',
        description: `诉求已撤销：${reason}`,
        operator: ticket.anonymous ? '匿名用户' : ticket.userName,
        operatorRole: '诉求人',
        time: now
      }
    ]
  }
  const idx = mockTickets.findIndex(t => t.id === id)
  if (idx >= 0) mockTickets[idx] = updated
  return success(updated)
}

export async function extendTicketDeadline(id: string, hours: number, reason: string): Promise<ApiResponse<Ticket>> {
  await sleep(300)
  const ticket = mockTickets.find(t => t.id === id) || mockTickets[0]
  const updated: Ticket = {
    ...ticket,
    slaHours: ticket.slaHours + hours,
    remainingHours: (ticket.remainingHours || 0) + hours,
    extendCount: (ticket.extendCount || 0) + 1
  }
  const idx = mockTickets.findIndex(t => t.id === id)
  if (idx >= 0) mockTickets[idx] = updated
  return success(updated)
}

export async function setTicketPriority(id: string, priority: TicketPriority): Promise<ApiResponse<Ticket>> {
  await sleep(200)
  const ticket = mockTickets.find(t => t.id === id) || mockTickets[0]
  const updated: Ticket = { ...ticket, priority }
  const idx = mockTickets.findIndex(t => t.id === id)
  if (idx >= 0) mockTickets[idx] = updated
  return success(updated)
}

export async function setKeySupervision(id: string, isKey: boolean): Promise<ApiResponse<Ticket>> {
  await sleep(200)
  const ticket = mockTickets.find(t => t.id === id) || mockTickets[0]
  const updated: Ticket = { ...ticket, isKeySupervision: isKey }
  const idx = mockTickets.findIndex(t => t.id === id)
  if (idx >= 0) mockTickets[idx] = updated
  return success(updated)
}
