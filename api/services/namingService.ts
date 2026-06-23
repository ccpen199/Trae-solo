import type { NamingInput, BaZiResult, NameProposal, PaginatedResponse } from '../../shared/types'
import { analyzeBaZi as analyzeBaZiEngine } from '../engine/baziEngine.js'
import { generateNameProposals } from '../engine/optimizerEngine.js'
import { characters } from '../data/characters.js'
import { namingHistories, nameProposals, generateId, paginate } from '../db/index.js'

export interface NamingHistoryRecord {
  id: string
  userId: string | null
  input: NamingInput
  bazi: BaZiResult | null
  proposals: NameProposal[]
  createdAt: string
}

export function analyzeBaZi(input: NamingInput, userId?: string): { bazi: BaZiResult; historyId: string } {
  const bazi = analyzeBaZiEngine(input)
  const historyId = generateId('nh')

  namingHistories.push({
    id: historyId,
    userId: userId || null,
    inputJson: JSON.stringify(input),
    baziResultJson: JSON.stringify(bazi),
    createdAt: new Date().toISOString()
  })

  return { bazi, historyId }
}

export function generateNames(input: NamingInput, userId?: string): {
  proposals: NameProposal[]
  bazi: BaZiResult
  historyId: string
} {
  const bazi = analyzeBaZiEngine(input)
  const proposals = generateNameProposals(input, bazi, characters)
  const historyId = generateId('nh')

  namingHistories.push({
    id: historyId,
    userId: userId || null,
    inputJson: JSON.stringify(input),
    baziResultJson: JSON.stringify(bazi),
    createdAt: new Date().toISOString()
  })

  for (const proposal of proposals) {
    nameProposals.push({
      id: proposal.id,
      namingHistoryId: historyId,
      fullName: proposal.fullName,
      pinyin: proposal.pinyin,
      overallScore: proposal.score.overall,
      auspiciousnessScore: proposal.score.auspiciousness,
      uniquenessScore: proposal.score.uniqueness,
      writingScore: proposal.score.writingEase,
      phoneticScore: proposal.score.phoneticHarmony,
      charactersJson: JSON.stringify(proposal.characters),
      phoneticAnalysisJson: JSON.stringify(proposal.phoneticAnalysis),
      duplicateTotal: proposal.duplicateRate.total,
      explanation: proposal.meaning
    })
  }

  return { proposals, bazi, historyId }
}

export function getNamingHistory(id: string): NamingHistoryRecord | null {
  const history = namingHistories.find(h => h.id === id)

  if (!history) return null

  const proposals = nameProposals
    .filter(p => p.namingHistoryId === id)
    .sort((a, b) => b.overallScore - a.overallScore)

  return {
    id: history.id,
    userId: history.userId,
    input: JSON.parse(history.inputJson),
    bazi: history.baziResultJson ? JSON.parse(history.baziResultJson) : null,
    proposals: proposals.map(p => ({
      id: p.id,
      fullName: p.fullName,
      pinyin: p.pinyin,
      characters: JSON.parse(p.charactersJson),
      meaning: p.explanation,
      score: {
        overall: p.overallScore,
        auspiciousness: p.auspiciousnessScore,
        uniqueness: p.uniquenessScore,
        writingEase: p.writingScore,
        phoneticHarmony: p.phoneticScore
      },
      fiveElementsMatch: 80,
      fiveElementsNote: '',
      phoneticAnalysis: JSON.parse(p.phoneticAnalysisJson),
      duplicateRate: {
        total: p.duplicateTotal,
        province: Math.floor(p.duplicateTotal * 0.15),
        ageDistribution: {
          '0-10': Math.floor(p.duplicateTotal * 0.35),
          '11-20': Math.floor(p.duplicateTotal * 0.25),
          '21-30': Math.floor(p.duplicateTotal * 0.2),
          '31-40': Math.floor(p.duplicateTotal * 0.12),
          '41+': Math.floor(p.duplicateTotal * 0.08)
        }
      },
      poetryReferences: [],
      tags: []
    })),
    createdAt: history.createdAt
  }
}

export function getUserHistory(
  userId: string,
  page: number = 1,
  pageSize: number = 10
): PaginatedResponse<NamingHistoryRecord> {
  const filtered = namingHistories
    .filter(h => h.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const result = paginate(filtered, page, pageSize)

  return {
    items: result.items.map(h => ({
      id: h.id,
      userId: h.userId,
      input: JSON.parse(h.inputJson),
      bazi: h.baziResultJson ? JSON.parse(h.baziResultJson) : null,
      proposals: [],
      createdAt: h.createdAt
    })),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize
  }
}

export function queryDuplicateRate(name: string): {
  total: number
  province: number
  ageDistribution: Record<string, number>
} {
  const base = name.charCodeAt(0) * 17 + name.length * 31
  const total = Math.floor((base % 5000) + 500)
  const province = Math.floor(total * (0.1 + (base % 15) / 100))

  return {
    total,
    province,
    ageDistribution: {
      '0-10': Math.floor(total * 0.35),
      '11-20': Math.floor(total * 0.25),
      '21-30': Math.floor(total * 0.2),
      '31-40': Math.floor(total * 0.12),
      '41+': Math.floor(total * 0.08)
    }
  }
}
