import type { RepairTask, Technician, Coordinates, TaskBid } from '../types'
import { calculateDistance } from './geo'
import { mockSkillTags, getCategoryById } from '../data/mockData'

export interface MatchedTechnician {
  technician: Technician
  distanceKm: number
  skillMatchScore: number
  totalScore: number
}

const getCategorySkillIds = (categoryId: string): string[] => {
  const categoryIds: string[] = [categoryId]
  let cat = getCategoryById(categoryId)
  while (cat?.parentId) {
    categoryIds.push(cat.parentId)
    cat = getCategoryById(cat.parentId)
  }
  return mockSkillTags
    .filter(s => categoryIds.includes(s.categoryId))
    .map(s => s.id)
}

export const matchTechnicians = (
  task: RepairTask,
  technicians: Technician[],
  taskLocation: Coordinates
): MatchedTechnician[] => {
  const taskSkillIds = getCategorySkillIds(task.categoryId)

  const matched = technicians
    .filter(t => !t.frozen)
    .map(tech => {
      const distanceKm = calculateDistance(taskLocation, tech.location)
      const withinRadius = distanceKm <= tech.serviceRadius

      const matchedSkills = tech.skillTags.filter(s => taskSkillIds.includes(s)).length
      const totalRelevantSkills = Math.max(taskSkillIds.length, 1)
      const skillMatchScore = matchedSkills / totalRelevantSkills

      const distanceScore = withinRadius ? Math.max(0, 1 - distanceKm / tech.serviceRadius) : 0
      const ratingScore = tech.rating / 5
      const reviewCountScore = Math.min(1, tech.reviewCount / 100)

      const totalScore = withinRadius && skillMatchScore > 0
        ? skillMatchScore * 0.4 + distanceScore * 0.3 + ratingScore * 0.2 + reviewCountScore * 0.1
        : 0

      return {
        technician: tech,
        distanceKm,
        skillMatchScore,
        totalScore,
      }
    })
    .filter(m => m.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore)

  return matched
}

export const broadcastTaskToTechnicians = (
  task: RepairTask,
  technicians: Technician[]
): string[] => {
  const matched = matchTechnicians(task, technicians, task.location)
  return matched
    .slice(0, 10)
    .map(m => m.technician.id)
}

export const createBid = (
  technicianId: string,
  estimatedPrice: number,
  estimatedTime: string,
  note?: string
): TaskBid => {
  return {
    technicianId,
    estimatedPrice,
    estimatedTime,
    note,
    submittedAt: new Date().toISOString(),
  }
}

export const formatMoney = (amount: number): string => {
  return `¥${amount.toFixed(2)}`
}
