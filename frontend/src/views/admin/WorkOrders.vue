<template>
  <AdminLayout>
    <div class="admin-workorders">
      <div class="page-header">
        <h3>工单管理</h3>
        <div class="header-actions">
          <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 150px; margin-right: 12px;" @change="loadData">
            <el-option label="待分配" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已办结" value="completed" />
          </el-select>
          <el-button type="primary" @click="loadData">刷新</el-button>
        </div>
      </div>

      <el-card class="table-card">
        <el-table :data="workOrders" border style="width: 100%">
          <el-table-column prop="work_order_no" label="工单编号" width="160" />
          <el-table-column prop="title" label="诉求标题" min-width="200" />
          <el-table-column prop="type" label="诉求类型" width="120" />
          <el-table-column prop="user_name" label="诉求人" width="100" />
          <el-table-column prop="assigned_department" label="分派部门" width="140" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="提交时间" width="180">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="viewDetail(row)">详情</el-button>
              <el-button v-if="row.status === 'pending'" size="small" type="success" link @click="handleAssign(row)">分派</el-button>
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

      <el-dialog v-model="assignDialogVisible" title="工单分派" width="500px">
        <el-form label-width="100px">
          <el-form-item label="分派部门">
            <el-select v-model="assignForm.department" placeholder="请选择部门" style="width: 100%">
              <el-option label="省民政厅" value="省民政厅" />
              <el-option label="省公安厅" value="省公安厅" />
              <el-option label="省人力资源社会保障厅" value="省人力资源社会保障厅" />
              <el-option label="省卫生健康委" value="省卫生健康委" />
              <el-option label="省市场监管局" value="省市场监管局" />
              <el-option label="省自然资源厅" value="省自然资源厅" />
              <el-option label="省医保局" value="省医保局" />
            </el-select>
          </el-form-item>
          <el-form-item label="经办人">
            <el-input v-model="assignForm.handler" placeholder="请输入经办人姓名" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="assignDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAssign">确定分派</el-button>
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
const workOrders = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const assignDialogVisible = ref(false)
const assignForm = ref({
  id: null,
  department: '',
  handler: ''
})

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待分配',
    processing: '处理中',
    completed: '已办结'
  }
  return map[status] || status
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadData = async () => {
  try {
    const res = await adminApi.getWorkOrders({
      status: filterStatus.value,
      page: page.value,
      pageSize: pageSize.value
    })
    workOrders.value = res.list
    total.value = res.total
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const viewDetail = (row) => {
  ElMessage.info('查看工单详情：' + row.work_order_no)
}

const handleAssign = (row) => {
  assignForm.value = {
    id: row.id,
    department: '',
    handler: ''
  }
  assignDialogVisible.value = true
}

const submitAssign = async () => {
  if (!assignForm.value.department) {
    ElMessage.warning('请选择分派部门')
    return
  }
  try {
    await adminApi.assignWorkOrder(assignForm.value.id, {
      assignedTo: assignForm.value.handler,
      assignedDepartment: assignForm.value.department
    })
    ElMessage.success('分派成功')
    assignDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('分派失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin-workorders .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.admin-workorders .page-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.table-card {
  border-radius: 8px;
}
</style>
