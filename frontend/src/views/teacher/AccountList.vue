<template>
  <div class="account-list-container">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>教师卡账号管理</span>
        </div>
      </template>
      
      <el-form :model="searchForm" inline style="margin-bottom: 20px;">
        <el-form-item label="教师姓名">
          <el-input v-model="searchForm.teacher_name" placeholder="请输入教师姓名" clearable @keyup.enter="searchAccounts" />
        </el-form-item>
        <el-form-item label="教师卡账号">
          <el-input v-model="searchForm.card_account" placeholder="请输入教师卡账号" clearable @keyup.enter="searchAccounts" />
        </el-form-item>
        <el-form-item label="账号状态">
          <el-select v-model="searchForm.is_active" placeholder="请选择状态" clearable style="width: 120px;">
            <el-option label="已启用" :value="true" />
            <el-option label="已禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchAccounts" :loading="loading">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="accountList" v-loading="loading" style="width: 100%;" stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="teacher_name" label="教师姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="70" />
        <el-table-column prop="department_name" label="部门" width="120" />
        <el-table-column prop="position" label="岗位" width="100" />
        <el-table-column prop="teacher_status_label" label="教师状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getTeacherStatusType(row.teacher_status)">
              {{ row.teacher_status_label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="card_account" label="教师卡账号" width="120">
          <template #default="{ row }">
            <el-tag type="info">{{ row.card_account }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="账号状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'">
              {{ row.is_active ? '已启用' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login" label="最后登录" width="180">
          <template #default="{ row }">
            {{ row.last_login ? formatDate(row.last_login) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditDialog(row)">
              修改账号
            </el-button>
            <el-button type="warning" link size="small" @click="openResetPasswordDialog(row)">
              重置密码
            </el-button>
            <el-button 
              :type="row.is_active ? 'danger' : 'success'" 
              link 
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.is_active ? '禁用' : '启用' }}
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
        @size-change="searchAccounts"
        @current-change="searchAccounts"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
    
    <el-dialog
      v-model="editDialogVisible"
      title="修改教师卡账号"
      width="450px"
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="教师姓名">
          <el-input :value="currentAccount?.teacher_name" disabled />
        </el-form-item>
        <el-form-item label="教师卡账号">
          <el-input v-model="editForm.card_account" placeholder="请输入教师卡账号" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateAccount" :loading="updating">
          确定
        </el-button>
      </template>
    </el-dialog>
    
    <el-dialog
      v-model="resetPasswordDialogVisible"
      title="重置密码"
      width="450px"
    >
      <el-form :model="resetPasswordForm" label-width="100px">
        <el-form-item label="教师姓名">
          <el-input :value="currentAccount?.teacher_name" disabled />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input 
            v-model="resetPasswordForm.new_password" 
            type="password"
            placeholder="留空则重置为默认密码 123456"
            show-password
          />
          <div style="color: #909399; font-size: 12px; margin-top: 5px;">
            留空则重置为默认密码：123456
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="resetPassword" :loading="resetting">
          确定重置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const loading = ref(false)
const updating = ref(false)
const resetting = ref(false)

const accountList = ref([])
const currentAccount = ref(null)

const editDialogVisible = ref(false)
const resetPasswordDialogVisible = ref(false)

const searchForm = reactive({
  teacher_name: '',
  card_account: '',
  is_active: null
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const editForm = reactive({
  card_account: ''
})

const resetPasswordForm = reactive({
  new_password: ''
})

const getTeacherStatusType = (status) => {
  const map = {
    'probation': 'warning',
    'regular': 'success',
    'resigned': 'info',
    'fired': 'danger'
  }
  return map[status] || 'info'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const searchAccounts = async () => {
  loading.value = true
  
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.page_size
    }
    
    if (searchForm.teacher_name) params.teacher_name = searchForm.teacher_name.trim()
    if (searchForm.card_account) params.card_account = searchForm.card_account.trim()
    if (searchForm.is_active !== null) params.is_active = searchForm.is_active
    
    const res = await api.get('/teachers/accounts/list', { params })
    
    if (res.success) {
      accountList.value = res.data.list || []
      pagination.total = res.data.pagination?.total || 0
    }
  } catch (error) {
    console.error('查询账号列表失败:', error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.teacher_name = ''
  searchForm.card_account = ''
  searchForm.is_active = null
  pagination.page = 1
  searchAccounts()
}

const openEditDialog = (row) => {
  currentAccount.value = row
  editForm.card_account = row.card_account
  editDialogVisible.value = true
}

const updateAccount = async () => {
  if (!currentAccount.value?.teacher_id) {
    ElMessage.error('账号信息不完整')
    return
  }
  
  updating.value = true
  
  try {
    const res = await api.put(`/teachers/accounts/teacher/${currentAccount.value.teacher_id}`, {
      card_account: editForm.card_account.trim()
    })
    
    if (res.success) {
      ElMessage.success('账号更新成功')
      editDialogVisible.value = false
      searchAccounts()
    }
  } catch (error) {
    console.error('更新账号失败:', error)
  } finally {
    updating.value = false
  }
}

const openResetPasswordDialog = (row) => {
  currentAccount.value = row
  resetPasswordForm.new_password = ''
  resetPasswordDialogVisible.value = true
}

const resetPassword = async () => {
  if (!currentAccount.value?.teacher_id) {
    ElMessage.error('账号信息不完整')
    return
  }
  
  resetting.value = true
  
  try {
    const res = await api.post(`/teachers/accounts/teacher/${currentAccount.value.teacher_id}/reset-password`, {
      new_password: resetPasswordForm.new_password || undefined
    })
    
    if (res.success) {
      ElMessage.success(res.message || '密码重置成功')
      resetPasswordDialogVisible.value = false
    }
  } catch (error) {
    console.error('重置密码失败:', error)
  } finally {
    resetting.value = false
  }
}

const toggleStatus = async (row) => {
  const action = row.is_active ? '禁用' : '启用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}教师「${row.teacher_name}」的账号吗？`,
      '确认操作',
      {
        confirmButtonText: `确定${action}`,
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await api.post(`/teachers/accounts/teacher/${row.teacher_id}/toggle-status`, {
      is_active: !row.is_active
    })
    
    if (res.success) {
      ElMessage.success(res.message)
      searchAccounts()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('切换状态失败:', error)
    }
  }
}

onMounted(() => {
  searchAccounts()
})
</script>

<style scoped>
.account-list-container {
  width: 100%;
}
</style>
