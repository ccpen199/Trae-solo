<template>
  <div class="teacher-list-container">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>教师列表</span>
          <router-link to="/teacher/entry">
            <el-button type="primary">
              <el-icon><Plus /></el-icon>
              新增教师
            </el-button>
          </router-link>
        </div>
      </template>
      
      <el-form :model="searchForm" inline style="margin-bottom: 20px;">
        <el-form-item label="教师姓名">
          <el-input v-model="searchForm.name" placeholder="请输入教师姓名" clearable @keyup.enter="searchTeachers" />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="searchForm.department_id" placeholder="请选择部门" clearable style="width: 150px;">
            <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px;">
            <el-option label="试用期" value="probation" />
            <el-option label="已转正" value="regular" />
            <el-option label="已离职" value="resigned" />
            <el-option label="已辞退" value="fired" />
          </el-select>
        </el-form-item>
        <el-form-item label="教师卡账号">
          <el-input v-model="searchForm.card_account" placeholder="请输入教师卡账号" clearable @keyup.enter="searchTeachers" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchTeachers" :loading="loading">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="teacherList" v-loading="loading" style="width: 100%;" stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="70" />
        <el-table-column prop="department_name" label="部门" width="120" />
        <el-table-column prop="position" label="岗位" width="120" />
        <el-table-column prop="education" label="学历" width="80" />
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column prop="card_account" label="教师卡账号" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.card_account" type="info">{{ row.card_account }}</el-tag>
            <span v-else style="color: #909399;">未开通</span>
          </template>
        </el-table-column>
        <el-table-column prop="status_label" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status_label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="entry_date" label="入职日期" width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <router-link :to="`/teacher/detail/${row.id}`">
              <el-button type="primary" link size="small">详情</el-button>
            </router-link>
            <el-button 
              v-if="!row.card_account" 
              type="success" 
              link 
              size="small"
              @click="openAccountDialog(row)"
            >
              开通账号
            </el-button>
            <el-button 
              v-if="row.status === 'probation'" 
              type="warning" 
              link 
              size="small"
              @click="goToApproval(row)"
            >
              转正审批
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
        @size-change="searchTeachers"
        @current-change="searchTeachers"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
    
    <el-dialog
      v-model="accountDialogVisible"
      title="开通教师账号"
      width="500px"
    >
      <el-descriptions :column="1" border style="margin-bottom: 20px;">
        <el-descriptions-item label="教师姓名">{{ currentTeacher?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ currentTeacher?.department_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentTeacher?.status_label || '-' }}</el-descriptions-item>
      </el-descriptions>
      
      <el-form :model="accountForm" label-width="120px">
        <el-form-item label="教师卡账号">
          <el-input v-model="accountForm.card_account" placeholder="默认与教师姓名一致" />
          <div style="color: #909399; font-size: 12px; margin-top: 5px;">
            默认与教师姓名一致
          </div>
        </el-form-item>
        <el-form-item label="教师卡密码">
          <el-input 
            v-model="accountForm.card_password" 
            type="password"
            placeholder="默认123456"
            show-password
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="accountDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createAccount" :loading="creatingAccount">
          确认开通
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const router = useRouter()

const loading = ref(false)
const creatingAccount = ref(false)

const departments = ref([])
const teacherList = ref([])
const accountDialogVisible = ref(false)
const currentTeacher = ref(null)

const searchForm = reactive({
  name: '',
  department_id: '',
  status: '',
  card_account: ''
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const accountForm = reactive({
  card_account: '',
  card_password: ''
})

const getStatusType = (status) => {
  const map = {
    'probation': 'warning',
    'regular': 'success',
    'resigned': 'info',
    'fired': 'danger'
  }
  return map[status] || 'info'
}

const loadDepartments = async () => {
  try {
    const res = await api.get('/departments')
    if (res.success) {
      departments.value = res.data
    }
  } catch (error) {
    console.error('加载部门列表失败:', error)
  }
}

const searchTeachers = async () => {
  loading.value = true
  
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.page_size
    }
    
    if (searchForm.name) params.name = searchForm.name.trim()
    if (searchForm.department_id) params.department_id = searchForm.department_id
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.card_account) params.card_account = searchForm.card_account.trim()
    
    const res = await api.get('/teachers', { params })
    
    if (res.success) {
      teacherList.value = res.data.list || []
      pagination.total = res.data.pagination?.total || 0
    }
  } catch (error) {
    console.error('查询教师列表失败:', error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.name = ''
  searchForm.department_id = ''
  searchForm.status = ''
  searchForm.card_account = ''
  pagination.page = 1
  searchTeachers()
}

const openAccountDialog = (row) => {
  currentTeacher.value = row
  accountForm.card_account = row.name
  accountForm.card_password = ''
  accountDialogVisible.value = true
}

const createAccount = async () => {
  if (!currentTeacher.value?.id) {
    ElMessage.error('教师信息不完整')
    return
  }
  
  creatingAccount.value = true
  
  try {
    const res = await api.post('/teachers/accounts', {
      teacher_id: currentTeacher.value.id,
      card_account: accountForm.card_account.trim() || undefined,
      card_password: accountForm.card_password || undefined
    })
    
    if (res.success) {
      ElMessage.success('教师账号开通成功')
      accountDialogVisible.value = false
      searchTeachers()
    }
  } catch (error) {
    console.error('创建账号失败:', error)
  } finally {
    creatingAccount.value = false
  }
}

const goToApproval = (row) => {
  router.push({
    path: '/approval/submit',
    query: { teacher_id: row.id }
  })
}

onMounted(() => {
  loadDepartments()
  searchTeachers()
})
</script>

<style scoped>
.teacher-list-container {
  width: 100%;
}
</style>
