<template>
  <div class="user-container">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="用户ID/账号/用户名"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="用户类型">
          <el-select v-model="searchForm.userType" placeholder="全部" clearable style="width: 150px">
            <el-option label="普通用户" :value="1" />
            <el-option label="VIP用户" :value="2" />
            <el-option label="企业用户" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
        </div>
      </template>
      
      <el-table :data="userList" v-loading="loading" stripe>
        <el-table-column prop="account" label="账号" min-width="150" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="gender" label="性别" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.gender === 1 ? 'primary' : row.gender === 2 ? 'danger' : 'info'">
              {{ row.gender_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="user_type" label="用户类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.user_type === 2 ? 'success' : row.user_type === 3 ? 'warning' : ''">
              {{ row.user_type_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadUserList"
          @current-change="loadUserList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '用户详情'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border v-if="isEdit">
        <el-descriptions-item label="账号">{{ userForm.account }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatTime(userForm.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="订单数">{{ userForm.order_count || 0 }}</el-descriptions-item>
        <el-descriptions-item label="消费总额">¥{{ userForm.total_spent || 0 }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider v-if="isEdit" />
      
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="userForm.gender">
            <el-radio :value="0">未知</el-radio>
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="用户类型">
          <el-select v-model="userForm.user_type" style="width: 200px">
            <el-option label="普通用户" :value="1" />
            <el-option label="VIP用户" :value="2" />
            <el-option label="企业用户" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址">
          <el-input
            v-model="userForm.address"
            type="textarea"
            :rows="2"
            placeholder="请输入地址"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)

const userFormRef = ref(null)

const searchForm = reactive({
  keyword: '',
  userType: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const userList = ref([])

const userForm = reactive({
  id: '',
  account: '',
  username: '',
  gender: 0,
  address: '',
  user_type: 1,
  order_count: 0,
  total_spent: 0,
  created_at: ''
})

const userRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

async function loadUserList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const res = await request.get('/api/customers', { params })
    if (res.success) {
      userList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadUserList()
}

function handleReset() {
  Object.assign(searchForm, {
    keyword: '',
    userType: ''
  })
  pagination.page = 1
  loadUserList()
}

async function handleEdit(row) {
  try {
    const res = await request.get(`/api/customers/${row.id}`)
    if (res.success) {
      Object.assign(userForm, res.data)
      isEdit.value = true
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取用户详情失败:', error)
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？删除后无法恢复。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await request.delete(`/api/customers/${row.id}`)
    if (res.success) {
      ElMessage.success('删除成功')
      loadUserList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

async function handleSubmit() {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const res = await request.put(`/api/customers/${userForm.id}`, userForm)
        if (res.success) {
          ElMessage.success('保存成功')
          dialogVisible.value = false
          loadUserList()
        }
      } catch (error) {
        console.error('保存失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  loadUserList()
})
</script>

<style scoped>
.user-container {
  min-height: 100%;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.search-form {
  flex-wrap: wrap;
}

.table-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
