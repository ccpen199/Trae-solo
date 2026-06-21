import { nanoid } from 'nanoid'

export interface AIScreenResult {
  id: string
  category: string
  categoryConfidence: number
  era?: string
  eraConfidence?: number
  authenticity: number
  features: string[]
  suggestions: string[]
  processedAt: string
}

const CATEGORIES = [
  '玉器', '陶瓷', '书画', '钱币', '青铜器', '木器',
  '杂项', '珠宝', '古籍善本', '织绣', '印章', '造像'
]

const ERAS: Record<string, string[]> = {
  '玉器': ['新石器时代', '商周', '秦汉', '唐宋', '明清', '近现代'],
  '陶瓷': ['原始青瓷', '唐宋', '元代', '明代', '清代', '近现代'],
  '书画': ['唐宋', '元代', '明代', '清代', '近现代', '当代'],
  '钱币': ['先秦', '秦汉', '唐宋', '明清', '民国', '近现代'],
  '青铜器': ['夏商', '西周', '春秋战国', '秦汉', '后世仿品'],
  '木器': ['宋元', '明代', '清代', '民国', '近现代'],
  '杂项': ['明代以前', '明清', '民国', '近现代'],
  '珠宝': ['古代', '近代', '现代'],
  '古籍善本': ['宋版', '元版', '明版', '清版', '民国'],
  '织绣': ['唐宋', '元明', '清代', '民国'],
  '印章': ['秦汉', '宋元', '明清', '近现代'],
  '造像': ['南北朝', '隋唐', '宋元', '明清', '近现代']
}

export function analyzeImage(imageBuffer?: Buffer): AIScreenResult {
  const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
  const categoryConfidence = 0.75 + Math.random() * 0.2
  const eras = ERAS[randomCategory] || ERAS['杂项']
  const randomEra = eras[Math.floor(Math.random() * eras.length)]
  const eraConfidence = 0.6 + Math.random() * 0.3
  const authenticity = 0.5 + Math.random() * 0.45

  const allFeatures: Record<string, string[]> = {
    '玉器': ['玉质温润', '包浆自然', '雕工精细', '沁色自然', '器型规整', '光泽柔和'],
    '陶瓷': ['青花发色纯正', '釉面莹润', '胎质细腻', '纹饰流畅', '底足老化自然', '器型端庄'],
    '书画': ['笔墨灵动', '章法严谨', '印章清晰', '纸绢老旧自然', '气韵生动', '落款规范'],
    '钱币': ['包浆醇厚', '文字清晰', '铸工规整', '边道自然', '锈色入骨', '形制规范'],
    '青铜器': ['铜质老熟', '锈层自然', '纹饰精美', '铸造痕迹明显', '器型古朴', '铭文清晰'],
    '木器': ['纹理自然', '包浆浑厚', '榫卯结构严谨', '雕刻精美', '材质上乘', '器型典雅'],
    '杂项': ['工艺精湛', '材质上乘', '年代特征明显', '保存完好', '包浆自然', '造型独特'],
    '珠宝': ['色泽鲜艳', '净度较高', '切工规整', '克拉重量适中', '天然特征明显', '光泽良好'],
    '古籍善本': ['纸张老旧', '刻印精良', '墨色纯正', '版式规整', '藏书章清晰', '保存完好'],
    '织绣': ['针法细腻', '配色和谐', '图案精美', '材质考究', '年代特征明显', '保存较好'],
    '印章': ['石材上乘', '篆刻工整', '印文清晰', '边款精致', '包浆自然', '形制规范'],
    '造像': ['开脸端庄', '衣纹流畅', '工艺精湛', '材质优良', '年代特征明显', '品相完好']
  }

  const categoryFeatures = allFeatures[randomCategory] || allFeatures['杂项']
  const featureCount = 2 + Math.floor(Math.random() * 3)
  const shuffled = [...categoryFeatures].sort(() => Math.random() - 0.5)
  const features = shuffled.slice(0, featureCount)

  const suggestions: string[] = []
  if (categoryConfidence < 0.85) {
    suggestions.push('建议上传更多角度的高清图片')
  }
  if (authenticity < 0.7) {
    suggestions.push('建议进一步送检实物进行专家鉴定')
  }
  if (randomCategory === '书画' || randomCategory === '陶瓷') {
    suggestions.push('可提供款识、底足等特写图片辅助判断')
  }
  if (suggestions.length === 0) {
    suggestions.push('AI识别结果仅供参考，请以专家鉴定为准')
  }

  return {
    id: nanoid(),
    category: randomCategory,
    categoryConfidence: Number(categoryConfidence.toFixed(2)),
    era: randomEra,
    eraConfidence: Number(eraConfidence.toFixed(2)),
    authenticity: Number(authenticity.toFixed(2)),
    features,
    suggestions,
    processedAt: new Date().toISOString()
  }
}

export function getAICategories(): { code: string; name: string; description: string }[] {
  const descriptions: Record<string, string> = {
    '玉器': '包括和田玉、翡翠、独山玉等各类玉石制品',
    '陶瓷': '从原始青瓷到近现代瓷器，涵盖各窑口产品',
    '书画': '书法、绘画作品，包括水墨、设色等',
    '钱币': '古钱币、机制币、纸币等各类钱币',
    '青铜器': '夏商周至汉代青铜器及后世仿品',
    '木器': '黄花梨、紫檀、红木等硬木家具及木雕',
    '杂项': '文房四宝、紫砂、鼻烟壶等文玩杂项',
    '珠宝': '钻石、红蓝宝石、祖母绿等贵重宝石',
    '古籍善本': '宋版、元版、明版、清版等古籍刻本',
    '织绣': '刺绣、缂丝、云锦等各类织绣品',
    '印章': '各类材质印章，包括名家篆刻',
    '造像': '佛造像、道教造像等各类宗教造像'
  }
  return CATEGORIES.map((name, idx) => ({
    code: `CAT_${String(idx + 1).padStart(3, '0')}`,
    name,
    description: descriptions[name] || ''
  }))
}
