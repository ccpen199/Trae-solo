<template>
  <AdminLayout>
    <div class="admin-applications">
      <div class="page-header">
        <h3>办件管理</h3>
        <div class="header-actions">
          <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 150px; margin-right: 12px;" @change="loadData">
            <el-option label="待处理" value="pending" />
            <el-option label="办理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已撤销" value="cancelled" />
          </el-select>
          <el-button type="primary" @click="loadData">刷新</el-button>
        </div>
      </div>

      <el-card class="table-card">
        <el-table :data="applications" border style="width: 100%">
          <el-table-column prop="application_no" label="申请编号" width="180" />
          <el-table-column prop="service_name" label="服务事项" min-width="180" />
          <el-table-column prop="applicant_name" label="申请人" width="120" />
          <el-table-column prop="department" label="办理部门" width="140" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="current_step" label="当前步骤" width="100">
            <template #default="{ row }">第{{ row.current_step }}步</template>
          </el-table-column>
          <el-table-column prop="created_at" label="提交时间" width="180">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="viewDetail(row)">详情</el-button>
              <el-button v-if="row.status === 'pending'" size="small" type="success" link @click="handleProcess(row)">受理</el-button>
              <el-button v-if="row.status === 'processing'" size="small" type="warning" link @click="handleComplete(row)">办结</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          style="margin-top: 20px; justify-content: flex-end;"
          @current-change="loadData"
          @size-change="loadData"
        />
      </el-card>

      <el-dialog v-model="processDialogVisible" title="办理操作" width="500px">
        <el-form label-width="100px">
          <el-form-item label="办理意见">
            <el-input v-model="processForm.remark" type="textarea" :rows="4" placeholder="请输入办理意见" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="processDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProcess">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api'

const filterStatus = ref('')
const applications = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const processDialogVisible = ref(false)
const processForm = ref({
  id: null,
  remark: '',
  action: ''
})

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待处理',
    processing: '办理中',
    completed: '已完成',
    cancelled: '已撤销'
  }
  return map[status] || status
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadData = async () => {
  try {
    const res = await adminApi.getApplications({
      status: filterStatus.value,
      page: page.value,
      pageSize: pageSize.value
    })
    applications.value = res.list
    total.value = res.total
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const viewDetail = (row) => {
  ElMessage.info('查看详情：' + row.application_no)
}

const handleProcess = (row) => {
  processForm.value = {
    id: row.id,
    remark: '',
    action: 'accept'
  }
  processDialogVisible.value = true
}

const handleComplete = (row) => {
  processForm.value = {
    id: row.id,
    remark: '',
    action: 'complete'
  }
  processDialogVisible.value = true
}

const submitProcess = async () => {
  try {
    const status = processForm.value.action === 'complete' ? 'completed' : 'processing'
    await adminApi.processApplication(processForm.value.id, {
      status,
      remark: processForm.value.remark,
      handler: '系统管理员'
    })
    ElMessage.success('操作成功')
    processDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin-applications .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.admin-applications .page-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.table-card {
  border-radius: 8px;
}
</style>
