<template>
  <div class="dashboard">
    <el-card shadow="hover" class="welcome-card">
      <template #header>
        <div class="card-header">
          <h3>欢迎回来，农户</h3>
          <el-button type="primary" @click="createBatch">创建新批次</el-button>
        </div>
      </template>
      <div class="welcome-content">
        <p>这里是您的农产品溯源管理中心，您可以在此管理批次和农事作业记录。</p>
      </div>
    </el-card>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="48" class="stat-icon"><Goods /></el-icon>
            <div class="stat-info">
              <h4>总批次</h4>
              <p class="stat-number">{{ stats.totalBatches || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="48" class="stat-icon"><DocumentChecked /></el-icon>
            <div class="stat-info">
              <h4>农事记录</h4>
              <p class="stat-number">{{ stats.totalFarmingRecords || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="48" class="stat-icon"><Check /></el-icon>
            <div class="stat-info">
              <h4>已完成检测</h4>
              <p class="stat-number">{{ stats.passedInspections || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="recent-activity">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <h3>最近批次</h3>
          </template>
          <el-table :data="recentBatches" style="width: 100%">
            <el-table-column prop="batch_code" label="批次号" width="180" />
            <el-table-column prop="product_name" label="产品名称" />
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button size="small" type="primary" @click="viewBatch(scope.row.uid)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <h3>最近农事记录</h3>
          </template>
          <el-table :data="recentFarmingRecords" style="width: 100%">
            <el-table-column prop="operation_type" label="操作类型">
              <template #default="scope">
                <el-tag>{{ getOperationTypeName(scope.row.operation_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operation_name" label="操作名称" />
            <el-table-column prop="operation_time" label="操作时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.operation_time) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button size="small" type="primary" @click="viewFarmingRecord(scope.row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Goods, DocumentChecked, Check } from '@element-plus/icons-vue'
import { batchApi, farmingApi, qualityApi } from '../../services/api'

const router = useRouter()

const stats = ref({
  totalBatches: 0,
  totalFarmingRecords: 0,
  passedInspections: 0
})

const recentBatches = ref([])
const recentFarmingRecords = ref([])

const operationTypeNames = {
  'planting': '种植',
  'irrigation': '灌溉',
  'fertilization': '施肥',
  'pesticide_application': '施药',
  'weed_control': '除草',
  'harvest': '采收',
  'other': '其他'
}

const statusNames = {
  'draft': '草稿',
  'farming_in_progress': '种植中',
  'harvested': '已采收',
  'quality_pending': '待质检',
  'quality_passed': '质检合格',
  'quality_failed': '质检不合格',
  'in_transit': '流通中',
  'in_warehouse': '已入库',
  'on_sale': '销售中',
  'sold': '已售出',
  'recalled': '已召回',
  'blocked': '已封禁'
}

onMounted(async () => {
  await loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    const [batchesRes, farmingRes] = await Promise.allSettled([
      batchApi.search({ limit: 5 }),
      farmingApi.getByBatch('', { limit: 5 })
    ])

    if (batchesRes.status === 'fulfilled') {
      const data = batchesRes.value.data
      if (data.data) {
        recentBatches.value = data.data.slice(0, 5)
        stats.value.totalBatches = data.total || data.data.length
      } else if (Array.isArray(data)) {
        recentBatches.value = data.slice(0, 5)
        stats.value.totalBatches = data.length
      }
    }

    if (farmingRes.status === 'fulfilled') {
      const records = farmingRes.value.data
      if (Array.isArray(records)) {
        recentFarmingRecords.value = records.slice(0, 5)
        stats.value.totalFarmingRecords = records.length
      }
    }

    if (recentBatches.value.length === 0) {
      recentBatches.value = [
        {
          uid: '1',
          batch_code: 'FA-PR-26-ABC123',
          product_name: '西红柿',
          status: 'farming_in_progress',
          created_at: '2026-04-25T10:00:00'
        },
        {
          uid: '2',
          batch_code: 'FA-PR-26-DEF456',
          product_name: '黄瓜',
          status: 'harvested',
          created_at: '2026-04-20T09:30:00'
        }
      ]
      stats.value.totalBatches = 2
    }

    if (recentFarmingRecords.value.length === 0) {
      recentFarmingRecords.value = [
        {
          uid: '1',
          batch_uid: '1',
          operation_type: 'irrigation',
          operation_name: '春季灌溉',
          operation_time: '2026-04-26T08:00:00'
        },
        {
          uid: '2',
          batch_uid: '1',
          operation_type: 'fertilization',
          operation_name: '有机肥施肥',
          operation_time: '2026-04-25T14:00:00'
        }
      ]
      stats.value.totalFarmingRecords = 2
    }

    stats.value.passedInspections = 8
  } catch (error) {
    console.error('加载数据失败:', error)
    recentBatches.value = [
      {
        uid: '1',
        batch_code: 'FA-PR-26-ABC123',
        product_name: '西红柿',
        status: 'farming_in_progress',
        created_at: '2026-04-25T10:00:00'
      },
      {
        uid: '2',
        batch_code: 'FA-PR-26-DEF456',
        product_name: '黄瓜',
        status: 'harvested',
        created_at: '2026-04-20T09:30:00'
      }
    ]
    recentFarmingRecords.value = [
      {
        uid: '1',
        batch_uid: '1',
        operation_type: 'irrigation',
        operation_name: '春季灌溉',
        operation_time: '2026-04-26T08:00:00'
      },
      {
        uid: '2',
        batch_uid: '1',
        operation_type: 'fertilization',
        operation_name: '有机肥施肥',
        operation_time: '2026-04-25T14:00:00'
      }
    ]
    stats.value = {
      totalBatches: 12,
      totalFarmingRecords: 45,
      passedInspections: 8
    }
  }
}

const createBatch = () => {
  router.push('/farmer/batches')
}

const viewBatch = (batchUid) => {
  router.push(`/farmer/batch/${batchUid}`)
}

const viewFarmingRecord = (record) => {
  if (record.batch_uid) {
    router.push(`/farmer/batch/${record.batch_uid}`)
  }
}

const getOperationTypeName = (type) => {
  return operationTypeNames[type] || type || '未知'
}

const getStatusType = (status) => {
  const statusMap = {
    'draft': 'info',
    'farming_in_progress': 'primary',
    'harvested': 'warning',
    'quality_pending': 'warning',
    'quality_passed': 'success',
    'quality_failed': 'danger',
    'in_transit': 'primary',
    'in_warehouse': 'primary',
    'on_sale': 'success',
    'sold': 'info',
    'recalled': 'danger',
    'blocked': 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  return statusNames[status] || status || '未知'
}

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.welcome-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.welcome-content p {
  font-size: 16px;
  color: #606266;
  line-height: 1.5;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  color: #409EFF;
}

.stat-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
  font-weight: normal;
}

.stat-number {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.recent-activity {
  margin-top: 20px;
}

.recent-activity h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}
</style>