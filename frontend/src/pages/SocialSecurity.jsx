import React, { useState, useEffect } from 'react'
import { CalculatorIcon, MapPinIcon, CurrencyDollarIcon, HomeIcon, ClockIcon } from '@heroicons/react/24/outline'
import { socialSecurityAPI } from '../api/client'

const SocialSecurity = () => {
  const [policies, setPolicies] = useState([])
  const [selectedCity, setSelectedCity] = useState('')
  const [baseSalary, setBaseSalary] = useState('')
  const [housingFundRatio, setHousingFundRatio] = useState(12)
  const [result, setResult] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [calcLoading, setCalcLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [policiesRes, recordsRes] = await Promise.all([
          socialSecurityAPI.getPolicies(),
          socialSecurityAPI.getRecords(),
        ])
        setPolicies(policiesRes.data || [])
        setRecords(recordsRes.data || [])
      } catch (err) {
        setError('获取数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleCalculate = async () => {
    if (!selectedCity || !baseSalary) return
    setCalcLoading(true)
    setError('')
    try {
      const res = await socialSecurityAPI.calculate({
        cityCode: selectedCity,
        baseSalary: Number(baseSalary),
        housingFundRatio,
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.message || '计算失败')
    } finally {
      setCalcLoading(false)
    }
  }

  const breakdownItems = result
    ? [
        { label: '养老保险', personal: result.pensionPersonal, company: result.pensionCompany },
        { label: '医疗保险', personal: result.medicalPersonal, company: result.medicalCompany },
        { label: '失业保险', personal: result.unemploymentPersonal, company: result.unemploymentCompany },
        { label: '工伤保险', personal: result.injuryPersonal, company: result.injuryCompany },
        { label: '生育保险', personal: result.maternityPersonal, company: result.maternityCompany },
        { label: '住房公积金', personal: result.housingFundPersonal, company: result.housingFundCompany },
      ]
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">社保测算</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">请选择城市</option>
                {policies.map((p) => (
                  <option key={p.cityCode || p.city} value={p.cityCode || p.city}>
                    {p.cityName || p.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">缴费基数（元）</label>
            <div className="relative">
              <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                placeholder="请输入缴费基数"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              公积金比例：{housingFundRatio}%
            </label>
            <input
              type="range"
              min="5"
              max="12"
              value={housingFundRatio}
              onChange={(e) => setHousingFundRatio(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5%</span>
              <span>12%</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={calcLoading || !selectedCity || !baseSalary}
          className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
        >
          <CalculatorIcon className="w-5 h-5" />
          {calcLoading ? '计算中...' : '开始测算'}
        </button>
      </div>

      {result && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">测算结果</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <p className="text-sm text-indigo-600">个人合计</p>
                <p className="text-2xl font-bold text-indigo-700">¥{result.personalTotal}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-green-600">企业合计</p>
                <p className="text-2xl font-bold text-green-700">¥{result.companyTotal}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-purple-600">合计</p>
                <p className="text-2xl font-bold text-purple-700">¥{result.grandTotal}</p>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">项目</th>
                  <th className="text-right py-2 text-gray-500 font-medium">个人缴纳</th>
                  <th className="text-right py-2 text-gray-500 font-medium">企业缴纳</th>
                </tr>
              </thead>
              <tbody>
                {breakdownItems.map((item) => (
                  <tr key={item.label} className="border-b border-gray-50">
                    <td className="py-2.5 text-gray-700">{item.label}</td>
                    <td className="py-2.5 text-right text-gray-700">¥{item.personal}</td>
                    <td className="py-2.5 text-right text-gray-700">¥{item.company}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.suggestions && result.suggestions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">优化建议</h3>
              <ul className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600">
                    <HomeIcon className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">历史记录</h3>
        {records.length === 0 ? (
          <p className="text-gray-400 text-center py-8">暂无测算记录</p>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-gray-700 font-medium">{record.cityName || record.city}</p>
                    <p className="text-sm text-gray-400">{record.createdAt}</p>
                  </div>
                </div>
                <span className="text-indigo-600 font-medium">¥{record.personalTotal}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SocialSecurity
