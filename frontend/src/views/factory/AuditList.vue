<template>
  <div class="page-container">
    <el-card class="card-container">
      <template #header>
        <div class="card-header">
          <span>内训审核管理</span>
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" style="margin-bottom: 20px">
        <el-form-item label="区域">
          <el-select v-model="searchForm.region" placeholder="全部区域" clearable style="width: 120px">
            <el-option v-for="region in regions" :key="region" :label="region" :value="region" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="经销商/任务名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="region" label="区域" width="100" />
        <el-table-column prop="dealer_name" label="经销商名称" min-width="150" />
        <el-table-column prop="dealer_code" label="经销商代码" width="120" />
        <el-table-column prop="task_name" label="任务名称" min-width="180" />
        <el-table-column prop="task_type" label="任务类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.task_type === 'A' ? 'primary' : 'success'" size="small">
              {{ row.task_type === 'A' ? 'A类' : 'B类' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="required_hours" label="要求课时" width="80">
          <template #default="{ row }">
            {{ row.required_hours }} 小时
          </template>
        </el-table-column>
        <el-table-column prop="actual_hours" label="执行课时" width="80">
          <template #default="{ row }">
            <span :style="{ color: row.actual_hours >= row.required_hours ? '#67c23a' : '#f56c6c' }">
              {{ row.actual_hours }} 小时
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="submission_status" label="提交状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.submission_status === 'submitted' ? 'warning' : 'info'" size="small">
              {{ row.submission_status === 'submitted' ? '已提交' : '进行中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status_text" label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getAuditStatusType(row.status)" size="small">
              {{ row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              查看详情
            </el-button>
            <el-button 
              type="warning" 
              link 
              size="small" 
              @click="handleAudit(row)"
              :disabled="row.status !== 'pending'"
            >
              审核
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog 
      v-model="auditDialogVisible" 
      title="审核处理" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="经销商">
          <el-input :value="currentAudit?.dealer_name" disabled />
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input :value="currentAudit?.task_name" disabled />
        </el-form-item>
        <el-form-item label="执行课时">
          <el-input :value="`${currentAudit?.actual_hours} / ${currentAudit?.required_hours} 小时`" disabled />
        </el-form-item>
        <el-form-item label="审核结果" prop="status">
          <el-radio-group v-model="auditForm.status">
            <el-radio value="approved">通过</el-radio>
            <el-radio value="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input
            v-model="auditForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入审核意见（选填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAudit" :loading="auditing">
          确认审核
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { auditApi, dealersApi } from '@/api'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const regions = ref([])
const auditDialogVisible = ref(false)
const auditing = ref(false)
const currentAudit = ref(null)

const searchForm = reactive({
  region: '',
  status: '',
  keyword: ''
})

const auditForm = reactive({
  status: 'approved',
  comment: ''
})

const getAuditStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || 'info'
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.region) params.region = searchForm.region
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.keyword) params.keyword = searchForm.keyword

    const res = await auditApi.getList(params)
    if (res.data?.success) {
      tableData.value = res.data.data
    }
  } catch (error) {
    console.error('加载审核列表失败:', error)
    ElMessage.error('加载审核列表失败')
  } finally {
    loading.value = false
  }
}

const loadRegions = async () => {
  try {
    const res = await dealersApi.getRegions()
    if (res.data?.success) {
      regions.value = res.data.data
    }
  } catch (error) {
    console.error('加载区域列表失败:', error)
  }
}

const handleSearch = () => {
  loadData()
}

const handleReset = () => {
  searchForm.region = ''
  searchForm.status = ''
  searchForm.keyword = ''
  loadData()
}

const handleView = (row) => {
  router.push(`/factory/audit/detail/${row.id}`)
}

const handleAudit = (row) => {
  if (row.status !== 'pending') {
    ElMessage.warning('该审核已处理')
    return
  }
  currentAudit.value = row
  auditForm.status = 'approved'
  auditForm.comment = ''
  auditDialogVisible.value = true
}

const confirmAudit = async () => {
  try {
    auditing.value = true
    const res = await auditApi.audit(currentAudit.value.id, {
      status: auditForm.status,
      comment: auditForm.comment,
      auditor: '系统管理员'
    })
    if (res.data?.success) {
      ElMessage.success(auditForm.status === 'approved' ? '审核通过' : '已驳回')
      auditDialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.data?.message || '审核失败')
    }
  } catch (error) {
    console.error('审核失败:', error)
    ElMessage.error('审核失败')
  } finally {
    auditing.value = false
  }
}

const handleExport = async () => {
  try {
    const params = {}
    if (searchForm.region) params.region = searchForm.region
    if (searchForm.status) params.status = searchForm.status
    
    const res = await auditApi.getExportData(params)
    if (res.data?.success) {
      ElMessage.success(`导出数据获取成功，共 ${res.data.data.length} 条记录`)
      console.log('导出数据:', res.data.data)
    }
  } catch (error) {
    console.error('导出数据失败:', error)
    ElMessage.error('导出数据失败')
  }
}

onMounted(() => {
  loadData()
  loadRegions()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
