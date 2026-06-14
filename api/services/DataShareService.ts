import { query } from '../db.js'

interface CompareResult {
  source: string
  target: string
  matchCount: number
  mismatchCount: number
  totalCount: number
  matchRate: number
  mismatches: Array<{
    idCard: string
    name: string
    sourceValue: unknown
    targetValue: unknown
    field: string
  }>
}

interface DatashareCompareResponse {
  success: boolean
  overall: {
    totalRecords: number
    matchedRecords: number
    mismatchRecords: number
    overallMatchRate: number
  }
  comparisons: CompareResult[]
  lastUpdated: string
  error?: string
}

class DataShareService {
  async compareWithExternalData(): Promise<DatashareCompareResponse> {
    await this.simulateExternalApiCall()

    const localUsers = this.getLocalUsers()
    const externalData = this.getExternalMockData()

    const idCardComparison = this.compareByIdCard(localUsers, externalData)
    const nameComparison = this.compareByName(localUsers, externalData)
    const statusComparison = this.compareByStatus(localUsers, externalData)

    const totalRecords = localUsers.length
    const matchedRecords = idCardComparison.matchCount
    const mismatchRecords = totalRecords - matchedRecords
    const overallMatchRate = totalRecords > 0 ? (matchedRecords / totalRecords) * 100 : 0

    return {
      success: true,
      overall: {
        totalRecords,
        matchedRecords,
        mismatchRecords,
        overallMatchRate: Math.round(overallMatchRate * 100) / 100,
      },
      comparisons: [idCardComparison, nameComparison, statusComparison],
      lastUpdated: new Date().toISOString(),
    }
  }

  private async simulateExternalApiCall(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 800))
  }

  private getLocalUsers(): Array<{ idCard: string; name: string; status: string }> {
    const sql = `
      SELECT id_card as idCard, name, status
      FROM users
      WHERE user_type IN ('resident', 'flexible')
      LIMIT 100
    `
    return query<{ idCard: string; name: string; status: string }>(sql)
  }

  private getExternalMockData(): Array<{ idCard: string; name: string; status: string }> {
    const localUsers = this.getLocalUsers()
    return localUsers.map((user, index) => {
      const shouldMismatch = index % 10 === 0
      return {
        idCard: user.idCard,
        name: shouldMismatch ? user.name + '（外部）' : user.name,
        status: shouldMismatch ? 'suspended' : user.status,
      }
    })
  }

  private compareByIdCard(
    local: Array<{ idCard: string; name: string; status: string }>,
    external: Array<{ idCard: string; name: string; status: string }>,
  ): CompareResult {
    const mismatches: CompareResult['mismatches'] = []
    let matchCount = 0

    local.forEach(localUser => {
      const externalUser = external.find(e => e.idCard === localUser.idCard)
      if (externalUser) {
        matchCount++
      } else {
        mismatches.push({
          idCard: localUser.idCard,
          name: localUser.name,
          sourceValue: localUser.idCard,
          targetValue: null,
          field: 'idCard',
        })
      }
    })

    return {
      source: '本地数据库',
      target: '公安部门',
      matchCount,
      mismatchCount: mismatches.length,
      totalCount: local.length,
      matchRate: local.length > 0 ? Math.round((matchCount / local.length) * 10000) / 100 : 0,
      mismatches,
    }
  }

  private compareByName(
    local: Array<{ idCard: string; name: string; status: string }>,
    external: Array<{ idCard: string; name: string; status: string }>,
  ): CompareResult {
    const mismatches: CompareResult['mismatches'] = []
    let matchCount = 0

    local.forEach(localUser => {
      const externalUser = external.find(e => e.idCard === localUser.idCard)
      if (externalUser) {
        if (externalUser.name === localUser.name) {
          matchCount++
        } else {
          mismatches.push({
            idCard: localUser.idCard,
            name: localUser.name,
            sourceValue: localUser.name,
            targetValue: externalUser.name,
            field: 'name',
          })
        }
      }
    })

    return {
      source: '本地数据库',
      target: '民政部门',
      matchCount,
      mismatchCount: mismatches.length,
      totalCount: local.length,
      matchRate: local.length > 0 ? Math.round((matchCount / local.length) * 10000) / 100 : 0,
      mismatches,
    }
  }

  private compareByStatus(
    local: Array<{ idCard: string; name: string; status: string }>,
    external: Array<{ idCard: string; name: string; status: string }>,
  ): CompareResult {
    const mismatches: CompareResult['mismatches'] = []
    let matchCount = 0

    local.forEach(localUser => {
      const externalUser = external.find(e => e.idCard === localUser.idCard)
      if (externalUser) {
        if (externalUser.status === localUser.status) {
          matchCount++
        } else {
          mismatches.push({
            idCard: localUser.idCard,
            name: localUser.name,
            sourceValue: localUser.status,
            targetValue: externalUser.status,
            field: 'status',
          })
        }
      }
    })

    return {
      source: '本地数据库',
      target: '医保部门',
      matchCount,
      mismatchCount: mismatches.length,
      totalCount: local.length,
      matchRate: local.length > 0 ? Math.round((matchCount / local.length) * 10000) / 100 : 0,
      mismatches,
    }
  }
}

const dataShareService = new DataShareService()

export default dataShareService
export { DataShareService, type DatashareCompareResponse, type CompareResult }
