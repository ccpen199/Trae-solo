interface MedicalRecord {
  id: string
  idCard: string
  name: string
  hospitalName: string
  department: string
  diagnosis: string
  treatment: string
  visitDate: string
  dischargeDate?: string
  totalCost: number
  insurancePayment: number
  personalPayment: number
}

interface MedicalRecordResult {
  success: boolean
  records?: MedicalRecord[]
  errorMessage?: string
}

class HealthService {
  private static instance: HealthService

  private constructor() {}

  static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService()
    }
    return HealthService.instance
  }

  getMedicalRecord(idCard: string): Promise<MedicalRecordResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.05

        if (!success) {
          resolve({
            success: false,
            errorMessage: '卫健数据系统繁忙，请稍后重试',
          })
          return
        }

        const hasRecords = Math.random() > 0.3

        if (hasRecords) {
          const records: MedicalRecord[] = [
            {
              id: 'MR' + Date.now().toString() + '01',
              idCard,
              name: '张三',
              hospitalName: '湖南省人民医院',
              department: '内科',
              diagnosis: '上呼吸道感染',
              treatment: '药物治疗，休息一周',
              visitDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              totalCost: 580.50,
              insurancePayment: 406.35,
              personalPayment: 174.15,
            },
            {
              id: 'MR' + Date.now().toString() + '02',
              idCard,
              name: '张三',
              hospitalName: '湘雅二医院',
              department: '体检中心',
              diagnosis: '年度健康体检',
              treatment: '常规体检，建议定期复查',
              visitDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              dischargeDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              totalCost: 1200.00,
              insurancePayment: 0,
              personalPayment: 1200.00,
            },
          ]

          resolve({
            success: true,
            records,
          })
        } else {
          resolve({
            success: true,
            records: [],
          })
        }
      }, 800 + Math.random() * 1500)
    })
  }
}

const healthService = HealthService.getInstance()

export default healthService
export { HealthService, type MedicalRecord, type MedicalRecordResult }
