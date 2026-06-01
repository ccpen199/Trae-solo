<template>
  <div class="page-container">
    <h2 style="margin-bottom: 20px">经费审批</h2>
    <div class="card">
      <el-table :data="applications" style="width: 100%">
        <el-table-column prop="title" label="申请标题" />
        <el-table-column prop="club_name" label="所属社团" />
        <el-table-column prop="activity_title" label="关联活动" />
        <el-table-column prop="amount" label="申请金额" />
        <el-table-column prop="purpose" label="用途" show-overflow-tooltip />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" />
        <el-table-column label="操作" width="250">
          <template #default="{ row }">
            <el-button type="success" link size="small" @click="approveApplication(row, 'approved')" v-if="row.status === 'pending'">
              通过
            </el-button>
            <el-button type="danger" link size="small" @click="rejectApplication(row)" v-if="row.status === 'pending'">
              驳回
            </el-button>
            <el-button type="primary" link size="small" @click="openReimburseDialog(row)" v-if="row.status === 'approved'">
              报销
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showRejectDialog" title="驳回原因">
      <el-input v-model="rejectNote" type="textarea" :rows="4" placeholder="请输入驳回原因" />
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReimburseDialog" title="报销确认">
      <p style="margin-bottom: 15px">申请标题：{{ currentApplication?.title }}</p>
      <p style="margin-bottom: 15px">申请金额：¥{{ currentApplication?.amount }}</p>
      <el-form label-width="80px">
        <el-form-item label="票据信息">
          <el-input v-model="reimburseForm.receipts" type="textarea" :rows="3" placeholder="请输入票据编号或凭证说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReimburseDialog = false">取消</el-button>
        <el-button type="primary" @click="handleReimburse">确认报销</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { funds, stats } from '@/api'

const applications = ref([])
const showRejectDialog = ref(false)
const showReimburseDialog = ref(false)
const currentApplication = ref(null)
const rejectNote = ref('')
const reimburseForm = ref({ receipts: '' })

const loadData = async () => {
  const res = await stats.fundsOverview()
  const allApps = []
  for (const club of res.data) {
    try {
      const appsRes = await funds.applications(club.id)
      appsRes.data.forEach(a => {
        a.club_name = club.name
        allApps.push(a)
      })
    } catch (e) {
      console.error(e)
    }
  }
  applications.value = allApps.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

const approveApplication = async (row, status) => {
  try {
    await funds.approveApplication(row.id, { status, approval_note: '' })
    ElMessage.success('审批成功')
    loadData()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '操作失败')
  }
}

const rejectApplication = (row) => {
  currentApplication.value = row
  rejectNote.value = ''
  showRejectDialog.value = true
}

const confirmReject = async () => {
  try {
    await funds.approveApplication(currentApplication.value.id, { status: 'rejected', approval_note: rejectNote.value })
    ElMessage.success('已驳回')
    showRejectDialog.value = false
    loadData()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '操作失败')
  }
}

const openReimburseDialog = (row) => {
  currentApplication.value = row
  reimburseForm.value = { receipts: '' }
  showReimburseDialog.value = true
}

const handleReimburse = async () => {
  if (!reimburseForm.value.receipts) {
    ElMessage.warning('请填写票据信息')
    return
  }
  try {
    await funds.reimburse(currentApplication.value.id, reimburseForm.value)
    ElMessage.success('报销完成')
    showReimburseDialog.value = false
    loadData()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '操作失败')
  }
}

const statusType = (status) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger', reimbursed: '' }
  return map[status] || ''
}

const statusText = (status) => {
  const map = { pending: '待审批', approved: '已通过', rejected: '已驳回', reimbursed: '已报销' }
  return map[status] || status
}

onMounted(loadData)
</script>
