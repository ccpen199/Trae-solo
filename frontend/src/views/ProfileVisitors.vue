<template>
  <div class="profile-visitors-page">
    <div class="page-header">
      <h2 class="page-title">访客记录</h2>
      <div class="header-actions">
        <el-button @click="loadVisitors">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="$router.push('/visitors/create')">
          <el-icon><Plus /></el-icon>
          新增访客
        </el-button>
      </div>
    </div>
    
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stat-row">
            <div class="stat-item">
              <div class="stat-value blue">{{ stats.total }}</div>
              <div class="stat-label">总访客</div>
            </div>
            <div class="stat-item">
              <div class="stat-value green">{{ stats.active }}</div>
              <div class="stat-label">进行中</div>
            </div>
            <div class="stat-item">
              <div class="stat-value orange">{{ stats.overdue }}</div>
              <div class="stat-label">超时滞留</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="18">
        <el-card class="table-card" v-loading="loading">
          <el-table :data="visitors" stripe>
            <el-table-column prop="visitor_name" label="访客姓名" width="120" />
            <el-table-column prop="visitor_phone" label="联系电话" width="130" />
            <el-table-column label="访问房屋" width="160">
              <template #default="{ row }">
                {{ row.building_name }} {{ row.room_number }}
              </template>
            </el-table-column>
            <el-table-column label="有效期" width="280">
              <template #default="{ row }">
                <div>{{ row.valid_from }}</div>
                <div style="color: #909399;">至 {{ row.valid_to }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="auth_code" label="授权码" width="140">
              <template #default="{ row }">
                <el-tag type="primary" effect="plain" copyable size="small">{{ row.auth_code }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="temperature" label="登记体温" width="100">
              <template #default="{ row }">
                <span v-if="row.temperature" :style="{ color: row.temperature > 37.3 ? '#f56c6c' : '#67c23a' }">
                  {{ row.temperature }}℃
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">
                  {{ statusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" link @click="showQr(row)">
                  二维码
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <el-empty v-if="!loading && visitors.length === 0" description="暂无访客记录" />
        </el-card>
      </el-col>
    </el-row>
    
    <el-dialog v-model="qrDialogVisible" title="访客二维码" width="400px">
      <div class="qr-container" v-if="currentVisitor">
        <div class="qr-code">
          <el-icon size="160"><QrCode /></el-icon>
        </div>
        <div class="qr-info">
          <div class="qr-title">{{ currentVisitor.visitor_name }} 的访问凭证</div>
          <div class="qr-code-text">授权码：{{ currentVisitor.auth_code }}</div>
          <div class="qr-valid">有效期：{{ currentVisitor.valid_from }} 至 {{ currentVisitor.valid_to }}</div>
          <div class="qr-areas">通行区域：{{ currentVisitor.access_areas }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '../store/user'
import { getVisitors } from '../api'

const userStore = useUserStore()

const loading = ref(false)
const visitors = ref([])
const qrDialogVisible = ref(false)
const currentVisitor = ref(null)

const stats = reactive({
  total: 0,
  active: 0,
  overdue: 0
})

function statusType(status) {
  const map = {
    active: 'warning',
    checked_in: 'success',
    completed: 'info',
    overdue: 'danger',
    expired: 'info'
  }
  return map[status] || 'info'
}

function statusText(status) {
  const map = {
    active: '待登记',
    checked_in: '已登记',
    completed: '已离开',
    overdue: '已过期',
    expired: '已过期'
  }
  return map[status] || status
}

async function loadVisitors() {
  loading.value = true
  try {
    const res = await getVisitors({ host_user_id: userStore.userId })
    visitors.value = res.data
    
    stats.total = res.data.length
    stats.active = res.data.filter(v => ['active', 'checked_in'].includes(v.status)).length
    stats.overdue = res.data.filter(v => v.status === 'overdue').length
  } finally {
    loading.value = false
  }
}

function showQr(row) {
  currentVisitor.value = row
  qrDialogVisible.value = true
}

onMounted(() => {
  loadVisitors()
})
</script>

<style scoped>
.profile-visitors-page {
  padding: 0;
}

.stats-card, .table-card {
  border: none;
  border-radius: 12px;
}

.stat-row {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 5px;
}

.stat-value.blue { color: #409eff; }
.stat-value.green { color: #67c23a; }
.stat-value.orange { color: #e6a23c; }

.stat-label {
  font-size: 13px;
  color: #909399;
}

.qr-container {
  text-align: center;
}

.qr-code {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.qr-info {
  text-align: left;
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
}

.qr-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.qr-code-text, .qr-valid, .qr-areas {
  font-size: 13px;
  color: #606266;
  margin-bottom: 5px;
}
</style>
