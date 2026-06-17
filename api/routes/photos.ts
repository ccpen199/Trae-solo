import { Router, type Request, type Response } from 'express'
import type { Photo, PhotoTag } from '../../shared/types.js'

const router = Router()

const allPhotoTags: PhotoTag[] = ['playing', 'eating', 'sleeping', 'walking', 'bathing']

const photoTagLabels: Record<PhotoTag, string> = {
  playing: '玩耍',
  eating: '吃饭',
  sleeping: '睡觉',
  walking: '散步',
  bathing: '洗澡',
}

const mockPhotos: Photo[] = [
  {
    id: 'photo1',
    petId: 'pet1',
    imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=150&fit=crop',
    autoTags: ['playing', 'walking'],
    userTags: ['户外', '草地'],
    filterApplied: 'warm',
    bubbleTemplate: 'cloud',
    bubbleText: '今天玩得超开心！',
    createdAt: '2026-06-15T15:00:00Z',
  },
  {
    id: 'photo2',
    petId: 'pet1',
    imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=600&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=150&fit=crop',
    autoTags: ['eating'],
    userTags: ['美食时间'],
    filterApplied: null,
    bubbleTemplate: null,
    bubbleText: null,
    createdAt: '2026-06-14T12:30:00Z',
  },
  {
    id: 'photo3',
    petId: 'pet2',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=600&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=150&fit=crop',
    autoTags: ['sleeping'],
    userTags: ['小可爱'],
    filterApplied: 'soft',
    bubbleTemplate: 'thought',
    bubbleText: 'zzZ...梦见小鱼干了...',
    createdAt: '2026-06-14T21:00:00Z',
  },
  {
    id: 'photo4',
    petId: 'pet3',
    imageUrl: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800&h=600&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=200&h=150&fit=crop',
    autoTags: ['bathing'],
    userTags: ['不爱洗澡'],
    filterApplied: null,
    bubbleTemplate: 'shout',
    bubbleText: '救命啊！不要洗澡！',
    createdAt: '2026-06-13T18:45:00Z',
  },
  {
    id: 'photo5',
    petId: 'pet4',
    imageUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&h=600&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&h=150&fit=crop',
    autoTags: ['sleeping', 'playing'],
    userTags: ['慵懒日常'],
    filterApplied: 'vintage',
    bubbleTemplate: null,
    bubbleText: null,
    createdAt: '2026-06-13T10:20:00Z',
  },
  {
    id: 'photo6',
    petId: 'pet2',
    imageUrl: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800&h=600&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=200&h=150&fit=crop',
    autoTags: ['playing'],
    userTags: ['毛线球'],
    filterApplied: null,
    bubbleTemplate: 'cloud',
    bubbleText: '这个球是我的！谁也别抢！',
    createdAt: '2026-06-12T14:10:00Z',
  },
]

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { petId, tag, limit = 50 } = req.query
  let photos = [...mockPhotos]
  if (petId) {
    photos = photos.filter(p => p.petId === petId)
  }
  if (tag) {
    const tagStr = tag as string
    photos = photos.filter(p =>
      p.autoTags.includes(tagStr as PhotoTag) || p.userTags.includes(tagStr),
    )
  }
  photos = photos.slice(0, Number(limit))
  res.status(200).json({
    success: true,
    data: photos,
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const photo = mockPhotos.find(p => p.id === id)
  if (!photo) {
    res.status(404).json({
      success: false,
      error: 'Photo not found',
    })
    return
  }
  res.status(200).json({
    success: true,
    data: photo,
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const newPhoto: Photo = {
    id: `photo${Date.now()}`,
    ...req.body,
    autoTags: req.body.autoTags || allPhotoTags.slice(0, Math.floor(Math.random() * 2) + 1),
    userTags: req.body.userTags || [],
    filterApplied: req.body.filterApplied || null,
    bubbleTemplate: req.body.bubbleTemplate || null,
    bubbleText: req.body.bubbleText || null,
    createdAt: new Date().toISOString(),
  }
  mockPhotos.unshift(newPhoto)
  res.status(201).json({
    success: true,
    data: newPhoto,
  })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const index = mockPhotos.findIndex(p => p.id === id)
  if (index === -1) {
    res.status(404).json({
      success: false,
      error: 'Photo not found',
    })
    return
  }
  mockPhotos[index] = { ...mockPhotos[index], ...req.body }
  res.status(200).json({
    success: true,
    data: mockPhotos[index],
  })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const index = mockPhotos.findIndex(p => p.id === id)
  if (index === -1) {
    res.status(404).json({
      success: false,
      error: 'Photo not found',
    })
    return
  }
  mockPhotos.splice(index, 1)
  res.status(200).json({
    success: true,
  })
})

router.get('/tags/all', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: {
      autoTags: allPhotoTags.map(tag => ({ key: tag, label: photoTagLabels[tag] })),
    },
  })
})

export default router
