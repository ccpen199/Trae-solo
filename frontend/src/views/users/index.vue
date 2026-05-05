<template>
  <div class="users">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建用户
          </el-button>
        </div>
      </template>

      <el-table :data="userList" v-loading="loading" row-key="id" border>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="email" label="邮箱" width="200">
          <template #default="{ row }">
            {{ row.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="roles" label="角色" min-width="200">
          <template #default="{ row }">
            <el-tag v-for="role in row.roles" :key="role.id" size="small" style="margin-right: 5px">
              {{ role.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isSuperAdmin" label="超级管理员" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isSuperAdmin ? 'danger' : 'info'" size="small">
              {{ row.isSuperAdmin ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link size="small" @click="handleResetPassword(row)">重置密码</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)" :disabled="row.isSuperAdmin">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新建用户'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="isEdit" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleIds" multiple placeholder="请选择角色" style="width: 100%">
            <el-option v-for="role in roleList" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="超管">
          <el-checkbox v-model="form.isSuperAdmin">设置为超级管理员</el-checkbox>
        </el-form-item>
        <el-form-item v-if="isEdit" label="状态">
          <el-radio-group v-model="form.isActive">
            <el-radio :value="true">启用</el-radio>
            <el-radio :value="false">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { request } from '@/utils/request'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const userList = ref<any[]>([])
const roleList = ref<any[]>([])
const formRef = ref<FormInstance>()

const form = reactive({
  id: '',
  username: '',
  password: '',
  nickname: '',
  email: '',
  roleIds: [] as string[],
  isSuperAdmin: false,
  isActive: true
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, message: '用户名长度不能少于2位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

function formatDate(date: string | Date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString()
}

async function loadUsers() {
  loading.value = true
  try {
    userList.value = await request.get('/users?includeInactive=true')
  } finally {
    loading.value = false
  }
}

async function loadRoles() {
  try {
    roleList.value = await request.get('/roles')
  } catch (e) {
    console.log('加载角色失败')
  }
}

function resetForm() {
  form.id = ''
  form.username = ''
  form.password = ''
  form.nickname = ''
  form.email = ''
  form.roleIds = []
  form.isSuperAdmin = false
  form.isActive = true
}

function handleCreate() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  form.id = row.id
  form.username = row.username
  form.nickname = row.nickname || ''
  form.email = row.email || ''
  form.roleIds = row.roles?.map((r: any) => r.id) || []
  form.isSuperAdmin = row.isSuperAdmin
  form.isActive = row.isActive
  dialogVisible.value = true
}

async function handleResetPassword(row: any) {
  const newPassword = '123456'
  await ElMessageBox.confirm(`确定要将用户"${row.nickname || row.username}"的密码重置为"${newPassword}"吗？`, '提示', {
    type: 'warning'
  })
  
  await request.put(`/users/${row.id}/reset-password`, { newPassword })
  ElMessage.success(`密码已重置为: ${newPassword}`)
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定要删除用户"${row.nickname || row.username}"吗？`, '提示', {
    type: 'warning'
  })
  
  await request.delete(`/users/${row.id}`)
  ElMessage.success('删除成功')
  loadUsers()
}

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate()
  
  submitting.value = true
  try {
    const data: any = { ...form }
    if (data.roleIds.length === 0) delete data.roleIds
    
    if (isEdit.value) {
      delete data.username
      delete data.password
      delete data.isSuperAdmin
      await request.put(`/users/${form.id}`, data)
      ElMessage.success('更新成功')
    } else {
      await request.post('/users', data)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadUsers()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadUsers()
  loadRoles()
})
</script>

<style lang="scss" scoped>
.users {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
