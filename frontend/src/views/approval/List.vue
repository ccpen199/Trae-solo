<template>
  <div class="approval-list-container">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>审批列表</span>
          <router-link to="/approval/submit">
            <el-button type="primary">
              <el-icon><Plus /></el-icon>
              提交审批
            </el-button>
          </router-link>
        </div>
      </template>
      
      <el-form :model="searchForm" inline style="margin-bottom: 20px;">
        <el-form-item label="审批状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 150px;">
            <el-option label="审批中" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchApprovals" :loading="loading">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="approvalList" v-loading="loading" style="width: 100%;" stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="teacher_name" label="教师姓名" width="120" />
        <el-table-column prop="department_name" label="部门" width="120" />
        <el-table-column prop="type_label" label="审批类型" width="120" />
        <el-table-column prop="progress" label="审批进度" width="200">
          <template #default="{ row }">
            <el-progress 
              :percentage="(row.current_step / row.total_steps) * 100" 
              :format="() => `${row.current_step}/${row.total_steps} 步`"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status_label" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status_label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expect_regular_date" label="预计转正日期" width="130">
          <template #default="{ row }">
            {{ row.expect_regular_date || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <router-link :to="`/approval/detail/${row.id}`">
              <el-button type="primary" link size="small">查看详情</el-button>
            </router-link>
            <el-button 
              v-if="row.status === 'pending'" 
              type="success" 
              link 
              size="small"
              @click="openProcessDialog(row, 'approve')"
            >
              通过
            </el-button>
            <el-button 
              v-if="row.status === 'pending'" 
              type="danger" 
              link 
              size="small"
              @click="openProcessDialog(row, 'reject')"
            >
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="searchApprovals"
        @current-change="searchApprovals"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
    
    <el-dialog
      v-model="processDialogVisible"
      :title="processAction === 'approve' ? '通过审批' : '驳回审批'"
      width="500px"
    >
      <el-descriptions :column="1" border size="small" style="margin-bottom: 20px;">
        <el-descriptions-item label="教师姓名">{{ currentApproval?.teacher_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ currentApproval?.department_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="当前步骤">
          <el-tag type="warning">
            第 {{ currentApproval?.current_step || 1 }} 步 / 共 {{ currentApproval?.total_steps || 3 }} 步
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      
      <el-form :model="processForm" label-width="100px">
        <el-form-item label="审批人">
          <el-input v-model="processForm.approver" placeholder="请输入审批人姓名" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="processForm.department" placeholder="请输入审批部门" />
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input
            v-model="processForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入审批意见（选填）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button :type="processAction === 'approve' ? 'primary' : 'danger'" @click="processApproval" :loading="processing">
          {{ processAction === 'approve' ? '确认通过' : '确认驳回' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const route = useRoute()

const loading = ref(false)
const processing = ref(false)

const approvalList = ref([])
const processDialogVisible = ref(false)
const currentApproval = ref(null)
const processAction = ref('approve')

const searchForm = reactive({
  status: ''
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const processForm = reactive({
  approver: '',
  department: '',
  comment: ''
})

const getStatusType = (status) => {
  const map = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger'
  }
  return map[status] || 'info'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const searchApprovals = async () => {
  loading.value = true
  
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.page_size
    }
    
    if (searchForm.status) params.status = searchForm.status
    
    const res = await api.get('/approvals', { params })
    
    if (res.success) {
      approvalList.value = res.data.list || []
      pagination.total = res.data.pagination?.total || 0
    }
  } catch (error) {
    console.error('查询审批列表失败:', error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.status = ''
  pagination.page = 1
  searchApprovals()
}

const openProcessDialog = (row, action) => {
  currentApproval.value = row
  processAction.value = action
  processForm.approver = ''
  processForm.department = ''
  processForm.comment = ''
  processDialogVisible.value = true
}

const processApproval = async () => {
  if (!currentApproval.value?.id) {
    ElMessage.error('审批信息不完整')
    return
  }
  
  processing.value = true
  
  try {
    const res = await api.post(`/approvals/${currentApproval.value.id}/process`, {
      action: processAction.value,
      approver: processForm.approver.trim() || '系统管理员',
      department: processForm.department.trim() || '管理部门',
      comment: processForm.comment || undefined
    })
    
    if (res.success) {
      ElMessage.success(res.message || '审批操作成功')
      processDialogVisible.value = false
      searchApprovals()
    }
  } catch (error) {
    console.error('处理审批失败:', error)
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  searchApprovals()
})
</script>

<style scoped>
.approval-list-container {
  width: 100%;
}
</style>
