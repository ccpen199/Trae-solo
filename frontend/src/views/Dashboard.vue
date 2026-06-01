<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon blue">
            <el-icon size="28"><OfficeBuilding /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.enterpriseCount }}</div>
            <div class="stat-label">入驻企业</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon green">
            <el-icon size="28"><Monitor /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.meterCount }}</div>
            <div class="stat-label">计量表计</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon orange">
            <el-icon size="28"><Tickets /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.billCount }}</div>
            <div class="stat-label">有效账单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon red">
            <el-icon size="28"><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pendingReadings }}</div>
            <div class="stat-label">待复核抄表</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="12">
        <el-card class="amount-card">
          <div class="amount-title">应收总额</div>
          <div class="amount-value">¥ {{ formatMoney(stats.totalAmount) }}</div>
          <div class="amount-sub">
            已收: ¥ {{ formatMoney(stats.paidAmount) }} / 
            未收: ¥ {{ formatMoney(stats.totalAmount - stats.paidAmount) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <div class="chart-title">能源类型占比</div>
          <div ref="chartRef" class="chart-content"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="quick-actions">
      <template #header>
        <span>快捷操作</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="4">
          <el-button type="primary" style="width: 100%; height: 80px;" @click="goTo('/readings')">
            <el-icon size="24"><EditPen /></el-icon>
            <div>抄表录入</div>
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button type="success" style="width: 100%; height: 80px;" @click="goTo('/review')">
            <el-icon size="24"><CircleCheck /></el-icon>
            <div>异常复核</div>
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button type="warning" style="width: 100%; height: 80px;" @click="showGenerateDialog">
            <el-icon size="24"><Calculator /></el-icon>
            <div>生成账单</div>
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button type="info" style="width: 100%; height: 80px;" @click="goTo('/meters')">
            <el-icon size="24"><List /></el-icon>
            <div>表计档案</div>
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button type="danger" style="width: 100%; height: 80px;" @click="goTo('/rules')">
            <el-icon size="24"><Setting /></el-icon>
            <div>分摊规则</div>
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button style="width: 100%; height: 80px;" @click="goTo('/enterprises')">
            <el-icon size="24"><UserFilled /></el-icon>
            <div>企业管理</div>
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-dialog v-model="generateVisible" title="批量生成账单" width="400px">
      <el-form :model="generateForm" label-width="100px">
        <el-form-item label="账期">
          <el-date-picker
            v-model="generateForm.billing_period"
            type="month"
            value-format="YYYYMM"
            placeholder="选择账期"
            style="width: 100%;"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="generateVisible = false">取消</el-button>
        <el-button type="primary" @click="handleGenerate">生成账单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getDashboardStats, generateBills } from '../api'

const router = useRouter()
const stats = ref({
  enterpriseCount: 0,
  meterCount: 0,
  billCount: 0,
  pendingReadings: 0,
  totalAmount: 0,
  paidAmount: 0
})

const chartRef = ref(null)
const generateVisible = ref(false)
const generateForm = ref({ billing_period: '' })

const formatMoney = (val) => {
  return Number(val || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const goTo = (path) => router.push(path)

const loadStats = async () => {
  try {
    const res = await getDashboardStats()
    stats.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const initChart = () => {
  if (!chartRef.value) return
  const chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      data: [
        { value: 45, name: '电费' },
        { value: 20, name: '水费' },
        { value: 15, name: '气费' },
        { value: 20, name: '空调费' }
      ],
      color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c']
    }]
  })
}

const showGenerateDialog = () => {
  const now = new Date()
  generateForm.value.billing_period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  generateVisible.value = true
}

const handleGenerate = async () => {
  if (!generateForm.value.billing_period) {
    ElMessage.warning('请选择账期')
    return
  }
  try {
    const res = await generateBills(generateForm.value)
    ElMessage.success(`成功生成 ${res.data.generated} 张账单`)
    generateVisible.value = false
    loadStats()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '生成失败')
  }
}

onMounted(() => {
  loadStats()
  setTimeout(initChart, 100)
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}
.stats-row {
  margin-bottom: 20px;
}
.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}
.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 16px;
}
.stat-icon.blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.stat-icon.orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.red { background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); }
.stat-content { flex: 1; }
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  line-height: 1.2;
}
.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}
.amount-card {
  text-align: center;
  padding: 30px;
}
.amount-title {
  font-size: 16px;
  color: #666;
}
.amount-value {
  font-size: 36px;
  font-weight: bold;
  color: #409eff;
  margin: 10px 0;
}
.amount-sub {
  font-size: 14px;
  color: #999;
}
.chart-card {
  height: 100%;
}
.chart-title {
  font-size: 16px;
  margin-bottom: 10px;
}
.chart-content {
  height: 180px;
}
.quick-actions :deep(.el-button) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
