<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">计费管理</h1>
        <p class="text-gray-500">查看和管理能源账单</p>
      </div>
      <div class="flex items-center space-x-3">
        <select 
          v-model="selectedMonth"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="month in months" :key="month.value" :value="month.value">
            {{ month.label }}
          </option>
        </select>
        <button 
          @click="calculateAllBills"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          计算本月账单
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <p class="text-sm text-gray-500">总能耗</p>
        <p class="text-2xl font-bold text-gray-800">{{ monthlyStats.total_energy?.toFixed(2) || 0 }}</p>
        <p class="text-xs text-gray-400">kWh</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <p class="text-sm text-gray-500">总金额</p>
        <p class="text-2xl font-bold text-gray-800">¥{{ monthlyStats.total_amount?.toFixed(2) || 0 }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <p class="text-sm text-gray-500">最终金额</p>
        <p class="text-2xl font-bold text-blue-600">¥{{ monthlyStats.final_amount?.toFixed(2) || 0 }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <p class="text-sm text-gray-500">账单数量</p>
        <p class="text-2xl font-bold text-gray-800">{{ monthlyStats.bills_count || 0 }}</p>
        <p class="text-xs text-gray-400">
          已确认: {{ monthlyStats.status_summary?.confirmed || 0 }} / 
          待确认: {{ monthlyStats.status_summary?.pending || 0 }}
        </p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">费率配置</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 bg-red-50 rounded-lg">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">尖峰电价</span>
            <span class="text-lg font-bold text-red-600">¥{{ tariffConfig.peak_rate }}/kWh</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">时段: 9:00-12:00, 14:00-21:00</p>
        </div>
        <div class="p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">平时电价</span>
            <span class="text-lg font-bold text-gray-700">¥{{ tariffConfig.normal_rate }}/kWh</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">时段: 7:00-9:00, 12:00-14:00, 21:00-23:00</p>
        </div>
        <div class="p-4 bg-green-50 rounded-lg">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">谷时电价</span>
            <span class="text-lg font-bold text-green-600">¥{{ tariffConfig.valley_rate }}/kWh</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">时段: 23:00-7:00</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账单编号</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账期</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总能耗</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分时电量</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总金额</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="bill in bills" :key="bill.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm font-mono text-gray-900">{{ bill.bill_no }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-900">{{ bill.billing_period }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-900">{{ bill.total_energy?.toFixed(2) }} kWh</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-xs space-y-1">
                <div class="text-red-600">尖峰: {{ bill.peak_energy?.toFixed(2) || 0 }} kWh</div>
                <div class="text-gray-600">平时: {{ bill.normal_energy?.toFixed(2) || 0 }} kWh</div>
                <div class="text-green-600">谷时: {{ bill.valley_energy?.toFixed(2) || 0 }} kWh</div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm">
                <div class="text-gray-900 font-medium">¥{{ bill.total_amount?.toFixed(2) }}</div>
                <div class="text-xs text-gray-500">
                  税: ¥{{ bill.tax_amount?.toFixed(2) || 0 }} | 
                  优惠: -¥{{ bill.discount_amount?.toFixed(2) || 0 }}
                </div>
                <div class="text-blue-600 font-medium">实收: ¥{{ bill.final_amount?.toFixed(2) }}</div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="bill.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
              >
                {{ bill.status === 'confirmed' ? '已确认' : '待确认' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button 
                v-if="bill.status === 'draft'"
                @click="confirmBill(bill)"
                class="text-blue-600 hover:text-blue-900"
              >
                确认
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="bills.length === 0" class="py-12 text-center text-gray-500">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p class="text-lg font-medium">暂无账单数据</p>
        <p class="text-sm mt-1">点击上方按钮计算本月账单</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../utils/api'

const bills = ref([])
const monthlyStats = ref({})
const tariffConfig = ref({
  peak_rate: 1.2,
  normal_rate: 0.8,
  valley_rate: 0.4
})

const now = new Date()
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

const months = computed(() => {
  const result = []
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = `${date.getFullYear()}年${date.getMonth() + 1}月`
    result.push({ value, label })
  }
  return result
})

const fetchBills = async () => {
  try {
    const [year, month] = selectedMonth.value.split('-').map(Number)
    
    const [billsRes, statsRes, tariffRes] = await Promise.all([
      api.get('/api/billing', { params: { billing_month: selectedMonth.value } }),
      api.get('/api/billing/statistics/monthly', { params: { year, month } }),
      api.get('/api/billing/tariff/config')
    ])
    
    bills.value = billsRes.data
    monthlyStats.value = statsRes.data
    tariffConfig.value = tariffRes.data
  } catch (err) {
    console.error('获取账单数据失败:', err)
  }
}

const calculateAllBills = async () => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  
  try {
    const response = await api.post('/api/billing/calculate-all', null, {
      params: { year, month }
    })
    alert(`账单计算完成: ${response.data.results.filter(r => r.status === 'success').length} 个设备`)
    fetchBills()
  } catch (err) {
    console.error('计算账单失败:', err)
    alert('计算账单失败')
  }
}

const confirmBill = async (bill) => {
  if (!confirm(`确认账单 ${bill.bill_no}？确认后无法修改。`)) return
  
  try {
    await api.post(`/api/billing/${bill.id}/confirm`, { note: '财务在线确认' })
    fetchBills()
  } catch (err) {
    console.error('确认账单失败:', err)
    alert('确认账单失败')
  }
}

onMounted(() => {
  fetchBills()
})
</script>
