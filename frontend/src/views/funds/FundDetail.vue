<template>
  <div class="page-container">
    <div class="flex-between mb-20">
      <h2>经费管理</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="8">
        <div class="card text-center">
          <div style="font-size: 14px; color: #666; margin-bottom: 10px">账户余额</div>
          <div style="font-size: 32px; font-weight: bold; color: #67C23A">¥{{ fund?.balance || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card text-center">
          <div style="font-size: 14px; color: #666; margin-bottom: 10px">累计收入</div>
          <div style="font-size: 32px; font-weight: bold; color: #409EFF">¥{{ fund?.total_income || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card text-center">
          <div style="font-size: 14px; color: #666; margin-bottom: 10px">累计支出</div>
          <div style="font-size: 32px; font-weight: bold; color: #F56C6C">¥{{ fund?.total_expense || 0 }}</div>
        </div>
      </el-col>
    </el-row>

    <div class="flex-between mb-20">
      <h3>经费申请记录</h3>
      <div>
        <el-button type="warning" @click="showDepositDialog = true" v-if="isAdmin">充值</el-button>
        <el-button type="primary" @click="showApplyDialog = true" v-if="isLeader">申请经费</el-button>
      </div>
    </div>

    <div class="card">
      <el-table :data="applications" style="width: 100%">
        <el-table-column prop="title" label="申请标题" />
        <el-table-column prop="activity_title" label="关联活动" />
        <el-table-column prop="amount" label="申请金额" />
        <el-table-column prop="purpose" label="用途" show-overflow-tooltip />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" v-if="isAdmin">
          <template #default="{ row }">
            <el-button size="small" type="success" link @click="approveApplication(row, 'approved')" v-if="row.status === 'pending'">
              通过
            </el-button>
            <el-button size="small" type="danger" link @click="approveApplication(row, 'rejected')" v-if="row.status === 'pending'">
              驳回
            </el-button>
            <el-button size="small" type="primary" link @click="openReimburseDialog(row)" v-if="row.status === 'approved'">
              报销
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showApplyDialog" title="申请经费" width="500px">
      <el-form :model="applyForm" label-width="100px">
        <el-form-item label="申请标题">
          <el-input v-model="applyForm.title" />
        </el-form-item>
        <el-form-item label="申请金额">
          <el-input-number v-model="applyForm.amount" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="用途说明">
          <el-input v-model="applyForm.purpose" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApplyDialog = false">取消</el-button>
        <el-button type="primary" @click="handleApply">提交申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDepositDialog" title="经费充值" width="400px">
      <el-form :model="depositForm" label-width="80px">
        <el-form-item label="充值金额">
          <el-input-number v-model="depositForm.amount" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDepositDialog = false">取消</el-button>
        <el-button type="primary" @click="handleDeposit">确认充值</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReimburseDialog" title="报销确认" width="500px">
      <p style="margin-bottom: 15px">申请标题：{{ currentApplication?.title }}</p>
      <p style="margin-bottom: 15px">申请金额：¥{{ currentApplication?.amount }}</p>
      <el-form label-width="80px">
        <el-form-item label="票据信息">
          <el-input v-model="reimburseForm.receipts" type="textarea" :rows="3" placeholder="请输入票据编号或上传凭证说明" />
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
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { funds, clubs } from '@/api'
import { useUserStore } from '@/store/user'

const route = useRoute()
const userStore = useUserStore()
const clubId = route.params.clubId

const fund = ref(null)
const applications = ref([])
const myClubs = ref([])
const showApplyDialog = ref(false)
const showDepositDialog = ref(false)
const showReimburseDialog = ref(false)
const currentApplication = ref(null)

const applyForm = ref({ title: '', amount: 0, purpose: '' })
const depositForm = ref({ amount: 0 })
const reimburseForm = ref({ receipts: '' })

const isAdmin = computed(() => userStore.isAdmin)
const isLeader = computed(() => {
  return userStore.isAdmin || myClubs.value.some(c => c.id == clubId && c.member_role === 'leader')
})

const loadFund = async () => {
  const res = await funds.detail(clubId)
  fund.value = res.data
}

const loadApplications = async () => {
  const res = await funds.applications(clubId)
  applications.value = res.data
}

const loadMyClubs = async () => {
  try {
    const res = await clubs.my()
    myClubs.value = res.data
  } catch { }
}

const handleApply = async () => {
  if (!applyForm.value.title || !applyForm.value.amount) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    await funds.createApplication({ club_id: clubId, ...applyForm.value })
    ElMessage.success('申请已提交')
    showApplyDialog.value = false
    applyForm.value = { title: '', amount: 0, purpose: '' }
    loadApplications()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '申请失败')
  }
}

const handleDeposit = async () => {
  if (!depositForm.value.amount) {
    ElMessage.warning('请输入充值金额')
    return
  }
  try {
    await funds.deposit(clubId, depositForm.value)
    ElMessage.success('充值成功')
    showDepositDialog.value = false
    depositForm.value = { amount: 0 }
    loadFund()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '充值失败')
  }
}

const approveApplication = async (row, status) => {
  try {
    await funds.approveApplication(row.id, { status, approval_note: '' })
    ElMessage.success('操作成功')
    loadApplications()
    loadFund()
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
    loadApplications()
    loadFund()
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

onMounted(() => {
  loadFund()
  loadApplications()
  loadMyClubs()
})
</script>
