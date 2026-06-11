import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { getInsuranceListByCity, getChartData } from '@/mocks/socialInsurance'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { MapPin, Database, RefreshCw, Building2, Clock, CheckCircle2, AlertTriangle, FileSearch, ChevronRight } from 'lucide-react'
import { useMemo, useState, useEffect, useRef } from 'react'

export default function SocialInsuranceIndex() {
  const navigate = useNavigate()
  const { city, addLog } = useAppStore()
  const insuranceList = useMemo(() => getInsuranceListByCity(city), [city])
  const chartData = useMemo(() => getChartData(city), [city])

  const [receiptVisible, setReceiptVisible] = useState(false)
  const [receiptNo, setReceiptNo] = useState('')
  const [receiptTime, setReceiptTime] = useState('')
  const [verifyDone, setVerifyDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const handleQuery = () => {
    const no = `QY${Date.now().toString(36).toUpperCase()}`
    setReceiptNo(no)
    setReceiptTime(new Date().toLocaleString('zh-CN', { hour12: false }))
    setReceiptVisible(true)
    setVerifyDone(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    addLog(`实时查询社保参保数据（回执：${no}）`, '社保查询')
    timerRef.current = setTimeout(() => setVerifyDone(true), 1200)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const latestMonth = insuranceList[0]?.records[0]?.month
  const employerInfo = useMemo(() => {
    const map: Record<string, { name: string; code: string; changeDate: string; prevName: string }> = {
      '广州': { name: '广州市数字科技运营有限公司', code: '91440101MA5C', changeDate: '2025-03-01', prevName: '广州市信息技术开发有限公司' },
      '深圳': { name: '深圳市创新产业投资集团', code: '91440300MA5D', changeDate: '', prevName: '' },
      '珠海': { name: '珠海华发集团有限公司', code: '91440400MA5E', changeDate: '', prevName: '' },
      '东莞': { name: '东莞市松山湖高新科技开发有限公司', code: '91441900MA5F', changeDate: '2025-06-15', prevName: '东莞松山湖科技发展有限公司' },
      '佛山': { name: '佛山市公用事业控股有限公司', code: '91440600MA5G', changeDate: '', prevName: '' },
    }
    return map[city] || map['广州']
  }, [city])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h2 className="gov-section-title">社会保险</h2>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-sm font-medium">
            <MapPin className="w-3.5 h-3.5" />
            {city}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleQuery} className="gov-btn-secondary text-sm flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            实时查询
          </button>
          <button onClick={() => navigate('/social-insurance/certificate')} className="gov-btn-accent">
            生成参保证明
          </button>
        </div>
      </div>

      <div className="gov-card p-4 flex items-center gap-3 text-sm flex-wrap">
        <Database className="w-4 h-4 text-primary-500 flex-shrink-0" />
        <span className="text-gov-muted">数据来源：</span>
        <span className="text-gov-text font-medium">{insuranceList[0]?.dataSource}</span>
        <span className="text-gov-muted ml-3">|</span>
        <span className="text-gov-muted ml-1">数据治理：</span>
        <span className="text-gov-text font-medium">{city}市社保数据分中心</span>
        <span className="text-gov-muted ml-3">|</span>
        <span className="text-gov-muted ml-1">来源校验：</span>
        <span className="flex items-center gap-1 text-gov-success font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          已通过
        </span>
      </div>

      {receiptVisible && (
        <div className="gov-card p-4 border-l-4 border-primary-400 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <FileSearch className="w-4 h-4 text-primary-500" />
            <span className="font-medium text-gov-text">实时查询回执</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gov-muted">回执编号：</span><span className="text-gov-text font-mono">{receiptNo}</span></div>
            <div><span className="text-gov-muted">查询时间：</span><span className="text-gov-text">{receiptTime}</span></div>
            <div><span className="text-gov-muted">数据来源：</span><span className="text-gov-text text-xs">{insuranceList[0]?.dataSource}</span></div>
            <div>
              <span className="text-gov-muted">来源校验：</span>
              {verifyDone ? (
                <span className="flex items-center gap-1 text-gov-success font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  数据一致
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-500">
                  <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  校验中...
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 gov-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-primary-500" />
            <h3 className="font-semibold text-gov-text">参保单位</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div><span className="text-gov-muted">单位名称：</span><span className="text-gov-text font-medium">{employerInfo.name}</span></div>
            <div><span className="text-gov-muted">统一社会信用代码：</span><span className="text-gov-text font-mono">{employerInfo.code}</span></div>
            <div><span className="text-gov-muted">参保状态：</span><span className="gov-badge-success">正常参保</span></div>
            {employerInfo.changeDate && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800">
                <div className="flex items-center gap-1 font-medium mb-1"><AlertTriangle className="w-3 h-3" />参保单位变更记录</div>
                <p>变更日期：{employerInfo.changeDate}</p>
                <p>原单位：{employerInfo.prevName}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 gov-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gov-text">最近缴费（{latestMonth}）</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="gov-table-header">
                  <th className="px-3 py-2 text-left">险种</th>
                  <th className="px-3 py-2 text-right">缴费基数</th>
                  <th className="px-3 py-2 text-right">单位缴费</th>
                  <th className="px-3 py-2 text-right">个人缴费</th>
                  <th className="px-3 py-2 text-center">状态</th>
                  <th className="px-3 py-2 text-center">明细</th>
                </tr>
              </thead>
              <tbody>
                {insuranceList.map((ins) => {
                  const rec = ins.records[0]
                  return (
                    <tr key={ins.type} className="gov-table-row">
                      <td className="px-3 py-2"><span className="mr-1.5">{ins.icon}</span><span className="text-gov-text font-medium">{ins.typeName}</span></td>
                      <td className="px-3 py-2 text-right text-gov-text">¥{rec?.baseAmount.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-gov-text">¥{rec?.companyPay.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-gov-text">¥{rec?.personalPay.toLocaleString()}</td>
                      <td className="px-3 py-2 text-center"><span className={rec?.payStatus === '已到账' ? 'gov-badge-success' : 'gov-badge-info'}>{rec?.payStatus}</span></td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => navigate(`/social-insurance/detail/${ins.type}`)} className="text-primary-500 hover:text-primary-600 flex items-center gap-0.5 mx-auto text-xs font-medium">
                          查看明细<ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {insuranceList.map((ins) => (
          <div key={ins.type} className="gov-card p-5 cursor-pointer hover:border-primary-300 transition-colors" onClick={() => navigate(`/social-insurance/detail/${ins.type}`)}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{ins.icon}</span>
              <span className="gov-badge-success">参保中</span>
            </div>
            <h3 className="font-semibold text-gov-text text-base mb-3">{ins.typeName}</h3>
            <div className="space-y-1.5 text-sm text-gov-muted">
              <div className="flex justify-between"><span>缴费月数</span><span className="text-gov-text font-medium">{ins.months}个月</span></div>
              <div className="flex justify-between"><span>缴费基数</span><span className="text-gov-text font-medium">¥{ins.baseAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>单位缴费</span><span className="text-gov-text font-medium">¥{ins.companyPay.toLocaleString()}/月</span></div>
              <div className="flex justify-between"><span>个人缴费</span><span className="text-gov-text font-medium">¥{ins.personalPay.toLocaleString()}/月</span></div>
              <div className="flex justify-between"><span>个人账户余额</span><span className="text-gov-text font-medium">¥{ins.benefitInfo.personalBalance.toLocaleString()}</span></div>
              {ins.benefitInfo.monthlyBenefit && (
                <div className="flex justify-between"><span>月待遇金额</span><span className="text-accent-500 font-medium">¥{ins.benefitInfo.monthlyBenefit.toLocaleString()}</span></div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gov-border text-center">
              <span className="text-xs text-primary-500 font-medium">查看逐月明细与待遇 →</span>
            </div>
          </div>
        ))}
      </div>

      <div className="gov-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="gov-section-title">缴费趋势（近12个月 · {city}）</h3>
          <div className="flex items-center gap-2 text-xs text-gov-muted">
            <Clock className="w-3.5 h-3.5" />
            数据更新至 {latestMonth}
            <span className="mx-2">|</span>
            <Database className="w-3.5 h-3.5" />
            {insuranceList[0]?.dataSource}
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                {insuranceList.map((ins) => (
                  <linearGradient key={ins.type} id={`gradient-${ins.type}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ins.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ins.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#718096' }} />
              <YAxis tick={{ fontSize: 12, fill: '#718096' }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              {insuranceList.map((ins) => (
                <Area key={ins.type} type="monotone" dataKey={ins.typeName} stroke={ins.color} strokeWidth={2} fill={`url(#gradient-${ins.type})`} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
