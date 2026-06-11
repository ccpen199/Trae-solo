import type {
  User,
  Lawyer,
  AdminUser,
  Consultation,
  Message,
  Evaluation,
  Appeal,
  MonitoringStats,
  Evidence,
  LegalCaseType,
  ConsultationStatus,
  MessageType
} from '@/types'
import {
  users,
  lawyers,
  admins,
  consultations,
  messages,
  evaluations,
  appeals,
  monitoringStats,
  evidences
} from './data'

const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

export interface LoginParams {
  phone: string
  password?: string
  role: 'user' | 'lawyer' | 'admin'
}

export interface CreateConsultationParams {
  userId: string
  caseType: LegalCaseType
  title: string
  description: string
  region: string
  evidences?: Omit<Evidence, 'id' | 'consultationId' | 'uploaderId' | 'createdAt'>[]
  assignedLawyerId?: string
}

export interface SendMessageParams {
  consultationId: string
  senderId: string
  type: 'text' | 'image' | 'file'
  content: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  isSelfDestruct?: boolean
  selfDestructAfter?: number
}

export interface CreateEvaluationParams {
  consultationId: string
  userId: string
  lawyerId: string
  rating: number
  content?: string
  tags?: string[]
}

export interface CreateAppealParams {
  consultationId: string
  appellantId: string
  respondentId: string
  reason: string
  description: string
  evidences?: Omit<Evidence, 'id' | 'consultationId' | 'uploaderId' | 'createdAt'>[]
}

export interface ResolveAppealParams {
  appealId: string
  arbitratorId: string
  arbitrationResult: string
  accepted: boolean
}

let currentUser: User | Lawyer | AdminUser | null = null

export const mockApi = {
  async login(params: LoginParams): Promise<User | Lawyer | AdminUser> {
    await delay()
    if (params.role === 'admin') {
      const admin = admins.find(a => a.username === params.phone)
      if (!admin) throw new Error('管理员账号不存在')
      currentUser = admin
      return admin
    }
    if (params.role === 'lawyer') {
      const lawyer = lawyers.find(l => l.phone === params.phone)
      if (!lawyer) throw new Error('律师账号不存在')
      if (lawyer.status === 'frozen') throw new Error('该律师账号已被冻结')
      currentUser = lawyer
      return lawyer
    }
    const user = users.find(u => u.phone === params.phone)
    if (!user) throw new Error('用户账号不存在')
    currentUser = user
    return user
  },

  async getCurrentUser(): Promise<User | Lawyer | AdminUser | null> {
    await delay(200)
    return currentUser
  },

  async getUserInfo(userId: string): Promise<User | Lawyer | AdminUser | undefined> {
    await delay()
    const user = users.find(u => u.id === userId)
    if (user) return user
    const lawyer = lawyers.find(l => l.id === userId)
    if (lawyer) return lawyer
    return admins.find(a => a.id === userId)
  },

  async getConsultationList(params?: {
    userId?: string
    lawyerId?: string
    status?: ConsultationStatus
  }): Promise<Consultation[]> {
    await delay()
    let result = [...consultations]
    if (params?.userId) {
      result = result.filter(c => c.userId === params.userId)
    }
    if (params?.lawyerId) {
      result = result.filter(c => c.lawyerId === params.lawyerId)
    }
    if (params?.status) {
      result = result.filter(c => c.status === params.status)
    }
    return result.sort((a, b) => b.createdAt - a.createdAt)
  },

  async createConsultation(params: CreateConsultationParams): Promise<Consultation> {
    await delay()
    const newConsultation: Consultation = {
      id: `consult-${Date.now()}`,
      userId: params.userId,
      caseType: params.caseType,
      title: params.title,
      description: params.description,
      region: params.region,
      status: params.assignedLawyerId ? 'dispatched' : 'pending',
      dispatchMode: params.assignedLawyerId ? 'manual' : 'auto',
      lawyerId: params.assignedLawyerId,
      evidences: [],
      createdAt: Date.now(),
      dispatchedAt: params.assignedLawyerId ? Date.now() : undefined,
      acceptedAt: params.assignedLawyerId ? Date.now() : undefined,
    }
    if (params.evidences) {
      newConsultation.evidences = params.evidences.map((e, idx) => ({
        ...e,
        id: `evidence-${Date.now()}-${idx}`,
        consultationId: newConsultation.id,
        uploaderId: params.userId,
        createdAt: Date.now()
      }))
    }
    consultations.push(newConsultation)
    return newConsultation
  },

  async getConsultationDetail(consultationId: string): Promise<Consultation | undefined> {
    await delay()
    return consultations.find(c => c.id === consultationId)
  },

  async getGrabPool(): Promise<Consultation[]> {
    await delay()
    return consultations.filter(c => c.status === 'pending' && c.dispatchMode === 'grab')
  },

  async grabConsultation(consultationId: string, lawyerId: string): Promise<Consultation> {
    await delay()
    const consultation = consultations.find(c => c.id === consultationId)
    if (!consultation) throw new Error('咨询不存在')
    if (consultation.status !== 'pending') throw new Error('该咨询已被接单')
    const lawyer = lawyers.find(l => l.id === lawyerId)
    if (!lawyer) throw new Error('律师不存在')
    if (lawyer.status !== 'active') throw new Error('律师状态异常，无法接单')
    consultation.lawyerId = lawyerId
    consultation.status = 'dispatched'
    consultation.dispatchedAt = Date.now()
    consultation.acceptedAt = Date.now()
    return consultation
  },

  async assignLawyer(consultationId: string, lawyerId: string): Promise<Consultation> {
    await delay()
    const consultation = consultations.find(c => c.id === consultationId)
    if (!consultation) throw new Error('咨询不存在')
    const lawyer = lawyers.find(l => l.id === lawyerId)
    if (!lawyer) throw new Error('律师不存在')
    if (lawyer.status !== 'active') throw new Error('律师状态异常，无法指派')
    consultation.lawyerId = lawyerId
    consultation.status = 'dispatched'
    consultation.dispatchMode = 'manual'
    consultation.dispatchedAt = Date.now()
    return consultation
  },

  async getMessages(consultationId: string): Promise<Message[]> {
    await delay()
    return messages
      .filter(m => m.consultationId === consultationId)
      .sort((a, b) => a.createdAt - b.createdAt)
  },

  async sendMessage(params: SendMessageParams): Promise<Message> {
    await delay()
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      consultationId: params.consultationId,
      senderId: params.senderId,
      senderType: 'user',
      type: params.type,
      messageType: params.type,
      content: params.content,
      fileUrl: params.fileUrl,
      fileName: params.fileName,
      fileSize: params.fileSize,
      isEncrypted: true,
      encrypted: true,
      isSelfDestruct: params.isSelfDestruct || false,
      burnAfterRead: params.isSelfDestruct || false,
      burnDuration: params.selfDestructAfter,
      selfDestructAfter: params.selfDestructAfter,
      createdAt: Date.now()
    }
    messages.push(newMessage)
    return newMessage
  },

  async createEvaluation(params: CreateEvaluationParams): Promise<Evaluation> {
    await delay()
    const newEvaluation: Evaluation = {
      id: `eval-${Date.now()}`,
      consultationId: params.consultationId,
      userId: params.userId,
      lawyerId: params.lawyerId,
      rating: params.rating,
      content: params.content,
      tags: params.tags,
      createdAt: Date.now()
    }
    evaluations.push(newEvaluation)
    const consultation = consultations.find(c => c.id === params.consultationId)
    if (consultation) {
      consultation.status = 'completed'
      consultation.completedAt = Date.now()
    }
    return newEvaluation
  },

  async submitAppeal(params: CreateAppealParams): Promise<Appeal> {
    await delay()
    const newAppeal: Appeal = {
      id: `appeal-${Date.now()}`,
      consultationId: params.consultationId,
      appellantId: params.appellantId,
      respondentId: params.respondentId,
      reason: params.reason,
      description: params.description,
      evidences: [],
      status: 'pending',
      createdAt: Date.now()
    }
    if (params.evidences) {
      newAppeal.evidences = params.evidences.map((e, idx) => ({
        ...e,
        id: `appeal-evidence-${Date.now()}-${idx}`,
        consultationId: params.consultationId,
        uploaderId: params.appellantId,
        createdAt: Date.now()
      }))
    }
    appeals.push(newAppeal)
    return newAppeal
  },

  async resolveAppeal(params: ResolveAppealParams): Promise<Appeal> {
    await delay()
    const appeal = appeals.find(a => a.id === params.appealId)
    if (!appeal) throw new Error('申诉不存在')
    appeal.arbitratorId = params.arbitratorId
    appeal.arbitrationResult = params.arbitrationResult
    appeal.status = params.accepted ? 'resolved' : 'rejected'
    appeal.acceptedAt = Date.now()
    appeal.resolvedAt = Date.now()
    return appeal
  },

  async getMonitoringStats(): Promise<MonitoringStats> {
    await delay()
    return monitoringStats
  },

  async freezeLawyer(lawyerId: string, reason: string): Promise<Lawyer> {
    await delay()
    const lawyer = lawyers.find(l => l.id === lawyerId)
    if (!lawyer) throw new Error('律师不存在')
    lawyer.status = 'frozen'
    lawyer.updatedAt = Date.now()
    monitoringStats.frozenLawyers = lawyers.filter(l => l.status === 'frozen').length
    monitoringStats.activeLawyers = lawyers.filter(l => l.status === 'active').length
    return lawyer
  },

  async getLawyers(): Promise<Lawyer[]> {
    await delay()
    return [...lawyers]
  }
}
