<template>
  <div class="teacher-detail-container">
    <el-card v-if="loading">
      <el-skeleton :rows="10" animated />
    </el-card>
    
    <el-card v-else-if="teacher">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>教师详情</span>
          <div>
            <router-link to="/teacher/list">
              <el-button>返回列表</el-button>
            </router-link>
          </div>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="18">
          <el-descriptions title="基本信息" :column="3" border>
            <el-descriptions-item label="姓名">{{ teacher.name }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ teacher.gender || '-' }}</el-descriptions-item>
            <el-descriptions-item label="出生日期">{{ teacher.birth_date || '-' }}</el-descriptions-item>
            <el-descriptions-item label="身份证号">{{ teacher.id_card || '-' }}</el-descriptions-item>
            <el-descriptions-item label="手机号码">{{ teacher.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="电子邮箱">{{ teacher.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="住址">{{ teacher.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="学历">{{ teacher.education || '-' }}</el-descriptions-item>
            <el-descriptions-item label="专业">{{ teacher.major || '-' }}</el-descriptions-item>
            <el-descriptions-item label="部门">{{ teacher.department_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="岗位">{{ teacher.position || '-' }}</el-descriptions-item>
            <el-descriptions-item label="入职日期">{{ teacher.entry_date || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(teacher.status)">
                {{ teacher.status_label }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-col>
        
        <el-col :span="6">
          <el-card>
            <template #header>
              <span>教师卡账号</span>
            </template>
            
            <div v-if="teacher.card_account" class="account-info">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="账号">
                  <el-tag type="info">{{ teacher.card_account }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="teacher.is_active ? 'success' : 'danger'">
                    {{ teacher.is_active ? '已激活' : '未激活' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="最后登录">
                  {{ teacher.last_login ? formatDate(teacher.last_login) : '-' }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
            
            <div v-else class="no-account">
              <el-icon :size="48" color="#909399"><User /></el-icon>
              <p style="margin-top: 10px; color: #909399;">尚未开通教师卡账号</p>
              <el-button 
                type="primary" 
                size="small" 
                style="margin-top: 15px;"
                @click="openAccountDialog"
              >
                开通账号
              </el-button>
            </div>
          </el-card>
          
          <el-card style="margin-top: 20px;">
            <template #header>
              <span>快捷操作</span>
            </template>
            
            <el-button 
              v-if="teacher.status === 'probation'" 
              type="warning" 
              style="width: 100%; margin-bottom: 10px;"
              @click="goToApproval"
            >
              <el-icon><Edit /></el-icon>
              提交转正审批
            </el-button>
            
            <router-link to="/teacher/list" style="display: block;">
              <el-button style="width: 100%;">
                <el-icon><ArrowLeft /></el-icon>
                返回列表
              </el-button>
            </router-link>
          </el-card>
        </el-col>
      </el-row>
      
      <el-card style="margin-top: 20px;">
        <template #header>
          <span>审批记录</span>
        </template>
        
        <el-table :data="approvals" v-loading="loadingApprovals" style="width: 100%;" stripe>
          <el-table-column prop="type_label" label="审批类型" width="120" />
          <el-table-column prop="progress" label="审批进度" width="150">
            <template #default="{ row }">
              <el-progress :percentage="(row.current_step / row.total_steps) * 100" :format="() => row.progress" />
            </template>
          </el-table-column>
          <el-table-column prop="status_label" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getApprovalStatusType(row.status)">
                {{ row.status_label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="expect_regular_date" label="预计转正日期" width="150">
            <template #default="{ row }">
              {{ row.expect_regular_date || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="申请时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <router-link :to="`/approval/detail/${row.id}`">
                <el-button type="primary" link size="small">查看详情</el-button>
              </router-link>
            </template>
          </el-table-column>
        </el-table>
        
        <el-empty v-if="!loadingApprovals && approvals.length === 0" description="暂无审批记录" />
      </el-card>
    </el-card>
    
    <el-card v-else>
      <el-empty description="教师不存在" />
    </el-card>
    
    <el-dialog
      v-model="accountDialogVisible"
      title="开通教师账号"
      width="500px"
    >
      <el-form :model="accountForm" label-width="120px">
        <el-form-item label="教师卡账号">
          <el-input v-model="accountForm.card_account" placeholder="默认与教师姓名一致" />
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const loadingApprovals = ref(false)
const creatingAccount = ref(false)
const accountDialogVisible = ref(false)

const teacher = ref(null)
const approvals = ref([])

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

const getApprovalStatusType = (status) => {
  const map = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger'
  }
  return map[status] || 'info'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const loadTeacher = async () => {
  const { id } = route.params
  if (!id) return
  
  loading.value = true
  
  try {
    const res = await api.get(`/teachers/${id}`)
    if (res.success) {
      teacher.value = res.data
      accountForm.card_account = res.data.name
    }
  } catch (error) {
    console.error('加载教师详情失败:', error)
  } finally {
    loading.value = false
  }
}

const loadApprovals = async () => {
  const { id } = route.params
  if (!id) return
  
  loadingApprovals.value = true
  
  try {
    const res = await api.get(`/approvals/teacher/${id}`)
    if (res.success) {
      approvals.value = res.data
    }
  } catch (error) {
    console.error('加载审批记录失败:', error)
  } finally {
    loadingApprovals.value = false
  }
}

const openAccountDialog = () => {
  accountForm.card_account = teacher.value.name
  accountForm.card_password = ''
  accountDialogVisible.value = true
}

const createAccount = async () => {
  if (!teacher.value?.id) {
    ElMessage.error('教师信息不完整')
    return
  }
  
  creatingAccount.value = true
  
  try {
    const res = await api.post('/teachers/accounts', {
      teacher_id: teacher.value.id,
      card_account: accountForm.card_account.trim() || undefined,
      card_password: accountForm.card_password || undefined
    })
    
    if (res.success) {
      ElMessage.success('教师账号开通成功')
      accountDialogVisible.value = false
      loadTeacher()
    }
  } catch (error) {
    console.error('创建账号失败:', error)
  } finally {
    creatingAccount.value = false
  }
}

const goToApproval = () => {
  router.push({
    path: '/approval/submit',
    query: { teacher_id: teacher.value.id }
  })
}

onMounted(() => {
  loadTeacher()
  loadApprovals()
})
</script>

<style scoped>
.teacher-detail-container {
  width: 100%;
}

.account-info {
  padding: 10px 0;
}

.no-account {
  text-align: center;
  padding: 20px 0;
}
</style>
