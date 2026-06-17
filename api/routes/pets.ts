import { Router, type Request, type Response } from 'express'
import type { Pet, HealthRecord } from '../../shared/types.js'

const router = Router()

const mockHealthRecords: HealthRecord[] = [
  {
    id: 'hr1',
    type: 'vaccination',
    date: '2026-05-15',
    description: '狂犬疫苗接种',
  },
  {
    id: 'hr2',
    type: 'checkup',
    date: '2026-04-20',
    description: '年度体检，各项指标正常',
  },
  {
    id: 'hr3',
    type: 'illness',
    date: '2026-03-10',
    description: '轻微肠胃炎，已康复',
  },
]

const mockPets: Pet[] = [
  {
    id: 'pet1',
    userId: 'user1',
    name: '小白',
    species: 'dog',
    breed: '萨摩耶',
    age: 3,
    gender: 'male',
    personalityTags: ['活泼', '亲人', '贪吃'],
    avatar: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop',
    healthRecords: mockHealthRecords,
    createdAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'pet2',
    userId: 'user1',
    name: '咪咪',
    species: 'cat',
    breed: '英短银渐层',
    age: 2,
    gender: 'female',
    personalityTags: ['高冷', '独立', '爱干净'],
    avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop',
    healthRecords: [mockHealthRecords[0]],
    createdAt: '2024-08-15T14:30:00Z',
  },
  {
    id: 'pet3',
    userId: 'user2',
    name: '豆豆',
    species: 'dog',
    breed: '柴犬',
    age: 4,
    gender: 'male',
    personalityTags: ['忠诚', '勇敢', '倔强'],
    avatar: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=200&h=200&fit=crop',
    healthRecords: [mockHealthRecords[0], mockHealthRecords[1]],
    createdAt: '2024-03-20T09:15:00Z',
  },
  {
    id: 'pet4',
    userId: 'user2',
    name: '橘子',
    species: 'cat',
    breed: '中华田园猫',
    age: 5,
    gender: 'male',
    personalityTags: ['慵懒', '粘人', '调皮'],
    avatar: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&h=200&fit=crop',
    healthRecords: mockHealthRecords,
    createdAt: '2024-01-10T16:45:00Z',
  },
]

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.query
  let pets = mockPets
  if (userId) {
    pets = mockPets.filter(p => p.userId === userId)
  }
  res.status(200).json({
    success: true,
    data: pets,
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const pet = mockPets.find(p => p.id === id)
  if (!pet) {
    res.status(404).json({
      success: false,
      error: 'Pet not found',
    })
    return
  }
  res.status(200).json({
    success: true,
    data: pet,
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const newPet: Pet = {
    id: `pet${Date.now()}`,
    ...req.body,
    healthRecords: [],
    createdAt: new Date().toISOString(),
  }
  mockPets.push(newPet)
  res.status(201).json({
    success: true,
    data: newPet,
  })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const index = mockPets.findIndex(p => p.id === id)
  if (index === -1) {
    res.status(404).json({
      success: false,
      error: 'Pet not found',
    })
    return
  }
  mockPets[index] = { ...mockPets[index], ...req.body }
  res.status(200).json({
    success: true,
    data: mockPets[index],
  })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const index = mockPets.findIndex(p => p.id === id)
  if (index === -1) {
    res.status(404).json({
      success: false,
      error: 'Pet not found',
    })
    return
  }
  mockPets.splice(index, 1)
  res.status(200).json({
    success: true,
  })
})

router.post('/:id/health-records', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const pet = mockPets.find(p => p.id === id)
  if (!pet) {
    res.status(404).json({
      success: false,
      error: 'Pet not found',
    })
    return
  }
  const newRecord: HealthRecord = {
    id: `hr${Date.now()}`,
    ...req.body,
  }
  pet.healthRecords.push(newRecord)
  res.status(201).json({
    success: true,
    data: newRecord,
  })
})

export default router
