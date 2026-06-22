import { ItemCategory, SubjectType, ReviewStatus, ReviewStage } from '../types'

export const categoryLabels: Record<ItemCategory, string> = {
  household: '户政服务',
  education: '教育培训',
  traffic: '交通出行',
  social_security: '社会保障',
  medical: '医疗健康',
  housing: '住房服务',
  business: '企业服务',
  other: '其他事项',
}

export const categoryColors: Record<ItemCategory, string> = {
  household: 'bg-red-100 text-red-700',
  education: 'bg-blue-100 text-blue-700',
  traffic: 'bg-green-100 text-green-700',
  social_security: 'bg-purple-100 text-purple-700',
  medical: 'bg-pink-100 text-pink-700',
  housing: 'bg-yellow-100 text-yellow-700',
  business: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-700',
}

export const subjectLabels: Record<SubjectType, string> = {
  personal: '个人',
  enterprise: '企业',
  both: '个人/企业',
}

export const subjectColors: Record<SubjectType, string> = {
  personal: 'bg-sky-100 text-sky-700',
  enterprise: 'bg-orange-100 text-orange-700',
  both: 'bg-teal-100 text-teal-700',
}

export const reviewStatusLabels: Record<ReviewStatus, string> = {
  draft: '草稿',
  pending_editor: '待编辑审核',
  pending_supervisor: '待主管审核',
  pending_legal: '待法律顾问审核',
  published: '已发布',
  rejected: '已驳回',
}

export const reviewStatusColors: Record<ReviewStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_editor: 'bg-yellow-100 text-yellow-700',
  pending_supervisor: 'bg-orange-100 text-orange-700',
  pending_legal: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export const reviewStageLabels: Record<ReviewStage, string> = {
  editor: '编辑审核',
  supervisor: '主管审核',
  legal: '法律顾问审核',
}

export const reviewStageOrder: ReviewStage[] = ['editor', 'supervisor', 'legal']
