interface MarriageRecord {
  id: string
  idCard: string
  name: string
  spouseName: string
  spouseIdCard: string
  marriageDate: string
  marriageStatus: 'married' | 'divorced' | 'widowed'
  registrationAuthority: string
}

interface DeathRecord {
  id: string
  idCard: string
  name: string
  gender: 'male' | 'female'
  deathDate: string
  deathCause: string
  registrationDate: string
  registrationAuthority: string
}

interface MarriageRecordResult {
  success: boolean
  record?: MarriageRecord
  errorMessage?: string
}

interface DeathRecordResult {
  success: boolean
  record?: DeathRecord
  errorMessage?: string
}

class CivilAffairsService {
  private static instance: CivilAffairsService

  private constructor() {}

  static getInstance(): CivilAffairsService {
    if (!CivilAffairsService.instance) {
      CivilAffairsService.instance = new CivilAffairsService()
    }
    return CivilAffairsService.instance
  }

  getMarriageRecord(idCard: string): Promise<MarriageRecordResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.05

        if (!success) {
          resolve({
            success: false,
            errorMessage: '民政数据系统繁忙，请稍后重试',
          })
          return
        }

        const hasRecord = Math.random() > 0.25

        if (hasRecord) {
          const record: MarriageRecord = {
            id: 'MAR' + Date.now().toString(),
            idCard,
            name: '张三',
            spouseName: '李四',
            spouseIdCard: '430102198501011234',
            marriageDate: '2010-05-20',
            marriageStatus: 'married',
            registrationAuthority: '长沙市岳麓区民政局',
          }

          resolve({
            success: true,
            record,
          })
        } else {
          resolve({
            success: true,
          })
        }
      }, 600 + Math.random() * 1000)
    })
  }

  getDeathRecord(idCard: string): Promise<DeathRecordResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.05

        if (!success) {
          resolve({
            success: false,
            errorMessage: '民政数据系统繁忙，请稍后重试',
          })
          return
        }

        const isDeceased = Math.random() > 0.95

        if (isDeceased) {
          const record: DeathRecord = {
            id: 'DEA' + Date.now().toString(),
            idCard,
            name: '张三',
            gender: 'male',
            deathDate: '2024-01-15',
            deathCause: '因病逝世',
            registrationDate: '2024-01-20',
            registrationAuthority: '长沙市岳麓区民政局',
          }

          resolve({
            success: true,
            record,
          })
        } else {
          resolve({
            success: true,
          })
        }
      }, 500 + Math.random() * 800)
    })
  }
}

const civilAffairsService = CivilAffairsService.getInstance()

export default civilAffairsService
export { CivilAffairsService, type MarriageRecord, type DeathRecord, type MarriageRecordResult, type DeathRecordResult }
