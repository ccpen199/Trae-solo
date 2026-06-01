const db = require('../db')
const { v4: uuidv4 } = require('uuid')

class DataAggregator {
  constructor() {
    this.timeout = 5000
  }

  async fetchWithTimeout(sourceCode, fetchFn) {
    const source = db.prepare('SELECT * FROM data_sources WHERE source_code = ?').get(sourceCode)
    const startTime = Date.now()
    
    try {
      const result = await Promise.race([
        fetchFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('数据源超时')), this.timeout)
        )
      ])
      
      db.prepare('UPDATE data_sources SET last_success_at = CURRENT_TIMESTAMP, failure_count = 0, status = ? WHERE source_code = ?')
        .run('active', sourceCode)
      
      return { success: true, data: result, source: source.source_name }
    } catch (error) {
      db.prepare('UPDATE data_sources SET last_failure_at = CURRENT_TIMESTAMP, failure_count = failure_count + 1, status = ? WHERE source_code = ?')
        .run(source.failure_count + 1 >= source.retry_count ? 'degraded' : 'active', sourceCode)
      
      return { 
        success: false, 
        error: error.message, 
        source: source.source_name,
        retryable: source.failure_count + 1 < source.retry_count,
        degraded: source.failure_count + 1 >= source.retry_count
      }
    }
  }

  async fetchBusinessData(creditCode) {
    return this.fetchWithTimeout('GS', async () => {
      const enterprise = db.prepare('SELECT * FROM enterprises WHERE credit_code = ?').get(creditCode)
      if (!enterprise) {
        return this.generateMockBusinessData(creditCode)
      }
      
      const changes = db.prepare('SELECT * FROM enterprise_changes WHERE enterprise_id = ?').all(enterprise.id)
      const shareholders = db.prepare('SELECT * FROM shareholders WHERE enterprise_id = ?').all(enterprise.id)
      
      return { enterprise, changes, shareholders }
    })
  }

  async fetchJudicialData(creditCode) {
    return this.fetchWithTimeout('SF', async () => {
      const enterprise = db.prepare('SELECT id FROM enterprises WHERE credit_code = ?').get(creditCode)
      if (!enterprise) {
        return this.generateMockJudicialData()
      }
      return db.prepare('SELECT * FROM judicial_records WHERE enterprise_id = ?').all(enterprise.id)
    })
  }

  async fetchTaxData(creditCode) {
    return this.fetchWithTimeout('SW', async () => {
      const enterprise = db.prepare('SELECT id FROM enterprises WHERE credit_code = ?').get(creditCode)
      if (!enterprise) {
        return this.generateMockTaxData()
      }
      return db.prepare('SELECT * FROM tax_records WHERE enterprise_id = ?').all(enterprise.id)
    })
  }

  async fetchBusinessIndicators(creditCode) {
    return this.fetchWithTimeout('JY', async () => {
      const enterprise = db.prepare('SELECT id FROM enterprises WHERE credit_code = ?').get(creditCode)
      if (!enterprise) {
        return this.generateMockBusinessIndicators()
      }
      return db.prepare('SELECT * FROM business_indicators WHERE enterprise_id = ?').all(enterprise.id)
    })
  }

  async fetchCreditHistory(creditCode) {
    return this.fetchWithTimeout('SX', async () => {
      const enterprise = db.prepare('SELECT id FROM enterprises WHERE credit_code = ?').get(creditCode)
      if (!enterprise) {
        return this.generateMockCreditHistory()
      }
      return db.prepare('SELECT * FROM credit_history WHERE enterprise_id = ?').all(enterprise.id)
    })
  }

  generateMockBusinessData(creditCode) {
    const name = creditCode.startsWith('9131') ? '上海XX科技有限公司' : '北京XX贸易有限公司'
    return {
      enterprise: {
        credit_code: creditCode,
        name: name,
        registered_capital: '1000万人民币',
        establishment_date: '2020-01-15',
        status: '存续',
        industry: '软件和信息技术服务业',
        address: '上海市浦东新区XX路XX号',
        legal_representative: '张三'
      },
      changes: [
        { change_type: '注册资本变更', before_value: '500万人民币', after_value: '1000万人民币', change_date: '2023-06-20' },
        { change_type: '经营范围变更', before_value: '软件开发', after_value: '软件开发、技术服务', change_date: '2023-01-10' }
      ],
      shareholders: [
        { name: '张三', share_ratio: '60%', contribution_amount: '600万' },
        { name: '上海YY投资合伙企业(有限合伙)', share_ratio: '40%', contribution_amount: '400万', is_related_enterprise: 1 }
      ]
    }
  }

  generateMockJudicialData() {
    return [
      {
        record_type: '被执行人',
        title: '被执行信息',
        court: '上海市浦东新区人民法院',
        case_number: '(2024)沪0115执XX号',
        amount: '50万元',
        verdict_date: '2024-03-15',
        status: '执行中',
        risk_level: 'medium'
      },
      {
        record_type: '失信被执行人',
        title: '失信被执行信息',
        court: '北京市朝阳区人民法院',
        case_number: '(2023)京0105执XX号',
        amount: '200万元',
        verdict_date: '2023-12-20',
        status: '已履行',
        risk_level: 'high'
      }
    ]
  }

  generateMockTaxData() {
    return [
      {
        record_type: '税务申报',
        description: '2023年度企业所得税申报正常',
        tax_authority: '上海市浦东新区税务局',
        is_abnormal: 0
      },
      {
        record_type: '税务异常',
        description: '2024年1月增值税未按期申报',
        tax_authority: '上海市浦东新区税务局',
        violation_date: '2024-02-15',
        amount: '5万元',
        is_abnormal: 1
      }
    ]
  }

  generateMockBusinessIndicators() {
    return [
      { year: 2023, quarter: 4, revenue: '5000万', profit: '500万', employee_count: 120, asset_total: '1亿', liability_total: '3000万' },
      { year: 2022, quarter: 4, revenue: '4000万', profit: '400万', employee_count: 100, asset_total: '8000万', liability_total: '2500万' }
    ]
  }

  generateMockCreditHistory() {
    return [
      { bank: '工商银行上海分行', credit_line: '1000万', used_amount: '800万', start_date: '2023-01-01', end_date: '2024-01-01', status: '已结清', overdue_days: 0 },
      { bank: '建设银行上海分行', credit_line: '500万', used_amount: '300万', start_date: '2023-06-01', end_date: '2024-06-01', status: '正常', overdue_days: 0 },
      { bank: '招商银行北京分行', credit_line: '300万', used_amount: '300万', start_date: '2022-01-01', end_date: '2023-01-01', status: '逾期', overdue_days: 15 }
    ]
  }

  async aggregateAllData(creditCode) {
    const [businessData, judicialData, taxData, indicators, creditHistory] = await Promise.all([
      this.fetchBusinessData(creditCode),
      this.fetchJudicialData(creditCode),
      this.fetchTaxData(creditCode),
      this.fetchBusinessIndicators(creditCode),
      this.fetchCreditHistory(creditCode)
    ])

    return {
      business: businessData,
      judicial: judicialData,
      tax: taxData,
      indicators: indicators,
      creditHistory: creditHistory
    }
  }
}

module.exports = new DataAggregator()
