import { Router, type Request, type Response } from 'express'

const router = Router()

interface ContentItem {
  id: string
  type: 'recipe' | 'exercise' | 'article' | 'audio'
  title: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  accessibilityScore?: number
  submittedAt: string
  preview?: string
  author?: string
}

const contentItems: ContentItem[] = [
  {
    id: 'c001',
    type: 'recipe',
    title: '养生粥谱：红枣桂圆小米粥',
    content: '红枣桂圆小米粥是一道非常适合中老年人的养生粥品。材料：小米100克、红枣10颗、桂圆肉20克、红糖适量。做法：1.小米淘洗干净，红枣去核，桂圆肉洗净备用。2.锅中加适量清水，放入小米大火煮开。3.转小火煮20分钟后加入红枣和桂圆肉，继续煮15分钟。4.根据口味加入适量红糖，搅拌均匀即可食用。功效：补气养血、健脾养胃、安神助眠，适合气血不足、脾胃虚弱的老年朋友。',
    status: 'pending',
    accessibilityScore: 85,
    submittedAt: '2026-06-18 09:30:00',
    preview: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&h=200&fit=crop',
    author: '李阿姨',
  },
  {
    id: 'c002',
    type: 'exercise',
    title: '手指保健操：每天10分钟健脑防痴呆',
    content: '手指与大脑神经紧密相连，经常活动手指可以刺激大脑，预防老年痴呆。具体动作：1.十指交叉握手：双手十指交叉，用力相握后松开，重复20次。2.拇指绕环：双手拇指分别顺时针、逆时针各绕环10次。3.逐个屈伸：从拇指到小指依次屈伸，再从小指到拇指反方向进行，重复5组。4.指尖相碰：双手指尖相对，用力相碰后放松，重复30次。建议每天早晚各练习一次，坚持锻炼效果更佳。',
    status: 'pending',
    accessibilityScore: 92,
    submittedAt: '2026-06-18 10:15:00',
    preview: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=300&h=200&fit=crop',
    author: '王医生',
  },
  {
    id: 'c003',
    type: 'article',
    title: '高血压患者夏季饮食注意事项',
    content: '夏季天气炎热，高血压患者需要特别注意饮食调节。1.多吃新鲜蔬菜水果：如芹菜、苦瓜、西红柿、西瓜等，富含钾元素有助于降压。2.控制盐分摄入：每日食盐不超过5克，少吃腌制品、酱菜等。3.补充足够水分：少量多次饮用温开水，避免一次性大量饮水。4.清淡饮食：少吃油腻、辛辣食物，避免血压波动。5.适量饮茶：可适量饮用菊花茶、山楂茶，有辅助降压作用。6.戒烟限酒：烟酒是高血压的危险因素，应严格戒除。',
    status: 'pending',
    accessibilityScore: 78,
    submittedAt: '2026-06-18 14:20:00',
    preview: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300&h=200&fit=crop',
    author: '张教授',
  },
  {
    id: 'c004',
    type: 'audio',
    title: '睡前放松冥想音频（20分钟）',
    content: '本音频专为中老年人设计，通过舒缓的音乐和引导语，帮助您放松身心，改善睡眠质量。内容包括：深呼吸引导、全身渐进式放松、想象美好场景等。建议每晚睡前躺在床上收听，音量调至舒适程度，跟随引导语慢慢进入放松状态。坚持使用可有效改善入睡困难、睡眠浅等问题。',
    status: 'approved',
    accessibilityScore: 95,
    submittedAt: '2026-06-17 16:45:00',
    preview: 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?w=300&h=200&fit=crop',
    author: '陈老师',
  },
  {
    id: 'c005',
    type: 'recipe',
    title: '糖尿病友好食谱：凉拌三丝',
    content: '凉拌三丝清爽可口，低热量高纤维，非常适合糖尿病患者食用。材料：胡萝卜1根、黄瓜1根、木耳50克、蒜末、生抽、醋、香油少许。做法：1.胡萝卜、黄瓜切丝，木耳泡发后切丝焯水。2.将三丝放入大碗中，加入蒜末。3.淋入少许生抽、香醋和香油，搅拌均匀即可。提示：糖尿病患者食用时少盐少油，避免加入白糖。可根据喜好加入香菜、芝麻调味。',
    status: 'approved',
    accessibilityScore: 88,
    submittedAt: '2026-06-17 11:00:00',
    preview: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&h=200&fit=crop',
    author: '营养师刘',
  },
  {
    id: 'c006',
    type: 'article',
    title: '老年人如何科学补钙',
    content: '随着年龄增长，钙质流失加快，科学补钙对老年人非常重要。1.饮食补钙：多吃奶制品、豆制品、鱼虾、绿叶蔬菜等含钙丰富的食物。2.适量晒太阳：每天15-20分钟阳光照射，促进维生素D合成，帮助钙吸收。3.选择合适钙剂：建议选择碳酸钙或柠檬酸钙，同时补充维生素D。4.避免影响吸收的因素：少喝浓茶、咖啡，避免与菠菜等含草酸食物同食。5.适度运动：散步、太极拳等运动有助于维持骨密度。注意：补钙不可过量，每日摄入量控制在800-1000毫克为宜。',
    status: 'pending',
    accessibilityScore: 82,
    submittedAt: '2026-06-18 08:30:00',
    preview: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&h=200&fit=crop',
    author: '赵医生',
  },
  {
    id: 'c007',
    type: 'exercise',
    title: '颈椎保健操：缓解颈部僵硬疼痛',
    content: '老年人颈椎容易出现问题，这套简单的颈椎操每天做一遍，有效缓解颈部不适。动作一：左右转头：头缓缓向左转至最大幅度，保持3秒，再向右转，重复10次。动作二：前后点头：头缓缓前屈至下巴贴胸，保持3秒，再后仰至最大限度，重复10次。动作三：左右侧屈：头向左侧屈，左耳尽量靠近左肩，保持3秒，再向右侧，重复10次。动作四：米字操：用头在空中写米字，每个方向做到最大幅度，重复5遍。注意：动作要缓慢柔和，不可用力过猛，头晕时立即停止。',
    status: 'rejected',
    accessibilityScore: 70,
    submittedAt: '2026-06-16 15:20:00',
    preview: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
    author: '健身达人',
  },
  {
    id: 'c008',
    type: 'audio',
    title: '经典老歌精选合集（一）',
    content: '精选50-80年代脍炙人口的经典老歌20首，包括《我的祖国》《歌唱祖国》《在希望的田野上》《洪湖水浪打浪》等耳熟能详的歌曲。音质清晰，音量适中，适合老年朋友收听。可在做家务、散步、休息时播放，唤起美好回忆，愉悦身心。',
    status: 'pending',
    accessibilityScore: 90,
    submittedAt: '2026-06-18 13:10:00',
    preview: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&h=200&fit=crop',
    author: '音乐爱好者',
  },
]

interface ReviewRecord {
  id: string
  contentId: string
  reviewerId: string
  reviewerName: string
  result: 'approved' | 'rejected'
  comment?: string
  reviewedAt: string
}

const reviewRecords: ReviewRecord[] = [
  {
    id: 'r001',
    contentId: 'c004',
    reviewerId: 'admin001',
    reviewerName: '管理员老王',
    result: 'approved',
    reviewedAt: '2026-06-18 10:00:00',
    comment: '内容质量优秀，音频清晰，适合老年用户收听。',
  },
  {
    id: 'r002',
    contentId: 'c005',
    reviewerId: 'admin001',
    reviewerName: '管理员老王',
    result: 'approved',
    reviewedAt: '2026-06-18 09:30:00',
  },
  {
    id: 'r003',
    contentId: 'c007',
    reviewerId: 'admin002',
    reviewerName: '管理员小李',
    result: 'rejected',
    reviewedAt: '2026-06-17 16:00:00',
    comment: '部分动作描述不够清晰，缺少安全注意事项，建议补充完善后重新提交。',
  },
]

router.get('/review/list', (req: Request, res: Response): void => {
  const { status } = req.query

  let filteredItems = contentItems

  if (status) {
    filteredItems = contentItems.filter((item) => item.status === status)
  }

  const stats = {
    total: contentItems.length,
    pending: contentItems.filter((i) => i.status === 'pending').length,
    approved: contentItems.filter((i) => i.status === 'approved').length,
    rejected: contentItems.filter((i) => i.status === 'rejected').length,
  }

  res.json({
    success: true,
    message: '获取待审核列表成功',
    data: {
      list: filteredItems,
      stats,
      records: reviewRecords,
    },
  })
})

router.post('/review/approve', (req: Request, res: Response): void => {
  const { contentId } = req.body

  if (!contentId) {
    res.status(400).json({
      success: false,
      message: '请提供内容ID',
      data: null,
    })
    return
  }

  const contentIndex = contentItems.findIndex((c) => c.id === contentId)
  if (contentIndex === -1) {
    res.status(404).json({
      success: false,
      message: '内容不存在',
      data: null,
    })
    return
  }

  contentItems[contentIndex].status = 'approved'

  const newRecord: ReviewRecord = {
    id: `r${Date.now()}`,
    contentId,
    reviewerId: 'admin001',
    reviewerName: '当前管理员',
    result: 'approved',
    reviewedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
  }
  reviewRecords.unshift(newRecord)

  res.json({
    success: true,
    message: '审核通过成功',
    data: {
      content: contentItems[contentIndex],
      record: newRecord,
    },
  })
})

router.post('/review/reject', (req: Request, res: Response): void => {
  const { contentId, comment } = req.body

  if (!contentId) {
    res.status(400).json({
      success: false,
      message: '请提供内容ID',
      data: null,
    })
    return
  }

  if (!comment || !comment.trim()) {
    res.status(400).json({
      success: false,
      message: '请填写驳回原因',
      data: null,
    })
    return
  }

  const contentIndex = contentItems.findIndex((c) => c.id === contentId)
  if (contentIndex === -1) {
    res.status(404).json({
      success: false,
      message: '内容不存在',
      data: null,
    })
    return
  }

  contentItems[contentIndex].status = 'rejected'

  const newRecord: ReviewRecord = {
    id: `r${Date.now()}`,
    contentId,
    reviewerId: 'admin001',
    reviewerName: '当前管理员',
    result: 'rejected',
    comment,
    reviewedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
  }
  reviewRecords.unshift(newRecord)

  res.json({
    success: true,
    message: '审核驳回成功',
    data: {
      content: contentItems[contentIndex],
      record: newRecord,
    },
  })
})

export default router
