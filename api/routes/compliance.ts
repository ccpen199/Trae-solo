import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

const leaseLawClauses = [
  {
    id: 'bond_maximum',
    title_en: 'Maximum Bond Amount',
    title_zh: '押金最高限额',
    description_en: 'In NSW, the maximum bond for unfurnished residential premises is 4 weeks rent if the rent is $700 or less per week.',
    description_zh: '在新南威尔士州，如果每周租金不超过700澳元，无装修住宅的最高押金为4周租金。',
    state: 'NSW',
    reference: 'Residential Tenancies Act 2010'
  },
  {
    id: 'notice_period',
    title_en: 'Termination Notice Period',
    title_zh: '终止通知期',
    description_en: 'A tenant must give at least 21 days written notice to terminate a periodic agreement.',
    description_zh: '租客终止周期性协议必须提前至少21天发出书面通知。',
    state: 'NSW',
    reference: 'Residential Tenancies Act 2010'
  },
  {
    id: 'rent_increase',
    title_en: 'Rent Increase Limitations',
    title_zh: '租金涨幅限制',
    description_en: 'Rent cannot be increased more than once every 12 months for existing tenants.',
    description_zh: '现有租客的租金涨幅不得超过每12个月一次。',
    state: 'NSW',
    reference: 'Residential Tenancies Act 2010'
  },
  {
    id: 'repairs_notice',
    title_en: 'Repairs Notice Period',
    title_zh: '维修通知期',
    description_en: 'Landlords must attend to urgent repairs within 24 hours of receiving notice.',
    description_zh: '房东必须在收到通知后24小时内处理紧急维修。',
    state: 'NSW',
    reference: 'Residential Tenancies Act 2010'
  },
  {
    id: 'entry_notice',
    title_en: 'Entry Notice Requirements',
    title_zh: '进入通知要求',
    description_en: 'A landlord or agent must give at least 24 hours written notice to enter the premises.',
    description_zh: '房东或中介必须提前至少24小时发出书面通知才能进入房产。',
    state: 'NSW',
    reference: 'Residential Tenancies Act 2010'
  },
  {
    id: 'cooling_off',
    title_en: 'Cooling Off Period',
    title_zh: '冷静期',
    description_en: 'There is a 5 business day cooling off period when buying residential property in NSW.',
    description_zh: '在新南威尔士州购买住宅房产有5个工作日的冷静期。',
    state: 'NSW',
    reference: 'Conveyancing Act 1919'
  },
  {
    id: 'fire_safety',
    title_en: 'Fire Safety Requirements',
    title_zh: '消防安全要求',
    description_en: 'All rental properties must have working smoke alarms installed on every level.',
    description_zh: '所有租赁房产必须在每层安装正常工作的烟雾报警器。',
    state: 'All',
    reference: 'Building Code of Australia'
  }
]

router.get('/lease-clauses', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { state, agreement_type } = req.query
    
    let clauses = leaseLawClauses
    if (state && state !== 'All') {
      clauses = clauses.filter(c => c.state === state || c.state === 'All')
    }
    
    res.json({
      success: true,
      data: clauses
    })
  } catch (e) {
    next(e)
  }
})

router.post('/verify-arbn', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { arbn } = req.body
    
    if (!arbn || arbn.length !== 9) {
      return res.json({
        success: true,
        data: {
          valid: false,
          arbn,
          reason: 'ARBN must be 9 digits',
          format_check: false,
          checksum_valid: false,
          registered: false
        }
      })
    }
    
    if (!/^\d+$/.test(arbn)) {
      return res.json({
        success: true,
        data: {
          valid: false,
          arbn,
          reason: 'ARBN must contain only digits',
          format_check: false,
          checksum_valid: false,
          registered: false
        }
      })
    }
    
    let sum = 0
    for (let i = 0; i < 8; i++) {
      const digit = parseInt(arbn[i])
      const weight = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19][i]
      sum += digit * weight
    }
    
    const remainder = sum % 89
    const expectedCheckDigit = (89 - remainder) % 10
    const actualCheckDigit = parseInt(arbn[8])
    const checksumValid = expectedCheckDigit === actualCheckDigit
    
    const existingOwner = db.prepare('SELECT * FROM owners WHERE arbn = ?').get(arbn)
    
    res.json({
      success: true,
      data: {
        valid: checksumValid,
        arbn,
        format_check: true,
        checksum_valid: checksumValid,
        registered: !!existingOwner,
        owner: existingOwner || null,
        verification_date: new Date().toISOString()
      }
    })
  } catch (e) {
    next(e)
  }
})

router.post('/verify-tfn', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tfn } = req.body
    
    const cleanedTfn = tfn.replace(/\s/g, '')
    
    if (!cleanedTfn || cleanedTfn.length !== 9) {
      return res.json({
        success: true,
        data: {
          valid: false,
          tfn: cleanedTfn,
          reason: 'TFN must be 9 digits',
          format_check: false,
          checksum_valid: false
        }
      })
    }
    
    if (!/^\d+$/.test(cleanedTfn)) {
      return res.json({
        success: true,
        data: {
          valid: false,
          tfn: cleanedTfn,
          reason: 'TFN must contain only digits',
          format_check: false,
          checksum_valid: false
        }
      })
    }
    
    const weights = [1, 4, 3, 7, 5, 8, 6, 9, 10]
    let sum = 0
    
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanedTfn[i]) * weights[i]
    }
    
    const checksumValid = sum % 11 === 0
    
    res.json({
      success: true,
      data: {
        valid: checksumValid,
        tfn: cleanedTfn,
        format_check: true,
        checksum_valid: checksumValid,
        verification_date: new Date().toISOString()
      }
    })
  } catch (e) {
    next(e)
  }
})

router.get('/checklist', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query
    
    let checklist: any[] = []
    
    if (type === 'lease_start') {
      checklist = [
        { id: '1', item_en: 'Signed lease agreement', item_zh: '签署租赁协议', required: true, completed: false },
        { id: '2', item_en: 'Bond lodged with RTA', item_zh: '押金已提交RTA', required: true, completed: false },
        { id: '3', item_en: 'Condition report completed', item_zh: '完成状况报告', required: true, completed: false },
        { id: '4', item_en: 'Smoke alarm check', item_zh: '烟雾报警器检查', required: true, completed: false },
        { id: '5', item_en: 'Landlord insurance verified', item_zh: '房东保险验证', required: true, completed: false },
        { id: '6', item_en: 'Emergency contact details provided', item_zh: '提供紧急联系信息', required: true, completed: false },
        { id: '7', item_en: 'Utility accounts arranged', item_zh: '安排公用事业账户', required: false, completed: false },
      ]
    } else if (type === 'lease_end') {
      checklist = [
        { id: '1', item_en: 'Exit inspection completed', item_zh: '完成退租检查', required: true, completed: false },
        { id: '2', item_en: 'Final reading of utilities', item_zh: '最终水电煤读数', required: true, completed: false },
        { id: '3', item_en: 'All rent payments up to date', item_zh: '所有租金已结清', required: true, completed: false },
        { id: '4', item_en: 'Bond refund processed', item_zh: '押金退款处理', required: true, completed: false },
        { id: '5', item_en: 'Keys returned', item_zh: '归还钥匙', required: true, completed: false },
        { id: '6', item_en: 'Mail redirection arranged', item_zh: '安排邮件转寄', required: false, completed: false },
      ]
    } else if (type === 'tax_lodgement') {
      checklist = [
        { id: '1', item_en: 'Rental income statements', item_zh: '租金收入报表', required: true, completed: false },
        { id: '2', item_en: 'Expense receipts', item_zh: '支出收据', required: true, completed: false },
        { id: '3', item_en: 'Bank statements', item_zh: '银行对账单', required: true, completed: false },
        { id: '4', item_en: 'Depreciation schedule', item_zh: '折旧明细表', required: true, completed: false },
        { id: '5', item_en: 'Loan interest statements', item_zh: '贷款利息报表', required: true, completed: false },
        { id: '6', item_en: 'Council rates notices', item_zh: '市政税通知', required: true, completed: false },
        { id: '7', item_en: 'Insurance documents', item_zh: '保险文件', required: true, completed: false },
        { id: '8', item_en: 'Property manager fees', item_zh: '物业管理费', required: true, completed: false },
      ]
    }
    
    res.json({
      success: true,
      data: checklist
    })
  } catch (e) {
    next(e)
  }
})

router.post('/timezone/convert', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { datetime, from_timezone, to_timezone } = req.body
    
    if (!datetime || !from_timezone || !to_timezone) {
      return res.status(400).json({
        success: false,
        error: 'datetime, from_timezone and to_timezone are required'
      })
    }
    
    try {
      const converted = new Date(datetime).toLocaleString('en-AU', {
        timeZone: to_timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      
      const originalLocal = new Date(datetime).toLocaleString('en-AU', {
        timeZone: from_timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      
      res.json({
        success: true,
        data: {
          original: datetime,
          original_timezone: from_timezone,
          original_formatted: originalLocal,
          converted_timezone: to_timezone,
          converted_formatted: converted,
          utc: new Date(datetime).toISOString(),
          timestamp: new Date(datetime).getTime()
        }
      })
    } catch (e) {
      res.status(400).json({
        success: false,
        error: 'Invalid timezone or datetime format'
      })
    }
  } catch (e) {
    next(e)
  }
})

router.get('/timezones', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const timezones = [
      { value: 'Australia/Sydney', label: 'Sydney (GMT+10/+11)', country: 'Australia', offset: '+11:00' },
      { value: 'Australia/Melbourne', label: 'Melbourne (GMT+10/+11)', country: 'Australia', offset: '+11:00' },
      { value: 'Australia/Brisbane', label: 'Brisbane (GMT+10)', country: 'Australia', offset: '+10:00' },
      { value: 'Australia/Perth', label: 'Perth (GMT+8)', country: 'Australia', offset: '+08:00' },
      { value: 'Australia/Adelaide', label: 'Adelaide (GMT+9:30/+10:30)', country: 'Australia', offset: '+10:30' },
      { value: 'Asia/Shanghai', label: 'Shanghai (GMT+8)', country: 'China', offset: '+08:00' },
      { value: 'Asia/Beijing', label: 'Beijing (GMT+8)', country: 'China', offset: '+08:00' },
      { value: 'Asia/Hong_Kong', label: 'Hong Kong (GMT+8)', country: 'China', offset: '+08:00' },
      { value: 'Asia/Singapore', label: 'Singapore (GMT+8)', country: 'Singapore', offset: '+08:00' },
      { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8/-7)', country: 'USA', offset: '-07:00' },
      { value: 'America/New_York', label: 'New York (GMT-5/-4)', country: 'USA', offset: '-04:00' },
      { value: 'Europe/London', label: 'London (GMT+0/+1)', country: 'UK', offset: '+01:00' },
      { value: 'UTC', label: 'UTC (GMT+0)', country: 'Global', offset: '+00:00' },
    ]
    
    res.json({
      success: true,
      data: timezones
    })
  } catch (e) {
    next(e)
  }
})

export default router
