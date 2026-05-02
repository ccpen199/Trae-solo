<template>
  <div class="case-create-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">创建新案件</h2>
          <el-button type="info" @click="router.back()">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>
      
      <el-form 
        :model="form" 
        :rules="rules" 
        ref="formRef" 
        label-width="120px"
        class="create-form"
      >
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="案件标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入案件标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="案件类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择案件类型" style="width: 100%">
                <el-option label="民事案件" value="civil" />
                <el-option label="刑事案件" value="criminal" />
                <el-option label="行政案件" value="administrative" />
                <el-option label="商事案件" value="commercial" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="客户" prop="client_id">
              <el-select 
                v-model="form.client_id" 
                placeholder="请选择客户" 
                style="width: 100%"
                filterable
              >
                <el-option 
                  v-for="user in clientUsers" 
                  :key="user.id" 
                  :label="`${user.name} (${user.username})`" 
                  :value="user.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法院">
              <el-input v-model="form.court" placeholder="请输入受理法院" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="主办律师">
              <el-select 
                v-model="form.lead_lawyer_id" 
                placeholder="请选择主办律师" 
                style="width: 100%"
                filterable
              >
                <el-option 
                  v-for="user in lawyerUsers" 
                  :key="user.id" 
                  :label="`${user.name} (${user.username})`" 
                  :value="user.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="案件助理">
              <el-select 
                v-model="form.assistant_id" 
                placeholder="请选择案件助理" 
                style="width: 100%"
                filterable
                clearable
              >
                <el-option 
                  v-for="user in assistantUsers" 
                  :key="user.id" 
                  :label="`${user.name} (${user.username})`" 
                  :value="user.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="案件金额">
              <el-input-number 
                v-model="form.case_value" 
                :min="0" 
                :precision="2"
                placeholder="请输入案件金额"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开庭日期">
              <el-date-picker
                v-model="form.hearing_date"
                type="datetime"
                placeholder="请选择开庭日期时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="案件描述">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入案件描述"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit" size="large">
            <el-icon><Check /></el-icon>
            创建案件
          </el-button>
          <el-button size="large" @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import { caseApi, userApi } from '../../api'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const allUsers = ref([])

const form = reactive({
  title: '',
  type: 'civil',
  client_id: null,
  court: '',
  lead_lawyer_id: userStore.userInfo?.id || null,
  assistant_id: null,
  case_value: 0,
  hearing_date: null,
  description: ''
})

const rules = {
  title: [{ required: true, message: '请输入案件标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择案件类型', trigger: 'change' }],
  client_id: [{ required: true, message: '请选择客户', trigger: 'change' }]
}

const clientUsers = computed(() => allUsers.value.filter(u => u.role === 'client'))
const lawyerUsers = computed(() => allUsers.value.filter(u => u.role === 'lead_lawyer'))
const assistantUsers = computed(() => allUsers.value.filter(u => u.role === 'assistant'))

const loadUsers = async () => {
  try {
    allUsers.value = await userApi.getAll()
  } catch (e) {
    console.error(e)
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const result = await caseApi.create(form)
    ElMessage.success('案件创建成功')
    router.push(`/cases/${result.id}`)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.case-create-page {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.create-form {
  padding: 20px 0;
}

@media (max-width: 768px) {
  .el-col {
    margin-bottom: 0;
  }
}
</style>
