import db from './db.js'

const requiredSections = {
  complaint: ['原告', '被告', '诉讼请求', '事实与理由', '此致', '起诉人'],
  answer: ['答辩人', '被答辩人', '答辩如下', '此致', '答辩人'],
  contract: ['甲方', '乙方', '委托事项', '委托权限', '律师费用', '违约责任']
}

const conflictingPairs = [
  ['甲方无需承担责任', '甲方承担全部责任'],
  ['不得解除合同', '可以随时解除合同'],
  ['免费代理', '支付律师费'],
  ['风险代理', '固定收费']
]

export const validateFormat = (content, type = 'complaint') => {
  const required = requiredSections[type] || requiredSections.complaint
  const missing = []
  
  for (const section of required) {
    if (!content.includes(section)) {
      missing.push(section)
    }
  }
  
  return {
    valid: missing.length === 0,
    missingSections: missing,
    score: Math.round(((required.length - missing.length) / required.length) * 100)
  }
}

export const detectConflicts = (content) => {
  const conflicts = []
  
  for (const [a, b] of conflictingPairs) {
    const hasA = content.includes(a)
    const hasB = content.includes(b)
    if (hasA && hasB) {
      conflicts.push({ clauseA: a, clauseB: b, severity: 'high' })
    }
  }
  
  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    riskLevel: conflicts.length > 0 ? 'high' : 'low'
  }
}

export const generateDocument = (templateId, data = {}) => {
  const template = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(templateId)
  if (!template) throw new Error('Template not found')
  
  let content = template.content
  
  for (const [key, value] of Object.entries(data)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '')
  }
  
  const formatValidation = validateFormat(content, template.type)
  const conflictDetection = detectConflicts(content)
  
  return {
    content,
    templateName: template.name,
    templateType: template.type,
    formatValidation,
    conflictDetection,
    clauseReferences: template.clause_references,
    regionTag: template.region_tag
  }
}

export default { validateFormat, detectConflicts, generateDocument }
