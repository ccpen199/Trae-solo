import { Router, type Request, type Response } from 'express'

const router = Router()

const skillKeywords = [
  'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java',
  'Go', 'Rust', 'Docker', 'Kubernetes', 'AWS', 'GraphQL', 'REST', 'SQL', 'MongoDB',
  'Redis', 'Git', 'CI/CD', 'Webpack', 'Vite', 'CSS', 'HTML', 'Flutter', 'Swift',
  'Kotlin', 'C++', 'Machine Learning', 'Deep Learning', 'NLP', 'Data Analysis'
]

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase()
  return skillKeywords.filter(kw => lower.includes(kw.toLowerCase()))
}

function calculateMatch(resumeSkills: string[], jdKeywords: string[]): { matched: string[]; missing: string[]; score: number } {
  const resumeLower = resumeSkills.map(s => s.toLowerCase())
  const matched = jdKeywords.filter(kw => resumeLower.some(rs => rs.includes(kw.toLowerCase()) || kw.toLowerCase().includes(rs)))
  const missing = jdKeywords.filter(kw => !resumeLower.some(rs => rs.includes(kw.toLowerCase()) || kw.toLowerCase().includes(rs)))
  const score = jdKeywords.length > 0 ? Math.round((matched.length / jdKeywords.length) * 100) : 0
  return { matched, missing, score }
}

function checkGrammar(text: string): { text: string; offset: number; length: number; message: string; suggestion: string }[] {
  const errors: { text: string; offset: number; length: number; message: string; suggestion: string }[] = []
  const words = text.split(/\s+/)
  let offset = 0

  for (let i = 1; i < words.length; i++) {
    if (words[i].toLowerCase() === words[i - 1].toLowerCase() && words[i].length > 2) {
      const pos = text.indexOf(words[i], offset)
      errors.push({
        text: words[i],
        offset: pos,
        length: words[i].length,
        message: `重复词语: "${words[i]}"`,
        suggestion: `删除重复的 "${words[i]}"`
      })
    }
    offset += words[i - 1].length + 1
  }

  const sentences = text.split(/[.!?。！？]/).filter(s => s.trim().length > 0)
  let charOffset = 0
  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (trimmed.length > 0 && /^[a-z]/.test(trimmed)) {
      const pos = text.indexOf(trimmed, charOffset)
      errors.push({
        text: trimmed.slice(0, 20),
        offset: pos,
        length: 1,
        message: '句子首字母未大写',
        suggestion: `将 "${trimmed[0]}" 改为 "${trimmed[0].toUpperCase()}"`
      })
    }
    charOffset += sentence.length + 1
  }

  if (text.length > 50 && !/[.!?。！？]$/.test(text.trim())) {
    errors.push({
      text: text.trim().slice(-10),
      offset: text.trim().length - 1,
      length: 1,
      message: '文本末尾缺少标点符号',
      suggestion: '在末尾添加句号或其他结束标点'
    })
  }

  return errors
}

router.post('/match', (req: Request, res: Response): void => {
  const { resumeText, jdText } = req.body
  if (!resumeText || !jdText) {
    res.status(400).json({ success: false, error: '请提供简历文本和职位描述文本' })
    return
  }

  const jdKeywords = extractKeywords(jdText)
  const resumeSkills = extractKeywords(resumeText)
  const { matched, missing, score } = calculateMatch(resumeSkills, jdKeywords)

  res.json({
    success: true,
    data: {
      jdMatchScore: score,
      matchedSkills: matched,
      missingSkills: missing,
      suggestions: [
        ...(missing.length > 0 ? [{ priority: 'high' as const, category: '技能匹配', content: `建议补充以下技能关键词: ${missing.join(', ')}` }] : []),
        ...(score < 60 ? [{ priority: 'medium' as const, category: '匹配度提升', content: '当前匹配度较低，建议根据职位描述调整简历内容' }] : []),
        ...(score >= 60 && score < 80 ? [{ priority: 'low' as const, category: '匹配度优化', content: '匹配度尚可，进一步突出相关经验可提高通过率' }] : [])
      ]
    }
  })
})

router.post('/grammar', (req: Request, res: Response): void => {
  const { text } = req.body
  if (!text) {
    res.status(400).json({ success: false, error: '请提供待检查的文本' })
    return
  }

  const errors = checkGrammar(text)

  res.json({
    success: true,
    data: {
      grammarErrors: errors,
      errorCount: errors.length,
      suggestions: errors.map(e => ({
        priority: e.message.includes('重复') ? 'high' as const : 'medium' as const,
        category: '语法检查',
        content: e.suggestion
      }))
    }
  })
})

router.get('/fitness/:resumeId', (req: Request, res: Response): void => {
  const { resumeId } = req.params

  res.json({
    success: true,
    data: {
      resumeId,
      fitnessScore: {
        overall: 76,
        dimensions: [
          { name: '内容完整度', score: 82, benchmark: 75 },
          { name: '关键词密度', score: 68, benchmark: 70 },
          { name: '格式规范', score: 90, benchmark: 80 },
          { name: '经历相关性', score: 72, benchmark: 65 },
          { name: 'ATS兼容性', score: 78, benchmark: 70 }
        ]
      },
      suggestions: [
        { priority: 'high', category: '关键词', content: '增加与目标岗位匹配的技术关键词出现频次' },
        { priority: 'medium', category: '经历描述', content: '使用STAR法则重新组织项目经历描述' },
        { priority: 'low', category: '格式优化', content: '确保简历格式与ATS系统兼容，避免使用复杂排版' }
      ]
    }
  })
})

export default router
