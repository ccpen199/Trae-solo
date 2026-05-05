<template>
  <div class="user-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" size="small" @click="openDialog">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="用户名" clearable @keyup.enter="loadUsers" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadUsers">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="users" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="small">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="editUser(scope.row)">
              编辑
            </el-button>
            <el-button 
              :type="scope.row.status === 1 ? 'warning' : 'success'" 
              link 
              size="small"
              @click="toggleStatus(scope.row)"
            >
              {{ scope.row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button 
              type="danger" 
              link 
              size="small"
              @click="deleteUser(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadUsers"
        @current-change="loadUsers"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
    
    <el-dialog 
      v-model="dialogVisible" 
      :title="editingUser ? '编辑用户' : '新增用户'"
      width="500px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="!!editingUser" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password
          />
          <span v-if="editingUser" style="color: #909399; font-size: 12px;">不修改请留空</span>
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" prop="roleCode">
          <el-select v-model="form.roleCode" placeholder="请选择角色">
            <el-option 
              v-for="role in allRoles" 
              :key="role.id" 
              :label="role.roleName" 
              :value="role.roleCode" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser as deleteUserApi, 
  updateUserStatus,
  getAllRoles 
} from '@/api/user'

const loading = ref(false)
const users = ref([])
const allRoles = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const searchForm = reactive({
  username: '',
  status: null
})

const dialogVisible = ref(false)
const editingUser = ref(null)
const formRef = ref(null)
const form = reactive({
  id: null,
  username: '',
  password: '',
  nickname: '',
  email: '',
  roleCode: 'USER',
  status: 1
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  roleCode: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const loadAllRoles = async () => {
  try {
    const res = await getAllRoles()
    allRoles.value = res.data || []
  } catch (error) {
    console.error('加载角色列表失败:', error)
  }
}

const loadUsers = async () => {
  loading.value = true
  try {
    const res = await getUsers({
      current: currentPage.value,
      size: pageSize.value,
      username: searchForm.username || undefined,
      status: searchForm.status !== null ? searchForm.status : undefined
    })
    users.value = res.data?.records || res.data || []
    total.value = res.data?.total || users.value.length
  } catch (error) {
    console.error('加载用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.username = ''
  searchForm.status = null
  currentPage.value = 1
  loadUsers()
}

const openDialog = (user = null) => {
  editingUser.value = user
  if (user) {
    form.id = user.id
    form.username = user.username
    form.password = ''
    form.nickname = user.nickname || ''
    form.email = user.email || ''
    form.roleCode = 'USER'
    form.status = user.status
  } else {
    form.id = null
    form.username = ''
    form.password = ''
    form.nickname = ''
    form.email = ''
    form.roleCode = 'USER'
    form.status = 1
  }
  dialogVisible.value = true
}

const editUser = (user) => {
  openDialog(user)
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  try {
    if (editingUser.value) {
      const updateData = { nickname: form.nickname, email: form.email, status: form.status }
      if (form.password) {
        updateData.password = form.password
      }
      await updateUser(form.id, updateData)
      ElMessage.success('更新成功')
    } else {
      await createUser({
        username: form.username,
        password: form.password,
        nickname: form.nickname,
        email: form.email,
        status: form.status
      }, form.roleCode)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadUsers()
  } catch (error) {
    console.error('提交失败:', error)
  }
}

const toggleStatus = async (user) => {
  const newStatus = user.status === 1 ? 0 : 1
  try {
    await updateUserStatus(user.id, newStatus)
    ElMessage.success(newStatus === 1 ? '已启用' : '已禁用')
    loadUsers()
  } catch (error) {
    console.error('更新状态失败:', error)
  }
}

const deleteUser = async (user) => {
  try {
    await ElMessageBox.confirm('确定要删除这个用户吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteUserApi(user.id)
    ElMessage.success('删除成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

onMounted(() => {
  loadAllRoles()
  loadUsers()
})
</script>

<style scoped>
.user-manage {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>
