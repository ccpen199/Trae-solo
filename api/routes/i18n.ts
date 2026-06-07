import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

const defaultTranslations = {
  zh: {
    common: {
      dashboard: '资产看板',
      properties: '房产管理',
      owners: '业主管理',
      tenants: '租客管理',
      leases: '租赁协议',
      loans: '贷款合同',
      tax: '税务申报',
      reports: '报告中心',
      appointments: '服务预约',
      reminders: '提醒中心',
      compliance: '合规中心',
      mall: '跨境商城',
      sync: '数据同步',
      settings: '系统设置',
      add: '新增',
      edit: '编辑',
      delete: '删除',
      save: '保存',
      cancel: '取消',
      search: '搜索',
      export: '导出',
      import: '导入',
      status: '状态',
      active: '活跃',
      inactive: '非活跃',
      pending: '待处理',
      paid: '已支付',
      overdue: '逾期',
      total: '总计',
      monthly: '月度',
      yearly: '年度',
      loading: '加载中...',
      no_data: '暂无数据',
      confirm: '确认',
      back: '返回',
      submit: '提交',
      reset: '重置',
      filter: '筛选',
      all: '全部',
      items: '项',
      checkout: '提交订单',
      services: '服务商品',
      my_orders: '我的订单',
      search_services: '搜索服务',
      category_all: '全部',
      category_cleaning: '清洁',
      category_maintenance: '维护',
      category_repair: '维修',
      category_inspection: '检查',
      category_professional: '专业服务',
      category_management: '物业管理',
      category_insurance: '保险',
      order_no: '订单号',
      service: '服务',
      tracking: '跟踪信息',
      no_orders: '暂无订单',
      status_confirmed: '已确认',
      status_delivered: '已完成',
      status_processing: '处理中',
      status_cancelled: '已取消',
      payment_paid: '已支付',
      payment_pending: '待支付'
    },
    dashboard: {
      rental_income: '租金收益',
      vacancy_rate: '空置率',
      maintenance_cost: '维修成本',
      total_properties: '房产总数',
      annual_yield: '年化收益率',
      cash_flow: '现金流',
      total_value: '总资产价值',
      active_leases: '活跃租约',
      upcoming_reminders: '即将到期提醒',
      recent_activity: '最近活动',
      monthly_rental_trend: '月度租金趋势',
      expense_breakdown: '支出构成',
      properties_by_city: '各城市房产分布'
    },
    auth: {
      login: '登录',
      logout: '退出登录',
      register: '注册',
      email: '邮箱',
      password: '密码',
      remember_me: '记住我',
      forgot_password: '忘记密码',
      login_success: '登录成功',
      logout_success: '退出成功',
      invalid_credentials: '邮箱或密码错误',
      welcome: '欢迎',
      logging_in: '登录中',
      registering: '注册中'
    },
    property: {
      title: '房产名称',
      address: '地址',
      city: '城市',
      state: '州',
      postcode: '邮编',
      type: '房产类型',
      bedrooms: '卧室',
      bathrooms: '卫生间',
      parking: '车位',
      purchase_price: '购买价格',
      current_value: '当前价值',
      amount: '金额',
      status: '状态',
      purchase_date: '购买日期',
      land_area: '土地面积',
      building_area: '建筑面积',
      year_built: '建成年份',
      council_rate: '市政费',
      water_rate: '水费',
      strata_fee: '物业费',
      insurance_fee: '保险费',
      land_tax: '土地税',
      management_fee: '管理费',
      apartment: '公寓',
      house: '独栋别墅',
      townhouse: '联排别墅',
      unit: '单元房'
    },
    compliance: {
      arbn_valid: 'ARBN验证通过',
      arbn_invalid: 'ARBN验证失败',
      lease_clause_warning: '租赁法条款提示',
      verify_arbn: '验证ARBN',
      verify_tfn: '验证TFN',
      checklist: '合规检查清单'
    }
  },
  en: {
    common: {
      dashboard: 'Dashboard',
      properties: 'Properties',
      owners: 'Owners',
      tenants: 'Tenants',
      leases: 'Leases',
      loans: 'Loans',
      tax: 'Tax Returns',
      reports: 'Reports',
      appointments: 'Appointments',
      reminders: 'Reminders',
      compliance: 'Compliance',
      mall: 'Mall',
      sync: 'Sync',
      settings: 'Settings',
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      search: 'Search',
      export: 'Export',
      import: 'Import',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      paid: 'Paid',
      overdue: 'Overdue',
      total: 'Total',
      monthly: 'Monthly',
      yearly: 'Yearly',
      loading: 'Loading...',
      no_data: 'No data',
      confirm: 'Confirm',
      back: 'Back',
      submit: 'Submit',
      reset: 'Reset',
      filter: 'Filter',
      all: 'All',
      items: 'items',
      checkout: 'Checkout',
      services: 'Services',
      my_orders: 'My Orders',
      search_services: 'Search services',
      category_all: 'All',
      category_cleaning: 'Cleaning',
      category_maintenance: 'Maintenance',
      category_repair: 'Repair',
      category_inspection: 'Inspection',
      category_professional: 'Professional',
      category_management: 'Management',
      category_insurance: 'Insurance',
      order_no: 'Order No.',
      service: 'Service',
      tracking: 'Tracking',
      no_orders: 'No orders',
      status_confirmed: 'Confirmed',
      status_delivered: 'Delivered',
      status_processing: 'Processing',
      status_cancelled: 'Cancelled',
      payment_paid: 'Paid',
      payment_pending: 'Pending'
    },
    dashboard: {
      rental_income: 'Rental Income',
      vacancy_rate: 'Vacancy Rate',
      maintenance_cost: 'Maintenance Cost',
      total_properties: 'Total Properties',
      annual_yield: 'Annual Yield',
      cash_flow: 'Cash Flow',
      total_value: 'Total Asset Value',
      active_leases: 'Active Leases',
      upcoming_reminders: 'Upcoming Reminders',
      recent_activity: 'Recent Activity',
      monthly_rental_trend: 'Monthly Rental Trend',
      expense_breakdown: 'Expense Breakdown',
      properties_by_city: 'Properties by City'
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      remember_me: 'Remember me',
      forgot_password: 'Forgot password',
      login_success: 'Login successful',
      logout_success: 'Logout successful',
      invalid_credentials: 'Invalid email or password',
      welcome: 'Welcome',
      logging_in: 'Logging in',
      registering: 'Registering'
    },
    property: {
      title: 'Property Title',
      address: 'Address',
      city: 'City',
      state: 'State',
      postcode: 'Postcode',
      type: 'Property Type',
      bedrooms: 'Bedrooms',
      bathrooms: 'Bathrooms',
      parking: 'Parking',
      purchase_price: 'Purchase Price',
      current_value: 'Current Value',
      amount: 'Amount',
      status: 'Status',
      purchase_date: 'Purchase Date',
      land_area: 'Land Area',
      building_area: 'Building Area',
      year_built: 'Year Built',
      council_rate: 'Council Rate',
      water_rate: 'Water Rate',
      strata_fee: 'Strata Fee',
      insurance_fee: 'Insurance Fee',
      land_tax: 'Land Tax',
      management_fee: 'Management Fee',
      apartment: 'Apartment',
      house: 'House',
      townhouse: 'Townhouse',
      unit: 'Unit'
    },
    compliance: {
      arbn_valid: 'ARBN Verified',
      arbn_invalid: 'ARBN Invalid',
      lease_clause_warning: 'Lease Law Clause Warning',
      verify_arbn: 'Verify ARBN',
      verify_tfn: 'Verify TFN',
      checklist: 'Compliance Checklist'
    }
  }
}

router.get('/translations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lang = 'zh' } = req.query
    const namespace = typeof req.query.namespace === 'string' ? req.query.namespace : ''
    
    let translations: any = namespace
      ? defaultTranslations[lang as keyof typeof defaultTranslations]?.[namespace as keyof typeof defaultTranslations['zh']]
      : defaultTranslations[lang as keyof typeof defaultTranslations]
    
    if (!translations) {
      const dbTranslations = db.prepare(`
        SELECT key, value FROM i18n_translations 
        WHERE lang = ? ${namespace ? 'AND namespace = ?' : ''}
      `).all(...(namespace ? [lang, namespace] : [lang])) as any[]
      
      translations = dbTranslations.reduce<Record<string, string>>((acc, t) => {
        acc[t.key] = t.value
        return acc
      }, {})
    }
    
    res.json({
      success: true,
      data: {
        lang,
        namespace: namespace || 'all',
        translations
      },
      translations
    })
  } catch (e) {
    next(e)
  }
})

router.get('/languages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: [
        { code: 'zh', name: '中文', name_en: 'Chinese', flag: '🇨🇳', default: true },
        { code: 'en', name: 'English', name_en: 'English', flag: '🇦🇺', default: false }
      ]
    })
  } catch (e) {
    next(e)
  }
})

router.post('/set-language', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { language } = req.body
    
    if (!['zh', 'en'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid language code'
      })
    }
    
    db.prepare('UPDATE users SET language = ? WHERE id = ?').run(language, req.user!.id)
    
    res.json({
      success: true,
      data: {
        language,
        message: `Language set to ${language}`
      }
    })
  } catch (e) {
    next(e)
  }
})

router.post('/set-timezone', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { timezone } = req.body
    
    db.prepare('UPDATE users SET timezone = ? WHERE id = ?').run(timezone, req.user!.id)
    
    res.json({
      success: true,
      data: {
        timezone,
        message: `Timezone set to ${timezone}`
      }
    })
  } catch (e) {
    next(e)
  }
})

export default router
