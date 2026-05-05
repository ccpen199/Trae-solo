<template>
  <div class="entry-container">
    <el-card>
      <template #header>
        <span>教师入职建档</span>
      </template>
      
      <el-steps :active="currentStep" align-center>
        <el-step title="基本信息录入" :description="currentStep >= 1 ? '已完成' : '进行中'" />
        <el-step title="同名教师检查" :description="currentStep >= 2 ? '已完成' : '待处理'" />
        <el-step title="开通教师账号" :description="currentStep >= 3 ? '已完成' : '待处理'" />
      </el-steps>
      
      <div v-if="currentStep === 0" class="step-content">
        <el-alert title="请按流程完成教师入职建档" type="info" show-icon style="margin-bottom: 20px;">
          <template #default>
            <p>1. 先录入教师基本信息</p>
            <p>2. 系统会自动检查是否有同名教师</p>
            <p>3. 最后开通教师卡账号</p>
          </template>
        </el-alert>
        
        <el-form 
          ref="basicFormRef"
          :model="basicForm"
          :rules="basicRules"
          label-width="120px"
          style="max-width: 800px; margin: 0 auto;"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="教师姓名" prop="name">
                <el-input 
                  v-model="basicForm.name" 
                  placeholder="请输入教师姓名"
                  @blur="checkNameDuplicate"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="性别" prop="gender">
                <el-select v-model="basicForm.gender" placeholder="请选择性别" style="width: 100%;">
                  <el-option label="男" value="男" />
                  <el-option label="女" value="女" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="出生日期" prop="birth_date">
                <el-date-picker
                  v-model="basicForm.birth_date"
                  type="date"
                  placeholder="请选择出生日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="身份证号" prop="id_card">
                <el-input v-model="basicForm.id_card" placeholder="请输入身份证号" maxlength="18" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="手机号码" prop="phone">
                <el-input v-model="basicForm.phone" placeholder="请输入手机号码" maxlength="11" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="电子邮箱" prop="email">
                <el-input v-model="basicForm.email" placeholder="请输入电子邮箱" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="学历" prop="education">
                <el-select v-model="basicForm.education" placeholder="请选择学历" style="width: 100%;">
                  <el-option label="专科" value="专科" />
                  <el-option label="本科" value="本科" />
                  <el-option label="硕士" value="硕士" />
                  <el-option label="博士" value="博士" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="专业" prop="major">
                <el-input v-model="basicForm.major" placeholder="请输入专业" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="所属部门" prop="department_id">
                <el-select v-model="basicForm.department_id" placeholder="请选择部门" style="width: 100%;">
                  <el-option 
                    v-for="dept in departments" 
                    :key="dept.id" 
                    :label="dept.name" 
                    :value="dept.id" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="岗位" prop="position">
                <el-input v-model="basicForm.position" placeholder="请输入岗位" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="入职日期" prop="entry_date">
                <el-date-picker
                  v-model="basicForm.entry_date"
                  type="date"
                  placeholder="请选择入职日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="住址">
                <el-input v-model="basicForm.address" placeholder="请输入住址" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item style="text-align: center; margin-top: 30px;">
            <el-button type="primary" @click="submitBasicInfo" :loading="submitting">
              提交基本信息
            </el-button>
            <el-button @click="resetBasicForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <div v-if="currentStep === 1" class="step-content">
        <el-alert 
          v-if="nameCheckResult?.hasDuplicate" 
          title="检测到同名教师" 
          type="warning" 
          show-icon
          style="margin-bottom: 20px;"
        >
          <template #default>
            <p>已找到 {{ nameCheckResult.count }} 位同名教师，请人工确认是否为同一人。</p>
          </template>
        </el-alert>
        
        <el-table :data="nameCheckResult?.duplicates || []" style="width: 100%;" v-if="nameCheckResult?.hasDuplicate">
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="department" label="部门" width="150" />
          <el-table-column prop="position" label="岗位" width="150" />
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        
        <div v-else style="text-align: center; padding: 40px;">
          <el-icon :size="64" color="#67C23A"><CircleCheck /></el-icon>
          <p style="margin-top: 20px; font-size: 18px; color: #67C23A;">未检测到同名教师，可继续</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <el-button type="primary" @click="goToAccountStep" :loading="submitting">
            确认并继续开通账号
          </el-button>
          <el-button @click="backToBasicInfo">返回修改信息</el-button>
        </div>
      </div>
      
      <div v-if="currentStep === 2" class="step-content">
        <el-alert title="教师基本信息已保存，现在开通教师卡账号" type="success" show-icon style="margin-bottom: 20px;">
          <template #default>
            <p>教师姓名: {{ createdTeacher?.teacher_name || '-' }}</p>
            <p>教师ID: {{ createdTeacher?.teacher_id || '-' }}</p>
          </template>
        </el-alert>
        
        <el-form 
          ref="accountFormRef"
          :model="accountForm"
          :rules="accountRules"
          label-width="140px"
          style="max-width: 500px; margin: 0 auto;"
        >
          <el-form-item label="教师卡账号">
            <el-input v-model="accountForm.card_account" placeholder="默认与教师姓名一致" />
            <div style="color: #909399; font-size: 12px; margin-top: 5px;">
              教师卡账号默认与教师姓名一致，可根据需要修改
            </div>
          </el-form-item>
          
          <el-form-item label="教师卡密码">
            <el-input 
              v-model="accountForm.card_password" 
              type="password"
              placeholder="默认123456"
              show-password
            />
            <div style="color: #909399; font-size: 12px; margin-top: 5px;">
              密码默认为 123456，首次登录后建议修改
            </div>
          </el-form-item>
          
          <el-form-item style="text-align: center; margin-top: 30px;">
            <el-button type="primary" @click="createAccount" :loading="creatingAccount">
              开通教师账号
            </el-button>
            <el-button @click="backToCheckStep">返回上一步</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <div v-if="currentStep === 3" class="step-content">
        <el-result
          icon="success"
          title="教师入职建档完成"
          sub-title="教师基本信息已保存，教师卡账号已开通"
        >
          <template #extra>
            <el-descriptions :column="1" border style="text-align: left; margin: 20px 0;">
              <el-descriptions-item label="教师姓名">{{ accountResult?.teacher_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="教师卡账号">{{ accountResult?.card_account || '-' }}</el-descriptions-item>
              <el-descriptions-item label="账号状态">
                <el-tag type="success">已激活</el-tag>
              </el-descriptions-item>
            </el-descriptions>
            
            <el-row :gutter="20" justify="center">
              <el-col>
                <el-button type="primary" @click="resetAll">继续录入新教师</el-button>
              </el-col>
              <el-col>
                <router-link to="/teacher/list">
                  <el-button>查看教师列表</el-button>
                </router-link>
              </el-col>
              <el-col>
                <router-link to="/">
                  <el-button>返回首页</el-button>
                </router-link>
              </el-col>
            </el-row>
          </template>
        </el-result>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const router = useRouter()

const currentStep = ref(0)
const submitting = ref(false)
const creatingAccount = ref(false)

const basicFormRef = ref(null)
const accountFormRef = ref(null)

const departments = ref([])
const nameCheckResult = ref(null)
const createdTeacher = ref(null)
const accountResult = ref(null)

const basicForm = reactive({
  name: '',
  gender: '',
  birth_date: '',
  id_card: '',
  phone: '',
  email: '',
  address: '',
  education: '',
  major: '',
  department_id: '',
  position: '',
  entry_date: ''
})

const accountForm = reactive({
  card_account: '',
  card_password: ''
})

const basicRules = {
  name: [{ required: true, message: '请输入教师姓名', trigger: 'blur' }],
  entry_date: [{ required: true, message: '请选择入职日期', trigger: 'change' }]
}

const accountRules = {}

const getStatusType = (status) => {
  const map = {
    'probation': 'warning',
    'regular': 'success',
    'resigned': 'info',
    'fired': 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    'probation': '试用期',
    'regular': '已转正',
    'resigned': '已离职',
    'fired': '已辞退'
  }
  return map[status] || status
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

const checkNameDuplicate = async () => {
  if (!basicForm.name.trim()) {
    return
  }
  
  try {
    const res = await api.get('/teachers/check-name', {
      params: { name: basicForm.name.trim() }
    })
    if (res.success) {
      nameCheckResult.value = res
    }
  } catch (error) {
    console.error('检查同名失败:', error)
  }
}

const submitBasicInfo = async () => {
  if (!basicFormRef.value) return
  
  await basicFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      
      try {
        await checkNameDuplicate()
        
        const res = await api.post('/teachers', {
          name: basicForm.name.trim(),
          gender: basicForm.gender || null,
          birth_date: basicForm.birth_date || null,
          id_card: basicForm.id_card || null,
          phone: basicForm.phone || null,
          email: basicForm.email || null,
          address: basicForm.address || null,
          education: basicForm.education || null,
          major: basicForm.major || null,
          department_id: basicForm.department_id || null,
          position: basicForm.position || null,
          entry_date: basicForm.entry_date
        })
        
        if (res.success) {
          createdTeacher.value = res.data
          accountForm.card_account = basicForm.name.trim()
          currentStep.value = 1
          
          if (nameCheckResult.value?.hasDuplicate) {
            ElMessage.warning(`检测到 ${nameCheckResult.value.count} 位同名教师，请确认`)
          } else {
            ElMessage.success('基本信息保存成功')
          }
        }
      } catch (error) {
        console.error('提交基本信息失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

const goToAccountStep = async () => {
  if (nameCheckResult.value?.hasDuplicate) {
    try {
      await ElMessageBox.confirm(
        `检测到 ${nameCheckResult.value.count} 位同名教师，确认继续录入吗？`,
        '确认继续',
        {
          confirmButtonText: '确认继续',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      currentStep.value = 2
    } catch {
      // 用户取消
    }
  } else {
    currentStep.value = 2
  }
}

const backToBasicInfo = () => {
  currentStep.value = 0
}

const backToCheckStep = () => {
  currentStep.value = 1
}

const createAccount = async () => {
  if (!createdTeacher.value?.teacher_id) {
    ElMessage.error('教师信息不完整，请重新操作')
    return
  }
  
  creatingAccount.value = true
  
  try {
    const res = await api.post('/teachers/accounts', {
      teacher_id: createdTeacher.value.teacher_id,
      card_account: accountForm.card_account.trim() || undefined,
      card_password: accountForm.card_password || undefined
    })
    
    if (res.success) {
      accountResult.value = res.data
      currentStep.value = 3
      ElMessage.success('教师账号开通成功')
    }
  } catch (error) {
    console.error('创建账号失败:', error)
  } finally {
    creatingAccount.value = false
  }
}

const resetBasicForm = () => {
  basicForm.name = ''
  basicForm.gender = ''
  basicForm.birth_date = ''
  basicForm.id_card = ''
  basicForm.phone = ''
  basicForm.email = ''
  basicForm.address = ''
  basicForm.education = ''
  basicForm.major = ''
  basicForm.department_id = ''
  basicForm.position = ''
  basicForm.entry_date = ''
  nameCheckResult.value = null
}

const resetAll = () => {
  resetBasicForm()
  accountForm.card_account = ''
  accountForm.card_password = ''
  createdTeacher.value = null
  accountResult.value = null
  currentStep.value = 0
}

onMounted(() => {
  loadDepartments()
})
</script>

<style scoped>
.entry-container {
  width: 100%;
}

.step-content {
  padding: 40px 0;
}

:deep(.el-steps) {
  margin-bottom: 40px;
}
</style>
