<template>
  <div>
    <div class="page-header">
      <div class="page-title">用户管理</div>
      <el-button type="primary" @click="handleAdd">新增用户</el-button>
    </div>

    <div class="card-content">
      <div class="filter-bar">
        <el-input v-model="filters.keyword" placeholder="搜索用户名/昵称" clearable style="width: 200px;" @change="loadData" />
        <el-select v-model="filters.role" placeholder="角色" clearable style="width: 120px;" @change="loadData">
          <el-option label="管理员" value="admin" />
          <el-option label="运营" value="operator" />
          <el-option label="主播" value="anchor" />
          <el-option label="普通用户" value="user" />
          <el-option label="财务" value="finance" />
        </el-select>
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px;" @change="loadData">
          <el-option label="正常" value="active" />
          <el-option label="禁用" value="disabled" />
        </el-select>
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>

      <el-table :data="users" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="roleType(row.role)">{{ roleMap[row.role] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="120">
          <template #default="{ row }">¥{{ row.balance.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="success" @click="handleAdjustBalance(row)">调整余额</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          @current-change="loadData"
          @size-change="loadData"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username" v-if="!isEdit">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" style="width: 100%;">
            <el-option label="管理员" value="admin" />
            <el-option label="运营" value="operator" />
            <el-option label="主播" value="anchor" />
            <el-option label="普通用户" value="user" />
            <el-option label="财务" value="finance" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status" v-if="isEdit">
          <el-select v-model="form.status">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="余额" v-if="isEdit">
          <el-input-number v-model="form.balance" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="balanceDialogVisible" title="调整余额" width="400px">
      <el-form :model="balanceForm" label-width="100px">
        <el-form-item label="当前余额">
          <span>¥{{ currentUser?.balance?.toFixed(2) || '0.00' }}</span>
        </el-form-item>
        <el-form-item label="调整金额">
          <el-input-number v-model="balanceForm.amount" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="balanceForm.reason" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="balanceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdjustBalance" :loading="adjusting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const users = ref([])
const loading = ref(false)
const saving = ref(false)
const adjusting = ref(false)
const dialogVisible = ref(false)
const balanceDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentUser = ref(null)

const filters = reactive({ keyword: '', role: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const form = reactive({
  id: null, username: '', password: '', nickname: '', role: 'user', status: 'active', balance: 0
})

const balanceForm = reactive({ amount: 0, reason: '' })

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const roleMap = { admin: '管理员', operator: '运营', anchor: '主播', user: '普通用户', finance: '财务' }
const roleType = r => r === 'admin' ? 'danger' : r === 'operator' ? 'warning' : r === 'anchor' ? 'success' : 'info'

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/users', { params: { ...filters, ...pagination } })
    users.value = data.items
    pagination.total = data.total
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  isEdit.value = false
  Object.assign(form, { id: null, username: '', password: '', nickname: '', role: 'user', status: 'active', balance: 0 })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

async function handleSave() {
  try {
    await formRef.value.validate()
    saving.value = true
    if (isEdit.value) {
      await request.put(`/users/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await request.post('/users', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

function handleAdjustBalance(row) {
  currentUser.value = row
  balanceForm.amount = 0
  balanceForm.reason = ''
  balanceDialogVisible.value = true
}

async function submitAdjustBalance() {
  try {
    adjusting.value = true
    await request.patch(`/users/${currentUser.value.id}/balance`, balanceForm)
    ElMessage.success('调整成功')
    balanceDialogVisible.value = false
    loadData()
  } finally {
    adjusting.value = false
  }
}

onMounted(loadData)
</script>
