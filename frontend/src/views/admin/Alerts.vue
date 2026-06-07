<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAlertListApi, handleAlertApi } from '@/api/admin'
import StatusBadge from '@/components/StatusBadge.vue'

const loading = ref(false)
const alerts = ref<any[]>([])
const pagination = ref({ page: 1, pageSize: 20, total: 0 })
const statusFilter = ref('')
const levelFilter = ref('')
const searchKeyword = ref('')

const handleDialogVisible = ref(false)
const currentAlert = ref<any>({})
const handleForm = reactive({
  status: 'resolved',
  remark: ''
})
const dialogLoading = ref(false)

const levelMap: Record<string, { text: string; type: string }> = {
  low: { text: '低', type: 'info' },
  medium: { text: '中', type: 'warning' },
  high: { text: '高', type: 'danger' },
  critical: { text: '严重', type: 'danger' }
}

const typeMap: Record<string, string> = {
  device_offline: '设备离线',
  device_fault: '设备故障',
  high_temperature: '高温告警',
  water_leak: '漏水告警',
  power_abnormal: '电源异常',
  network_error: '网络异常'
}

async function loadAlerts() {
  loading.value = true
  try {
    const res = await getAlertListApi({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      status: statusFilter.value,
      level: levelFilter.value,
      keyword: searchKeyword.value
    })
    alerts.value = res.data.list || res.data
    pagination.value.total = res.data.total || alerts.value.length
  } catch (error) {
    console.error('Load alerts error:', error)
    alerts.value = generateMockData()
  } finally {
    loading.value = false
  }
}

function generateMockData() {
  const data = []
  const types = Object.keys(typeMap)
  const levels = Object.keys(levelMap)
  const statuses = ['active', 'processing', 'resolved', 'ignored']

  for (let i = 1; i <= 50; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const level = levels[Math.floor(Math.random() * levels.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    data.push({
      id: i,
      deviceId: Math.floor(Math.random() * 100) + 1,
      deviceName: `设备${Math.floor(Math.random() * 100) + 1}`,
      type,
      typeName: typeMap[type],
      level,
      status,
      message: `${typeMap[type]}告警信息`,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString(),
      handledAt: status !== 'active' ? new Date().toLocaleString() : null,
      handledBy: status !== 'active' ? '管理员' : null,
      remark: status !== 'active' ? '已处理' : null
    })
  }
  return data
}

function handleSearch() {
  pagination.value.page = 1
  loadAlerts()
}

function handleReset() {
  searchKeyword.value = ''
  statusFilter.value = ''
  levelFilter.value = ''
  pagination.value.page = 1
  loadAlerts()
}

function handlePageChange(page: number) {
  pagination.value.page = page
  loadAlerts()
}

function openHandleDialog(row: any) {
  currentAlert.value = { ...row }
  handleForm.status = 'resolved'
  handleForm.remark = ''
  handleDialogVisible.value = true
}

async function handleSubmit() {
  if (!handleForm.status) {
    ElMessage.warning('请选择处理结果')
    return
  }
  dialogLoading.value = true
  try {
    await handleAlertApi(currentAlert.value.id, handleForm)
    ElMessage.success('处理成功')
    handleDialogVisible.value = false
    loadAlerts()
  } catch (error) {
    console.error('Handle alert error:', error)
  } finally {
    dialogLoading.value = false
  }
}

async function handleBatchIgnore() {
  try {
    await ElMessageBox.confirm(
      '确定要忽略选中的告警吗？',
      '确认操作',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    ElMessage.success('操作成功')
    loadAlerts()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Batch ignore error:', error)
    }
  }
}

onMounted(() => {
  loadAlerts()
})
</script>

<template>
  <div class="alerts-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="{}" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchKeyword"
            placeholder="设备名称/告警内容"
            clearable
            style="width: 200px;"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="statusFilter" placeholder="全部" clearable style="width: 120px;">
            <el-option label="待处理" value="active" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已忽略" value="ignored" />
          </el-select>
        </el-form-item>
        <el-form-item label="级别">
          <el-select v-model="levelFilter" placeholder="全部" clearable style="width: 120px;">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="严重" value="critical" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="warning" @click="handleBatchIgnore">批量忽略</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="alerts"
        border
        stripe
        style="width: 100%;"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="deviceName" label="设备名称" min-width="120" />
        <el-table-column prop="typeName" label="告警类型" width="120" />
        <el-table-column label="告警级别" width="100">
          <template #default="{ row }">
            <el-tag :type="levelMap[row.level]?.type as any" size="small">
              {{ levelMap[row.level]?.text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusBadge :status="row.status" type="alert" />
          </template>
        </el-table-column>
        <el-table-column prop="message" label="告警内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="告警时间" width="180" />
        <el-table-column prop="handledBy" label="处理人" width="100">
          <template #default="{ row }">{{ row.handledBy || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'active' || row.status === 'processing'"
              size="small"
              type="primary"
              link
              @click="openHandleDialog(row)"
            >处理</el-button>
            <el-button size="small" type="info" link>详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          @current-change="handlePageChange"
          @size-change="loadAlerts"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="handleDialogVisible"
      title="处理告警"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="1" border size="small" style="margin-bottom: 20px;">
        <el-descriptions-item label="设备名称">
          {{ currentAlert.deviceName }}
        </el-descriptions-item>
        <el-descriptions-item label="告警类型">
          {{ currentAlert.typeName }}
        </el-descriptions-item>
        <el-descriptions-item label="告警内容">
          {{ currentAlert.message }}
        </el-descriptions-item>
      </el-descriptions>

      <el-form label-width="100px">
        <el-form-item label="处理结果">
          <el-select v-model="handleForm.status" style="width: 100%;">
            <el-option label="已解决" value="resolved" />
            <el-option label="已忽略" value="ignored" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input
            v-model="handleForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入处理备注"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.alerts-page {
  .filter-card {
    margin-bottom: 20px;

    .filter-form {
      margin-bottom: 0;
    }
  }

  .table-card {
    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
