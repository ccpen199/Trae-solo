<template>
  <div class="approval-submit-container">
    <el-card>
      <template #header>
        <span>提交转正审批</span>
      </template>
      
      <el-alert 
        title="请选择需要提交转正审批的试用期教师" 
        type="info" 
        show-icon 
        style="margin-bottom: 20px;"
      />
      
      <el-form 
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="140px"
        style="max-width: 600px; margin: 0 auto;"
      >
        <el-form-item label="选择教师" prop="teacher_id">
          <el-select 
            v-model="form.teacher_id" 
            placeholder="请选择试用期教师"
            style="width: 100%;"
            filterable
            @change="onTeacherSelect"
          >
            <el-option 
              v-for="teacher in probationTeachers" 
              :key="teacher.id" 
              :label="`${teacher.name} - ${teacher.department_name || '未分配部门'}`"
              :value="teacher.id"
            />
          </el-select>
          <div style="color: #909399; font-size: 12px; margin-top: 5px;">
            仅显示试用期教师（可通过教师列表将教师状态改为试用期）
          </div>
        </el-form-item>
        
        <template v-if="selectedTeacher">
          <el-descriptions :column="1" border size="small" style="margin-bottom: 20px;">
            <el-descriptions-item label="姓名">{{ selectedTeacher.name }}</el-descriptions-item>
            <el-descriptions-item label="部门">{{ selectedTeacher.department_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="岗位">{{ selectedTeacher.position || '-' }}</el-descriptions-item>
            <el-descriptions-item label="入职日期">{{ selectedTeacher.entry_date || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag type="warning">试用期</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </template>
        
        <el-form-item label="预计转正日期" prop="expect_regular_date">
          <el-date-picker
            v-model="form.expect_regular_date"
            type="date"
            placeholder="请选择预计转正日期"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="申请理由" prop="reason">
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入申请理由（选填）"
          />
        </el-form-item>
        
        <el-form-item style="text-align: center; margin-top: 30px;">
          <el-button type="primary" @click="submitApproval" :loading="submitting">
            提交审批
          </el-button>
          <router-link to="/approval/list">
            <el-button>查看审批列表</el-button>
          </router-link>
        </el-form-item>
      </el-form>
      
      <el-card v-if="probationTeachers.length === 0" style="margin-top: 20px;">
        <el-empty description="暂无试用期教师">
          <template #description>
            <span>
              暂无试用期教师，您可以
              <router-link to="/teacher/entry" style="color: #409EFF;">新增教师</router-link>
              或
              <router-link to="/teacher/list" style="color: #409EFF;">修改教师状态</router-link>
            </span>
          </template>
        </el-empty>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const formRef = ref(null)
const submitting = ref(false)
const probationTeachers = ref([])
const selectedTeacherId = ref('')

const form = reactive({
  teacher_id: '',
  expect_regular_date: '',
  reason: ''
})

const rules = {
  teacher_id: [{ required: true, message: '请选择教师', trigger: 'change' }]
}

const selectedTeacher = computed(() => {
  return probationTeachers.value.find(t => t.id === form.teacher_id) || null
})

const loadProbationTeachers = async () => {
  try {
    const res = await api.get('/teachers', {
      params: { status: 'probation', page: 1, page_size: 1000 }
    })
    
    if (res.success) {
      probationTeachers.value = res.data.list || []
      
      const queryTeacherId = route.query.teacher_id
      if (queryTeacherId) {
        const teacher = probationTeachers.value.find(t => t.id === queryTeacherId)
        if (teacher) {
          form.teacher_id = queryTeacherId
        }
      }
    }
  } catch (error) {
    console.error('加载试用期教师失败:', error)
  }
}

const onTeacherSelect = (val) => {
  const teacher = probationTeachers.value.find(t => t.id === val)
  if (teacher && teacher.entry_date) {
    const entryDate = new Date(teacher.entry_date)
    const expectDate = new Date(entryDate.getTime() + 90 * 24 * 60 * 60 * 1000)
    const year = expectDate.getFullYear()
    const month = String(expectDate.getMonth() + 1).padStart(2, '0')
    const day = String(expectDate.getDate()).padStart(2, '0')
    form.expect_regular_date = `${year}-${month}-${day}`
  }
}

const submitApproval = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      
      try {
        const res = await api.post('/approvals', {
          teacher_id: form.teacher_id,
          approval_type: 'regularization',
          expect_regular_date: form.expect_regular_date || undefined,
          reason: form.reason || undefined
        })
        
        if (res.success) {
          ElMessage.success('转正审批提交成功')
          router.push({
            path: '/approval/detail',
            query: { id: res.data.approval_id }
          })
        }
      } catch (error) {
        console.error('提交审批失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  loadProbationTeachers()
})
</script>

<style scoped>
.approval-submit-container {
  width: 100%;
}
</style>
