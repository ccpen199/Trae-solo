import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { getInsuranceListByCity } from '@/mocks/socialInsurance'
import { ArrowLeft, MapPin, Database, Clock, Wallet, TrendingUp, Building2, CheckCircle2, Shield, AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'

const typeNames: Record<string, string> = {
  pension: '养老保险',
  medical: '医疗保险',
  unemployment: '失业保险',
  injury: '工伤保险',
  maternity: '生育保险',
}

export default function SocialInsuranceDetail() {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()
  const { city, addLog } = useAppStore()
  const insuranceList = useMemo(() => getInsuranceListByCity(city), [city])
  const insurance = insuranceList.find((i) => i.type === type)

  const employerChanges = useMemo(() => {
    const changes: Record<string, { date: string; from: string; to: string }[]> = {
      '广州': [
        { date: '2025-03-01', from: '广州市信息技术开发有限公司', to: '广州市数字科技运营有限公司' },
      ],
      '东莞': [
        { date: '2025-06-15', from: '东莞松山湖科技发展有限公司', to: '东莞市松山湖高新科技开发有限公司' },
      ],
    }
    return changes[city] || []
  }, [city])

  useMemo(() => {
    if (type) {
      addLog(`查询${typeNames[type] || type}参保明细（${city}）`, '社保查询')
    }
  }, [type, addLog, city])

  if (!insurance) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gov-muted">
        <p className="text-lg mb-4">未找到该险种信息</p>
        <button onClick={() => navigate('/social-insurance')} className="gov-btn-primary">返回社保总览</button>
      </div>
    )
  }

  const stats = [
    { label: '缴费基数', value: `¥${insurance.baseAmount.toLocaleString()}/月`, color: 'text-primary-500', icon: Database },
    { label: '单位缴费', value: `¥${insurance.companyPay.toLocaleString()}/月`, color: 'text-gov-success', icon: TrendingUp },
    { label: '个人缴费', value: `¥${insurance.personalPay.toLocaleString()}/月`, color: 'text-accent-500', icon: Wallet },
    { label: '缴费月数', value: `${insurance.months}个月`, color: 'text-gov-text', icon: Clock },
  ]

  const totalCompany = insurance.records.reduce((s, r) => s + r.companyPay, 0)
  const totalPersonal = insurance.records.reduce((s, r) => s + r.personalPay, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => navigate('/social-insurance')}
          className="w-9 h-9 rounded-lg border border-gov-border flex items-center justify-center hover:bg-primary-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gov-text" />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{insurance.icon}</span>
          <h2 className="gov-section-title">{typeNames[insurance.type] || insurance.typeName}</h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-sm font-medium">
          <MapPin className="w-3.5 h-3.5" />
          {city}
        </div>
      </div>

      <div className="gov-card p-4 flex items-center gap-3 text-sm flex-wrap">
        <Database className="w-4 h-4 text-primary-500 flex-shrink-0" />
        <span className="text-gov-muted">数据来源：</span>
        <span className="text-gov-text font-medium">{insurance.dataSource}</span>
        <span className="text-gov-muted ml-3">|</span>
        <span className="text-gov-muted ml-2">数据治理：</span>
        <span className="text-gov-text font-medium">{city}市社保数据分中心</span>
        <span className="text-gov-muted ml-3">|</span>
        <span className="text-gov-muted ml-2">来源校验：</span>
        <span className="flex items-center gap-1 text-gov-success font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          已通过
        </span>
        <span className="text-gov-muted ml-3">|</span>
        <span className="text-gov-muted ml-2">单位比例：</span>
        <span className="text-gov-text font-medium">{(insurance.companyRatio * 100).toFixed(1)}%</span>
        <span className="text-gov-muted ml-3">|</span>
        <span className="text-gov-muted ml-2">个人比例：</span>
        <span className="text-gov-text font-medium">{(insurance.personalRatio * 100).toFixed(1)}%</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="gov-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <p className="text-sm text-gov-muted">{stat.label}</p>
            </div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insurance.benefitInfo.lastBenefitDate && (
          <div className="gov-card p-5">
            <h3 className="gov-section-title mb-4">待遇发放</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gov-muted mb-1">个人账户余额</p>
                <p className="text-lg font-bold text-primary-500">¥{insurance.benefitInfo.personalBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gov-muted mb-1">单位累计缴纳</p>
                <p className="text-lg font-bold text-gov-success">¥{insurance.benefitInfo.companyTotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gov-muted mb-1">最近待遇发放</p>
                <p className="text-lg font-bold text-gov-text">{insurance.benefitInfo.lastBenefitDate}</p>
              </div>
              {insurance.benefitInfo.monthlyBenefit && (
                <div>
                  <p className="text-gov-muted mb-1">月待遇金额</p>
                  <p className="text-lg font-bold text-accent-500">¥{insurance.benefitInfo.monthlyBenefit.toLocaleString()}/月</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="gov-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-primary-500" />
            <h3 className="gov-section-title">参保单位</h3>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-gov-muted" />
              <span className="text-gov-muted">数据来源校验：</span>
              <span className="flex items-center gap-1 text-gov-success font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                核验通过
              </span>
            </div>
          </div>
          {employerChanges.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                <AlertTriangle className="w-3.5 h-3.5" />
                参保单位变更记录
              </div>
              {employerChanges.map((change, idx) => (
                <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800">
                  <p className="font-medium">变更日期：{change.date}</p>
                  <p>原单位：{change.from}</p>
                  <p>现单位：{change.to}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="p-5 border-b border-gov-border flex items-center justify-between flex-wrap gap-2">
          <h3 className="gov-section-title">逐月缴费记录</h3>
          <div className="flex items-center gap-4 text-xs text-gov-muted">
            <span>近12月合计：单位 ¥{totalCompany.toLocaleString()} / 个人 ¥{totalPersonal.toLocaleString()}</span>
            <span>|</span>
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5" />
              {insurance.dataSource}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="gov-table-header">
                <th className="px-4 py-3 text-left">月份</th>
                <th className="px-4 py-3 text-right">缴费基数</th>
                <th className="px-4 py-3 text-right">单位缴费（比例）</th>
                <th className="px-4 py-3 text-right">个人缴费（比例）</th>
                <th className="px-4 py-3 text-right">合计</th>
                <th className="px-4 py-3 text-center">到账日期</th>
                <th className="px-4 py-3 text-center">缴费状态</th>
                <th className="px-4 py-3 text-center">来源校验</th>
              </tr>
            </thead>
            <tbody>
              {insurance.records.map((record) => (
                <tr key={record.month} className="gov-table-row">
                  <td className="px-4 py-3 text-gov-text font-medium">{record.month}</td>
                  <td className="px-4 py-3 text-right text-gov-text">¥{record.baseAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-gov-text">¥{record.companyPay.toLocaleString()}</span>
                    <span className="text-gov-muted ml-1 text-xs">({(record.companyRatio * 100).toFixed(1)}%)</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-gov-text">¥{record.personalPay.toLocaleString()}</span>
                    <span className="text-gov-muted ml-1 text-xs">({(record.personalRatio * 100).toFixed(1)}%)</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gov-text font-medium">¥{record.totalPay.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-gov-muted text-xs">{record.payDate}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={
                      record.payStatus === '已到账' ? 'gov-badge-success'
                        : record.payStatus === '缴纳中' ? 'gov-badge-info'
                        : 'gov-badge-warning'
                    }>
                      {record.payStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CheckCircle2 className="w-4 h-4 text-gov-success mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
