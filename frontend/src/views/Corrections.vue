<template>
  <div class="corrections">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>冲正记录</span>
            <el-tag type="info" size="small">仅运营可查看</el-tag>
          </div>
          <div class="header-right">
            <el-select v-model="filterType" @change="handleFilterChange" placeholder="全部类型" clearable style="width: 150px">
              <el-option label="归档" value="archive" />
              <el-option label="撤销/冲正" value="revert" />
              <el-option label="补录" value="supplement" />
              <el-option label="重开" value="reopen" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table 
        :data="corrections" 
        v-loading="loading" 
        style="width: 100%"
        :row-class-name="getRowClassName"
      >
        <el-table-column prop="order_no" label="订单号" width="180">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToOrder(row.main_order_id)">
              {{ row.order_no || '-' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="correction_type" label="冲正类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getCorrectionTypeColor(row.correction_type)">
              {{ getCorrectionTypeLabel(row.correction_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.reason || '无' }}
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="操作人" width="120">
          <template #default="{ row }">
            <div class="operator-info">
              <span>{{ row.operator_name || '-' }}</span>
              <el-tag v-if="row.operator_role" size="small" :type="getRoleColor(row.operator_role)">
                {{ getRoleLabel(row.operator_role) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="原始订单" width="180" v-if="filterType === 'reopen' || filterType === null">
          <template #default="{ row }">
            <template v-if="row.original_order_id">
              <el-button type="text" link @click="goToOrder(row.original_order_id)">
                查看原订单
              </el-button>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="pagination.total > 0"
        class="pagination"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.page"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
      />
    </el-card>

    <el-dialog
      v-model="detailVisible"
      title="冲正记录详情"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border v-if="currentCorrection">
        <el-descriptions-item label="订单号">
          {{ currentCorrection.order_no || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="冲正类型">
          <el-tag :type="getCorrectionTypeColor(currentCorrection.correction_type)">
            {{ getCorrectionTypeLabel(currentCorrection.correction_type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作人">
          {{ currentCorrection.operator_name || '-' }}
          <el-tag v-if="currentCorrection.operator_role" size="small" style="margin-left: 8px">
            {{ getRoleLabel(currentCorrection.operator_role) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作时间">
          {{ formatTime(currentCorrection.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="原因" :span="2">
          {{ currentCorrection.reason || '无' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider v-if="currentCorrection?.before_snapshot" />
      
      <div v-if="currentCorrection?.before_snapshot">
        <h4 style="margin-bottom: 12px; color: #606266;">变更前快照</h4>
        <el-card shadow="never" style="background: #f5f7fa;">
          <pre class="snapshot-json">{{ formatSnapshot(currentCorrection.before_snapshot) }}</pre>
        </el-card>
      </div>

      <el-divider v-if="currentCorrection?.after_snapshot" />
      
      <div v-if="currentCorrection?.after_snapshot">
        <h4 style="margin-bottom: 12px; color: #606266;">变更后快照</h4>
        <el-card shadow="never" style="background: #f5f7fa;">
          <pre class="snapshot-json">{{ formatSnapshot(currentCorrection.after_snapshot) }}</pre>
        </el-card>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button 
          v-if="currentCorrection?.main_order_id"
          type="primary" 
          @click="goToOrder(currentCorrection.main_order_id)"
        >
          查看订单
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ROLES } from '@/utils/constants'
import request from '@/utils/request'

const router = useRouter()

const loading = ref(false)
const filterType = ref(null)
const corrections = ref([])
const detailVisible = ref(false)
const currentCorrection = ref(null)
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

const CORRECTION_TYPES = {
  archive: { label: '归档', color: 'info' },
  revert: { label: '撤销/冲正', color: 'warning' },
  supplement: { label: '补录', color: 'primary' },
  reopen: { label: '重开', color: 'success' }
}

function getCorrectionTypeLabel(type) {
  return CORRECTION_TYPES[type]?.label || type
}

function getCorrectionTypeColor(type) {
  return CORRECTION_TYPES[type]?.color || 'info'
}

function getRoleLabel(role) {
  const labels = {
    [ROLES.CONSUMER]: '消费者',
    [ROLES.DESIGNER]: '设计师',
    [ROLES.OPERATOR]: '运营',
    [ROLES.SALES]: '销售'
  }
  return labels[role] || role
}

function getRoleColor(role) {
  const colors = {
    [ROLES.CONSUMER]: 'info',
    [ROLES.DESIGNER]: 'primary',
    [ROLES.OPERATOR]: 'success',
    [ROLES.SALES]: 'warning'
  }
  return colors[role] || 'info'
}

function getRowClassName({ row }) {
  const classMap = {
    archive: 'row-archive',
    revert: 'row-revert',
    supplement: 'row-supplement',
    reopen: 'row-reopen'
  }
  return classMap[row.correction_type] || ''
}

function formatTime(time) {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 19)
}

function formatSnapshot(snapshot) {
  if (!snapshot) return ''
  try {
    const obj = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot
    return JSON.stringify(obj, null, 2)
  } catch {
    return snapshot
  }
}

async function fetchCorrections() {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }
    if (filterType.value) {
      params.correctionType = filterType.value
    }
    
    const res = await request.get('/archive/corrections', { params })
    if (res.data.success) {
      corrections.value = res.data.data.corrections || []
      pagination.value.total = res.data.data.pagination?.total || 0
    }
  } catch (err) {
    console.error('获取冲正记录失败:', err)
    ElMessage.error('获取冲正记录失败')
  } finally {
    loading.value = false
  }
}

function handleFilterChange() {
  pagination.value.page = 1
  fetchCorrections()
}

function handleSizeChange(size) {
  pagination.value.pageSize = size
  pagination.value.page = 1
  fetchCorrections()
}

function handleCurrentChange(page) {
  pagination.value.page = page
  fetchCorrections()
}

function viewDetail(row) {
  currentCorrection.value = row
  detailVisible.value = true
}

function goToOrder(orderId) {
  detailVisible.value = false
  router.push(`/orders/${orderId}`)
}

onMounted(() => {
  fetchCorrections()
})
</script>

<style scoped>
.corrections {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.operator-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.snapshot-json {
  margin: 0;
  padding: 12px;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
  color: #303133;
}

:deep(.row-archive) {
  background-color: #f4f4f5;
}

:deep(.row-revert) {
  background-color: #fdf6ec;
}

:deep(.row-supplement) {
  background-color: #ecf5ff;
}

:deep(.row-reopen) {
  background-color: #f0f9eb;
}
</style>
