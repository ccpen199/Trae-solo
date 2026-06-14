import { v4 as uuidv4 } from 'uuid'
import type { AntiFraudRecord, ApiResponse } from '../../shared/types.js'

export class AntiFraudService {
  private records: AntiFraudRecord[] = []
  private imageHashStore: Map<string, string[]> = new Map()
  private listingFrequencyStore: Map<string, { count: number; lastPublishTime: string }> = new Map()

  async checkImageSimilarity(
    propertyId: string,
    imageUrls: string[]
  ): Promise<ApiResponse<AntiFraudRecord>> {
    try {
      const imageHashes = imageUrls.map(url => this.generatePixelHash(url))
      const existingHashes = this.imageHashStore.get(propertyId) || []

      let maxSimilarity = 0

      for (const newHash of imageHashes) {
        for (const existing of existingHashes) {
          const similarity = this.calculateHashSimilarity(newHash, existing)
          if (similarity > maxSimilarity) {
            maxSimilarity = similarity
          }
        }
      }

      const allPropertiesHashes = Array.from(this.imageHashStore.entries())
      for (const [pid, hashes] of allPropertiesHashes) {
        if (pid === propertyId) continue

        for (const newHash of imageHashes) {
          for (const existing of hashes) {
            const similarity = this.calculateHashSimilarity(newHash, existing)
            if (similarity > maxSimilarity) {
              maxSimilarity = similarity
            }
          }
        }
      }

      this.imageHashStore.set(propertyId, [...existingHashes, ...imageHashes])

      let result: 'pass' | 'fail' | 'warning' = 'pass'
      let details = `图片相似度检测通过，最高相似度: ${(maxSimilarity * 100).toFixed(1)}%`

      if (maxSimilarity >= 0.9) {
        result = 'fail'
        details = `图片相似度检测未通过，检测到高度相似图片，相似度: ${(maxSimilarity * 100).toFixed(1)}%，可能存在盗图行为`
      } else if (maxSimilarity >= 0.7) {
        result = 'warning'
        details = `图片相似度检测告警，检测到相似图片，相似度: ${(maxSimilarity * 100).toFixed(1)}%，建议人工复核`
      }

      const record: AntiFraudRecord = {
        id: uuidv4(),
        propertyId,
        checkType: 'image-similarity',
        result,
        score: Math.round((1 - maxSimilarity) * 100),
        details,
        createdAt: new Date().toISOString()
      }

      this.records.push(record)

      return {
        success: true,
        data: record
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '图片相似度检测失败'
      }
    }
  }

  async checkListingFrequency(
    propertyId: string,
    ownerId: string,
    publishTime: string
  ): Promise<ApiResponse<AntiFraudRecord>> {
    try {
      const key = `${propertyId}-${ownerId}`
      const existing = this.listingFrequencyStore.get(key)

      const currentTime = new Date(publishTime)
      let frequencyScore = 0
      let isAbnormal = false

      if (existing) {
        const lastTime = new Date(existing.lastPublishTime)
        const daysDiff = (currentTime.getTime() - lastTime.getTime()) / (1000 * 60 * 60 * 24)

        const newCount = existing.count + 1

        if (daysDiff < 7 && newCount >= 3) {
          isAbnormal = true
          frequencyScore = 0.9
        } else if (daysDiff < 30 && newCount >= 5) {
          isAbnormal = true
          frequencyScore = 0.75
        } else if (daysDiff < 90 && newCount >= 10) {
          isAbnormal = true
          frequencyScore = 0.6
        }

        this.listingFrequencyStore.set(key, {
          count: newCount,
          lastPublishTime: publishTime
        })
      } else {
        this.listingFrequencyStore.set(key, {
          count: 1,
          lastPublishTime: publishTime
        })
      }

      let result: 'pass' | 'fail' | 'warning' = 'pass'
      let details = `挂牌频次检测通过，历史挂牌次数: ${existing?.count || 1}`

      if (isAbnormal) {
        result = 'fail'
        details = `挂牌频次异常，${existing?.count || 1}天内挂牌${existing?.count || 1}次，可能存在恶意刷屏行为`
      } else if (frequencyScore >= 0.5) {
        result = 'warning'
        details = `挂牌频次告警，近期挂牌较为频繁，建议关注`
      }

      const record: AntiFraudRecord = {
        id: uuidv4(),
        propertyId,
        checkType: 'list-frequency',
        result,
        score: Math.round((1 - frequencyScore) * 100),
        details,
        createdAt: new Date().toISOString()
      }

      this.records.push(record)

      return {
        success: true,
        data: record
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '挂牌频次检测失败'
      }
    }
  }

  async getPropertyAntiFraudRecords(
    propertyId: string
  ): Promise<ApiResponse<AntiFraudRecord[]>> {
    try {
      const records = this.records.filter(r => r.propertyId === propertyId)

      return {
        success: true,
        data: records
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取防欺诈记录失败'
      }
    }
  }

  private generatePixelHash(imageUrl: string): string {
    let hash = 0
    for (let i = 0; i < imageUrl.length; i++) {
      const char = imageUrl.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }

    let binaryHash = Math.abs(hash).toString(2)
    while (binaryHash.length < 64) {
      binaryHash = '0' + binaryHash
    }
    return binaryHash.slice(0, 64)
  }

  private calculateHashSimilarity(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) {
      return 0
    }

    let matches = 0
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] === hash2[i]) {
        matches++
      }
    }

    return matches / hash1.length
  }

  getRecords(): AntiFraudRecord[] {
    return [...this.records]
  }
}

export const antiFraudService = new AntiFraudService()
