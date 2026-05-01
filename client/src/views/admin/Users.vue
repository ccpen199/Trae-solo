<template>
  <div class="users-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <div class="header-actions">
            <el-input
              v-model="searchQuery"
              placeholder="搜索用户名/邮箱"
              style="width: 200px; margin-right: 10px;"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="filterRole" placeholder="角色筛选" clearable @change="handleSearch" style="width: 120px;">
              <el-option label="管理员" value="admin" />
              <el-option label="知识编辑" value="editor" />
              <el-option label="行业专家" value="expert" />
              <el-option label="回答者" value="answerer" />
              <el-option label="提问者" value="questioner" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="users" v-loading="loading" style="width: 100%">
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)" size="small">
              {{ getRoleName(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creditScore" label="信用分" width="100">
          <template #default="{ row }">
            <span :class="{ 'high-credit': row.creditScore >= 800, 'low-credit': row.creditScore < 300 }">
              {{ row.creditScore || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="warning" link size="small" @click="editRole(row)">角色</el-button>
            <el-button 
              :type="row.status === 'active' ? 'danger' : 'success'" 
              link 
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </el-card>

    <el-dialog v-model="roleDialogVisible" title="修改用户角色" width="400px">
      <el-form label-width="80px">
        <el-form-item label="当前用户">
          <span>{{ editingUser?.username }}</span>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="selectedRole" placeholder="选择角色" style="width: 100%;">
            <el-option label="管理员" value="admin" />
            <el-option label="知识编辑" value="editor" />
            <el-option label="行业专家" value="expert" />
            <el-option label="回答者" value="answerer" />
            <el-option label="提问者" value="questioner" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRole">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const searchQuery = ref('')
const filterRole = ref('')
const users = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const roleDialogVisible = ref(false)
const editingUser = ref(null)
const selectedRole = ref('')

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const getRoleTagType = (role) => {
  const typeMap = {
    'admin': 'danger',
    'editor': 'warning',
    'expert': 'primary',
    'answerer': 'success',
    'questioner': 'info'
  }
  return typeMap[role] || 'info'
}

const getRoleName = (role) => {
  const nameMap = {
    'admin': '管理员',
    'editor': '知识编辑',
    'expert': '行业专家',
    'answerer': '回答者',
    'questioner': '提问者'
  }
  return nameMap[role] || role
}

const loadUsers = () => {
  loading.value = true
  users.value = [
    {
      userId: 'U-001',
      username: 'admin',
      nickname: '系统管理员',
      email: 'admin@example.com',
      role: 'admin',
      creditScore: 1000,
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 30)
    },
    {
      userId: 'U-002',
      username: 'editor',
      nickname: '知识编辑',
      email: 'editor@example.com',
      role: 'editor',
      creditScore: 850,
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 25)
    },
    {
      userId: 'U-003',
      username: 'expert_js',
      nickname: 'JavaScript专家',
      email: 'expert_js@example.com',
      role: 'expert',
      creditScore: 780,
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 20)
    },
    {
      userId: 'U-004',
      username: 'answerer_1',
      nickname: '热心回答者',
      email: 'answerer_1@example.com',
      role: 'answerer',
      creditScore: 450,
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 15)
    },
    {
      userId: 'U-005',
      username: 'questioner_1',
      nickname: '新手提问',
      email: 'questioner_1@example.com',
      role: 'questioner',
      creditScore: 120,
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 10)
    }
  ]
  total.value = users.value.length
  loading.value = false
}

const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

const viewDetail = (row) => {
  ElMessage.info(`查看用户详情: ${row.username}`)
}

const editRole = (row) => {
  editingUser.value = row
  selectedRole.value = row.role
  roleDialogVisible.value = true
}

const saveRole = () => {
  if (editingUser.value) {
    editingUser.value.role = selectedRole.value
    ElMessage.success('角色修改成功')
  }
  roleDialogVisible.value = false
}

const toggleStatus = async (row) => {
  const action = row.status === 'active' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}该用户吗？`, '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    row.status = row.status === 'active' ? 'disabled' : 'active'
    ElMessage.success(`${action}成功`)
  } catch {}
}

onMounted(() => {
  loadUsers()
})
</script>

<style lang="scss" scoped>
.users-page {
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  
  .header-actions {
    display: flex;
    align-items: center;
  }
}

.high-credit {
  color: #67c23a;
  font-weight: 500;
}

.low-credit {
  color: #f56c6c;
  font-weight: 500;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
