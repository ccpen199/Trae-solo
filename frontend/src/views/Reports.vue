<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">报表管理</h1>
        <p class="text-gray-500">生成和查看能源分析报告</p>
      </div>
      <div class="flex items-center space-x-3">
        <select 
          v-model="reportType"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="daily">日报</option>
          <option value="weekly">周报</option>
          <option value="monthly">月报</option>
        </select>
        <button 
          @click="generateReport"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          <span>生成报告</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">合规检查</p>
        <button 
          @click="runComplianceCheck"
          class="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          运行能效合规检查 →
        </button>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">审计日志</p>
        <router-link to="/audit" class="text-blue-600 hover:text-blue-800 font-medium text-sm">
          查看操作审计日志 →
        </router-link>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">设备时间线</p>
        <router-link to="/timeline" class="text-blue-600 hover:text-blue-800 font-medium text-sm">
          查看设备运行轨迹 →
        </router-link>
      </div>
    </div>

    <div v-if="complianceResult" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">能效合规检查结果</h3>
        <span 
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
          :class="complianceResult.non_compliant_count === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
        >
          {{ complianceResult.non_compliant_count === 0 ? '全部合规' : '存在不合规项' }}
        </span>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="text-center p-3 bg-gray-50 rounded-lg">
          <p class="text-2xl font-bold text-gray-800">{{ complianceResult.total_devices }}</p>
          <p class="text-sm text-gray-500">检查设备数</p>
        </div>
        <div class="text-center p-3 bg-green-50 rounded-lg">
          <p class="text-2xl font-bold text-green-600">{{ complianceResult.compliant_count }}</p>
          <p class="text-sm text-gray-500">合规设备</p>
        </div>
        <div class="text-center p-3 bg-yellow-50 rounded-lg">
          <p class="text-2xl font-bold text-yellow-600">{{ complianceResult.non_compliant_count }}</p>
          <p class="text-sm text-gray-500">不合规设备</p>
        </div>
      </div>
      
      <div v-if="complianceResult.non_compliant_count > 0" class="space-y-3">
        <div 
          v-for="result in complianceResult.results.filter(r => r.status === 'non_compliant')" 
          :key="result.device_id"
          class="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-gray-800">{{ result.device_name }} ({{ result.device_code }})</span>
            <span class="text-yellow-600 text-sm">不合规</span>
          </div>
          <div class="space-y-1">
            <div v-for="issue in result.issues" :key="issue.type" class="text-sm text-gray-600">
              <span class="text-yellow-600">[{{ issue.severity }}]</span> {{ issue.message }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800">历史报告</h3>
      </div>
      <div class="divide-y divide-gray-100">
        <div 
          v-for="report in reports" 
          :key="report.id"
          class="p-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-medium text-gray-800">{{ report.title }}</h4>
              <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>报告类型: {{ report.report_type === 'daily' ? '日报' : report.report_type === 'weekly' ? '周报' : '月报' }}</span>
                <span>报告周期: {{ report.report_period }}</span>
                <span>生成时间: {{ formatDateTime(report.generated_at) }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button 
                @click="viewReport(report)"
                class="text-blue-600 hover:text-blue-800 text-sm"
              >
                查看
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p class="text-xs text-gray-500">总能耗</p>
              <p class="text-lg font-medium text-gray-800">{{ report.total_energy?.toFixed(2) || 0 }} kWh</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">环比变化</p>
              <p 
                class="text-lg font-medium"
                :class="(report.change_percent || 0) >= 0 ? 'text-red-600' : 'text-green-600'"
              >
                {{ report.change_percent >= 0 ? '+' : '' }}{{ report.change_percent?.toFixed(2) || 0 }}%
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500">能效评分</p>
              <p class="text-lg font-medium text-indigo-600">{{ report.efficiency_score?.toFixed(1) || 0 }} 分</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">告警数</p>
              <p class="text-lg font-medium text-orange-600">{{ report.alarms_count || 0 }} 个</p>
            </div>
          </div>
        </div>
        
        <div v-if="reports.length === 0" class="py-12 text-center text-gray-500">
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-lg font-medium">暂无历史报告</p>
          <p class="text-sm mt-1">点击上方按钮生成新报告</p>
        </div>
      </div>
    </div>

    <div v-if="showReportDetail" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div class="p-6 border-b border-gray-100 sticky top-0 bg-white">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-800">{{ selectedReport?.title }}</h3>
            <button @click="showReportDetail = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="p-6">
          <div v-if="selectedReport?.summary" class="p-4 bg-blue-50 rounded-lg mb-6">
            <p class="text-sm text-blue-800">{{ selectedReport.summary }}</p>
          </div>
          
          <div v-if="selectedReport?.content" class="prose max-w-none">
            <pre class="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">{{ selectedReport.content }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'
import dayjs from 'dayjs'

const reports = ref([])
const reportType = ref('daily')
const complianceResult = ref(null)

const showReportDetail = ref(false)
const selectedReport = ref(null)

const fetchReports = async () => {
  try {
    const response = await api.get('/api/reports')
    reports.value = response.data
  } catch (err) {
    console.error('获取报告列表失败:', err)
  }
}

const generateReport = async () => {
  try {
    const response = await api.post('/api/reports/generate', null, {
      params: { report_type: reportType.value }
    })
    alert('报告生成成功！')
    fetchReports()
  } catch (err) {
    console.error('生成报告失败:', err)
    alert('生成报告失败')
  }
}

const runComplianceCheck = async () => {
  try {
    const response = await api.get('/api/reports/compliance-check')
    complianceResult.value = response.data
  } catch (err) {
    console.error('合规检查失败:', err)
    alert('合规检查失败')
  }
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return dayjs(datetime).format('YYYY-MM-DD HH:mm')
}

const viewReport = (report) => {
  selectedReport.value = report
  showReportDetail.value = true
}

onMounted(() => {
  fetchReports()
})
</script>
