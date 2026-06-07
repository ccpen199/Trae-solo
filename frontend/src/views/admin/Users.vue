<template>
  <div class="users-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
        </div>
      </template>
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="角色">
          <el-select v-model="queryForm.role" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="货主" value="shipper" />
            <el-option label="司机" value="driver" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchUsers">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="users" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="real_name" label="真实姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleTag(row.role)">{{ getRoleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="verification_status" label="认证状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getVerifyTag(row.verification_status)">
              {{ getVerifyText(row.verification_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="账户状态" width="100">
          <template #default="{ row }">
            <el-tag :type="(row.account_status || row.status) === 'active' ? 'success' : 'danger'">
              {{ (row.account_status || row.status) === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.verification_status === 'pending'"
              type="success"
              size="small"
              :loading="verifyingId === row.id"
              @click="handleVerify(row, 'approved')"
            >
              通过认证
            </el-button>
            <el-button
              v-if="row.verification_status === 'pending'"
              type="danger"
              size="small"
              :loading="verifyingId === row.id"
              @click="handleVerify(row, 'rejected')"
            >
              拒绝认证
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
        @size-change="fetchUsers"
        @current-change="fetchUsers"
        class="pagination"
      />
    </el-card>

    <el-dialog v-model="rejectDialogVisible" title="拒绝认证" width="420px">
      <el-form :model="rejectForm" :rules="rejectRules" ref="rejectFormRef" label-width="100px">
        <el-form-item label="用户名">
          <span>{{ rejectForm.username }}</span>
        </el-form-item>
        <el-form-item label="拒绝原因" prop="reason">
          <el-input v-model="rejectForm.reason" type="textarea" :rows="4" placeholder="请输入拒绝原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="verifyLoading" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="用户详情" width="520px">
      <el-descriptions :column="2" border v-if="currentUser">
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ currentUser.real_name }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentUser.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ getRoleText(currentUser.role) }}</el-descriptions-item>
        <el-descriptions-item label="认证状态">{{ getVerifyText(currentUser.verification_status) }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ currentUser.id_card || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ currentUser.created_at }}</el-descriptions-item>
        <el-descriptions-item label="认证资料" v-if="currentUser.cert_data" :span="2">
          <pre>{{ JSON.stringify(currentUser.cert_data, null, 2) }}</pre>
        </el-descriptions-item>
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
const users = ref([])
const total = ref(0)
const verifyingId = ref(null)
const verifyLoading = ref(false)
const currentUser = ref(null)

const queryForm = reactive({
  role: '',
  status: '',
  page: 1,
  page_size: 20
})

const rejectDialogVisible = ref(false)
const rejectFormRef = ref(null)
const rejectForm = reactive({
  id: null,
  username: '',
  reason: ''
})

const rejectRules = {
  reason: [{ required: true, message: '请输入拒绝原因', trigger: 'blur' }]
}

const detailDialogVisible = ref(false)

const roleMap = {
  shipper: { text: '货主', tag: 'primary' },
  driver: { text: '司机', tag: 'success' },
  admin: { text: '管理员', tag: 'warning' }
}

const verifyMap = {
  pending: { text: '待审核', tag: 'warning' },
  approved: { text: '已通过', tag: 'success' },
  rejected: { text: '已拒绝', tag: 'danger' },
  unverified: { text: '未认证', tag: 'info' }
}

function getRoleText(role) {
  return roleMap[role]?.text || role
}

function getRoleTag(role) {
  return roleMap[role]?.tag || 'info'
}

function getVerifyText(status) {
  return verifyMap[status]?.text || status
}

function getVerifyTag(status) {
  return verifyMap[status]?.tag || 'info'
}

async function fetchUsers() {
  loading.value = true
  try {
    const params = { ...queryForm }
    if (!params.role) delete params.role
    if (!params.status) delete params.status
    const res = await adminApi.getUsers(params)
    if (res.data?.list) {
      users.value = res.data.list
      total.value = res.data.total || 0
    } else {
      users.value = res.data || []
      total.value = res.data?.length || 0
    }
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  queryForm.role = ''
  queryForm.status = ''
  queryForm.page = 1
  fetchUsers()
}

async function handleVerify(row, status) {
  if (status === 'rejected') {
    rejectForm.id = row.id
    rejectForm.username = row.username
    rejectForm.reason = ''
    rejectDialogVisible.value = true
  } else {
    verifyingId.value = row.id
    try {
      await adminApi.verifyUser(row.id, { status: 'approved' })
      ElMessage.success('认证已通过')
      fetchUsers()
    } finally {
      verifyingId.value = null
    }
  }
}

async function confirmReject() {
  await rejectFormRef.value.validate(async (valid) => {
    if (!valid) return
    verifyLoading.value = true
    try {
      await adminApi.verifyUser(rejectForm.id, { status: 'rejected', reason: rejectForm.reason })
      ElMessage.success('已拒绝认证')
      rejectDialogVisible.value = false
      fetchUsers()
    } finally {
      verifyLoading.value = false
    }
  })
}

function viewDetail(row) {
  currentUser.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.users-page {
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
pre {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
}
</style>
