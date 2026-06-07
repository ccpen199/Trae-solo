<template>
  <div class="alerts-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>异常预警</span>
        </div>
      </template>
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="处理状态">
          <el-select v-model="queryForm.handled" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="未处理" :value="0" />
            <el-option label="已处理" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchAlerts">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="alerts" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="alert_type" label="预警类型" width="140">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.alert_type)">{{ getTypeText(row.alert_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="预警级别" width="120">
          <template #default="{ row }">
            <el-tag :type="getLevelTag(row.level)" effect="dark">{{ getLevelText(row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="waybill_no" label="所属运单" width="200" />
        <el-table-column prop="message" label="预警内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="created_at" label="预警时间" width="180" />
        <el-table-column prop="handled" label="处理状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.handled ? 'success' : 'warning'">
              {{ row.handled ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handled_at" label="处理时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.handled"
              type="success"
              size="small"
              :loading="handlingId === row.id"
              @click="openHandleDialog(row)"
            >
              标记已处理
            </el-button>
            <el-button type="primary" size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="queryForm.page"
        v-model:page-size="queryForm.page_size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchAlerts"
        @current-change="fetchAlerts"
        class="pagination"
      />
    </el-card>

    <el-dialog v-model="handleDialogVisible" title="标记已处理" width="420px">
      <el-form :model="handleForm" :rules="handleRules" ref="handleFormRef" label-width="100px">
        <el-form-item label="预警类型">
          <span>{{ handleForm.alert_type }}</span>
        </el-form-item>
        <el-form-item label="预警内容">
          <span>{{ handleForm.message }}</span>
        </el-form-item>
        <el-form-item label="处理备注" prop="handle_remark">
          <el-input v-model="handleForm.handle_remark" type="textarea" :rows="4" placeholder="请输入处理备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="handleLoading" @click="confirmHandle">确认处理</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="预警详情" width="520px">
      <el-descriptions :column="2" border v-if="currentAlert">
        <el-descriptions-item label="预警ID">{{ currentAlert.id }}</el-descriptions-item>
        <el-descriptions-item label="预警类型">{{ getTypeText(currentAlert.alert_type) }}</el-descriptions-item>
        <el-descriptions-item label="预警级别">
          <el-tag :type="getLevelTag(currentAlert.level)" effect="dark">{{ getLevelText(currentAlert.level) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所属运单">{{ currentAlert.waybill_no }}</el-descriptions-item>
        <el-descriptions-item label="预警内容" :span="2">{{ currentAlert.message }}</el-descriptions-item>
        <el-descriptions-item label="预警时间">{{ currentAlert.created_at }}</el-descriptions-item>
        <el-descriptions-item label="处理状态">
          <el-tag :type="currentAlert.handled ? 'success' : 'warning'">
            {{ currentAlert.handled ? '已处理' : '未处理' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentAlert.handled_by || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ currentAlert.handled_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理备注" :span="2">{{ currentAlert.handle_remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '../../api'

const loading = ref(false)
const alerts = ref([])
const total = ref(0)
const handlingId = ref(null)
const handleLoading = ref(false)
const currentAlert = ref(null)

const queryForm = reactive({
  handled: '',
  page: 1,
  page_size: 20
})

const handleDialogVisible = ref(false)
const handleFormRef = ref(null)
const handleForm = reactive({
  id: null,
  alert_type: '',
  message: '',
  handle_remark: ''
})

const handleRules = {
  handle_remark: [{ required: true, message: '请输入处理备注', trigger: 'blur' }]
}

const detailDialogVisible = ref(false)

const typeMap = {
  timeout: { text: '超时预警', tag: 'danger' },
  route: { text: '路线偏离', tag: 'warning' },
  temperature: { text: '温度异常', tag: 'info' },
  damage: { text: '货物损坏', tag: 'danger' },
  accident: { text: '交通事故', tag: 'danger' },
  other: { text: '其他异常', tag: 'warning' }
}

const levelMap = {
  low: { text: '低级', tag: 'info' },
  medium: { text: '中级', tag: 'warning' },
  high: { text: '高级', tag: 'danger' },
  critical: { text: '紧急', tag: 'danger' }
}

function getTypeText(type) {
  return typeMap[type]?.text || type
}

function getTypeTag(type) {
  return typeMap[type]?.tag || 'info'
}

function getLevelText(level) {
  return levelMap[level]?.text || level
}

function getLevelTag(level) {
  return levelMap[level]?.tag || 'info'
}

async function fetchAlerts() {
  loading.value = true
  try {
    const params = { ...queryForm }
    if (params.handled === '') delete params.handled
    const res = await adminApi.getAlerts(params)
    if (res.data?.list) {
      alerts.value = res.data.list
      total.value = res.data.total || 0
    } else {
      alerts.value = res.data || []
      total.value = res.data?.length || 0
    }
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  queryForm.handled = ''
  queryForm.page = 1
  fetchAlerts()
}

function openHandleDialog(row) {
  handleForm.id = row.id
  handleForm.alert_type = getTypeText(row.alert_type)
  handleForm.message = row.message
  handleForm.handle_remark = ''
  handleDialogVisible.value = true
}

async function confirmHandle() {
  await handleFormRef.value.validate(async (valid) => {
    if (!valid) return
    handlingId.value = handleForm.id
    handleLoading.value = true
    try {
      await adminApi.handleAlert(handleForm.id, { remark: handleForm.handle_remark })
      ElMessage.success('处理成功')
      handleDialogVisible.value = false
      fetchAlerts()
    } finally {
      handlingId.value = null
      handleLoading.value = false
    }
  })
}

function viewDetail(row) {
  currentAlert.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
  fetchAlerts()
})
</script>

<style scoped>
.alerts-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.card-header {
  font-weight: 600;
  font-size: 16px;
}
.query-form {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  justify-content: flex-end;
  display: flex;
}
</style>
