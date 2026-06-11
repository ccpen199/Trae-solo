export interface Declaration {
  id: string
  category: string
  currentTitle: string
  targetTitle: string
  status: 'draft' | 'submitted' | 'initial_review' | 're_review' | 'expert_review' | 'public_notice' | 'issued'
  statusName: string
  submitTime: string
  materials: Material[]
  progress: ProgressNode[]
}

export interface Material {
  id: string
  name: string
  type: 'id_card' | 'certificate' | 'work_proof' | 'education' | 'other'
  uploaded: boolean
  ocrResult?: Record<string, string>
  ocrStatus: 'pending' | 'success' | 'failed'
}

export interface ProgressNode {
  step: string
  status: 'completed' | 'current' | 'pending'
  time?: string
  operator?: string
  remark?: string
}

export interface ReviewItem {
  id: string
  applicant: string
  category: string
  targetTitle: string
  submitTime: string
  score: number
  comment: string
}

export const declarationList: Declaration[] = [
  {
    id: '1',
    category: '工程技术',
    currentTitle: '工程师',
    targetTitle: '高级工程师',
    status: 'expert_review',
    statusName: '专家评审中',
    submitTime: '2026-05-15 10:00:00',
    materials: [
      { id: '1', name: '身份证正反面', type: 'id_card', uploaded: true, ocrResult: { name: '张伟', idCard: '4401061990****2518' }, ocrStatus: 'success' },
      { id: '2', name: '现有职称证书', type: 'certificate', uploaded: true, ocrResult: { title: '工程师', issueDate: '2020-06' }, ocrStatus: 'success' },
      { id: '3', name: '工作业绩证明', type: 'work_proof', uploaded: true, ocrStatus: 'success' },
      { id: '4', name: '学历学位证书', type: 'education', uploaded: true, ocrResult: { school: '华南理工大学', degree: '硕士' }, ocrStatus: 'success' },
    ],
    progress: [
      { step: '材料提交', status: 'completed', time: '2026-05-15 10:00', operator: '张伟' },
      { step: '初审', status: 'completed', time: '2026-05-18 14:30', operator: '李审核员', remark: '材料齐全，通过初审' },
      { step: '复审', status: 'completed', time: '2026-05-22 09:15', operator: '王审核员', remark: '符合申报条件' },
      { step: '专家评审', status: 'current', time: '2026-06-01 10:00', operator: '评审专家组' },
      { step: '公示', status: 'pending' },
      { step: '发证', status: 'pending' },
    ],
  },
  {
    id: '2',
    category: '教育',
    currentTitle: '讲师',
    targetTitle: '副教授',
    status: 'submitted',
    statusName: '已提交',
    submitTime: '2026-06-01 14:20:00',
    materials: [
      { id: '5', name: '身份证正反面', type: 'id_card', uploaded: true, ocrStatus: 'success' },
      { id: '6', name: '现有职称证书', type: 'certificate', uploaded: true, ocrStatus: 'success' },
      { id: '7', name: '教学工作量证明', type: 'work_proof', uploaded: true, ocrStatus: 'pending' },
      { id: '8', name: '科研成果材料', type: 'other', uploaded: false, ocrStatus: 'pending' },
    ],
    progress: [
      { step: '材料提交', status: 'completed', time: '2026-06-01 14:20', operator: '张伟' },
      { step: '初审', status: 'current' },
      { step: '复审', status: 'pending' },
      { step: '专家评审', status: 'pending' },
      { step: '公示', status: 'pending' },
      { step: '发证', status: 'pending' },
    ],
  },
]

export const reviewItems: ReviewItem[] = [
  { id: '1', applicant: '赵明', category: '工程技术', targetTitle: '高级工程师', submitTime: '2026-05-10', score: 0, comment: '' },
  { id: '2', applicant: '孙丽', category: '医疗卫生', targetTitle: '副主任医师', submitTime: '2026-05-12', score: 0, comment: '' },
  { id: '3', applicant: '周强', category: '农业技术', targetTitle: '高级农艺师', submitTime: '2026-05-14', score: 0, comment: '' },
]
