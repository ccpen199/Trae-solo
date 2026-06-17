import { Router, type Request, type Response } from 'express'
import type { CommunityPost, PostCategory } from '../../shared/types.js'

const router = Router()

const categoryLabels: Record<PostCategory, string> = {
  knowledge: '养宠知识',
  story: '萌宠故事',
  question: '求助问答',
  'vet-article': '兽医专栏',
}

const mockPosts: CommunityPost[] = [
  {
    id: 'post1',
    authorId: 'vet1',
    authorName: '李兽医',
    authorAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop',
    isVetCertified: true,
    title: '夏季猫咪脱水的5个危险信号，主人一定要注意！',
    content: '夏天气温高，猫咪很容易出现脱水情况。本文从兽医专业角度，详细介绍猫咪脱水的早期症状、判断方法以及预防措施。包括：观察牙龈湿度、检查皮肤弹性、注意饮水量变化、观察精神状态、检查眼窝凹陷等。建议家中常备电解质水，定期监测猫咪健康状况...',
    category: 'vet-article',
    tags: ['猫咪', '夏季护理', '健康', '兽医建议'],
    likes: 328,
    comments: 56,
    createdAt: '2026-06-15T09:00:00Z',
  },
  {
    id: 'post2',
    authorId: 'user2',
    authorName: '柴犬妈妈',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    isVetCertified: false,
    title: '我家豆豆学会握手了！分享训练心得~',
    content: '训练了整整两周，我家柴犬豆豆终于学会握手了！！！分享一下我的训练方法：1. 选择狗狗精力充沛但不是特别饿的时候；2. 准备它最爱的小零食；3. 每次训练不超过10分钟；4. 指令要清晰一致；5. 做对了立刻奖励和表扬。最重要的是耐心！大家加油！',
    category: 'story',
    tags: ['柴犬', '训练', '狗狗', '经验分享'],
    likes: 156,
    comments: 34,
    createdAt: '2026-06-14T20:30:00Z',
  },
  {
    id: 'post3',
    authorId: 'user3',
    authorName: '新手猫奴',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    isVetCertified: false,
    title: '【求助】刚领养的小猫一直躲在沙发底下不出来怎么办？',
    content: '昨天刚从救助站领养了一只2岁的英短，回家后就一直躲在沙发底下，叫它也不出来，饭也没吃。好担心啊！我应该怎么办？是让它自己慢慢适应，还是应该想办法把它抱出来？有经验的铲屎官们求支招！',
    category: 'question',
    tags: ['猫咪', '领养', '求助', '新猫到家'],
    likes: 45,
    comments: 78,
    createdAt: '2026-06-14T15:20:00Z',
  },
  {
    id: 'post4',
    authorId: 'user4',
    authorName: '宠物营养师王老师',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    isVetCertified: false,
    title: '宠物主食罐怎么选？看这一篇就够了！',
    content: '市面上宠物主食罐种类繁多，价格差异大，主人们经常不知道怎么选。今天教大家几个选购要点：1. 看原料表，前三位应该是肉类；2. 注意蛋白质含量，猫咪不低于10%，狗狗不低于8%；3. 避免过多添加剂和谷物填充；4. 根据宠物体重和年龄选择合适规格；5. 观察便便情况判断是否适合...',
    category: 'knowledge',
    tags: ['狗粮', '猫粮', '主食罐', '喂养', '知识'],
    likes: 412,
    comments: 89,
    createdAt: '2026-06-13T11:00:00Z',
  },
  {
    id: 'post5',
    authorId: 'vet2',
    authorName: '王医生',
    authorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop',
    isVetCertified: true,
    title: '狗狗拉肚子什么时候需要立即就医？',
    content: '很多主人遇到狗狗拉肚子就慌了神，其实大部分情况可以在家观察。但出现以下情况必须立即就医：1. 腹泻超过24小时；2. 伴有呕吐；3. 便血；4. 精神萎靡不振；5. 拒绝饮水；6. 腹部疼痛明显；7. 幼犬、老年犬或有基础病的狗狗。出现以上任何一种情况，请立刻带狗狗去正规宠物医院！',
    category: 'vet-article',
    tags: ['狗狗', '健康', '腹泻', '紧急情况', '兽医'],
    likes: 567,
    comments: 123,
    createdAt: '2026-06-12T14:30:00Z',
  },
  {
    id: 'post6',
    authorId: 'user5',
    authorName: '橘座铲屎官',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    isVetCertified: false,
    title: '我家橘子减肥记——从12斤到9.5斤的血泪史',
    content: '没错，就是那只传说中"十橘九胖"的橘子！去年体检的时候体重超标，医生说再不减肥就要得糖尿病了。于是开始了漫漫减肥路：控制饮食+增加运动+定期称重。中间经历了绝食抗议、偷吃被抓、运动偷懒...终于半年后成功减到9.5斤！想知道具体方法的评论区见~',
    category: 'story',
    tags: ['橘猫', '减肥', '猫咪', '搞笑', '经验'],
    likes: 823,
    comments: 210,
    createdAt: '2026-06-11T19:45:00Z',
  },
]

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { category, tag, sort = 'latest', limit = 20 } = req.query
  let posts = [...mockPosts]

  if (category) {
    posts = posts.filter(p => p.category === category)
  }
  if (tag) {
    const tagStr = tag as string
    posts = posts.filter(p => p.tags.includes(tagStr))
  }

  if (sort === 'latest') {
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (sort === 'popular') {
    posts.sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
  }

  posts = posts.slice(0, Number(limit))

  res.status(200).json({
    success: true,
    data: posts,
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const post = mockPosts.find(p => p.id === id)
  if (!post) {
    res.status(404).json({
      success: false,
      error: 'Post not found',
    })
    return
  }
  res.status(200).json({
    success: true,
    data: post,
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const newPost: CommunityPost = {
    id: `post${Date.now()}`,
    ...req.body,
    tags: req.body.tags || [],
    likes: 0,
    comments: 0,
    createdAt: new Date().toISOString(),
  }
  mockPosts.unshift(newPost)
  res.status(201).json({
    success: true,
    data: newPost,
  })
})

router.post('/:id/like', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const post = mockPosts.find(p => p.id === id)
  if (!post) {
    res.status(404).json({
      success: false,
      error: 'Post not found',
    })
    return
  }
  post.likes += 1
  res.status(200).json({
    success: true,
    data: { likes: post.likes },
  })
})

router.get('/categories/all', async (req: Request, res: Response): Promise<void> => {
  const categories: PostCategory[] = ['knowledge', 'story', 'question', 'vet-article']
  res.status(200).json({
    success: true,
    data: categories.map(cat => ({ key: cat, label: categoryLabels[cat] })),
  })
})

export default router
