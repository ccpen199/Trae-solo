export interface User {
  id: number
  username: string
  nickname?: string
  avatar?: string
  bio?: string
  email?: string
  phone?: string
}

export interface Post {
  id: number
  userId: number
  content: string
  images: string[]
  video?: string
  location?: string
  topics?: string[]
  createdAt: string
  user: User
  likeCount: number
  commentCount: number
  isLiked: boolean
  isFavorited: boolean
}

export interface Question {
  id: number
  userId: number
  title: string
  content: string
  images: string[]
  topics?: string[]
  createdAt: string
  user: User
  likeCount: number
  answerCount: number
  isLiked: boolean
  isFavorited: boolean
  answers?: Answer[]
}

export interface Answer {
  id: number
  questionId: number
  userId: number
  content: string
  images: string[]
  createdAt: string
  user: User
  likeCount: number
  commentCount: number
  isLiked: boolean
  comments?: Comment[]
}

export interface Comment {
  id: number
  postId?: number
  answerId?: number
  userId: number
  content: string
  createdAt: string
  user: User
}

export interface Activity {
  id: number
  title: string
  description: string
  coverImage: string
  location?: string
  startTime: string
  endTime: string
  status: string
  maxParticipants?: number
  registrationCount?: number
  isRegistered?: boolean
  createdAt: string
}

export interface Pet {
  id: number
  userId: number
  name: string
  avatar: string
  gender?: string
  age?: number
  birthday?: string
  breed?: string
  healthStatus?: string
  licenseNumber?: string
  createdAt: string
}

export interface HealthRecord {
  id: number
  petId: number
  type: string
  date: string
  notes?: string
  createdAt: string
}

export interface DailyTask {
  id: number
  petId: number
  type: string
  time?: string
  completed: boolean
  date: string
  createdAt: string
}

export interface GrowthDiary {
  id: number
  petId: number
  title: string
  content: string
  images: string[]
  date: string
  createdAt: string
}

export interface Message {
  id: number
  senderId: number
  receiverId: number
  content: string
  isRead: boolean
  createdAt: string
  sender: User
}

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
}

export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
