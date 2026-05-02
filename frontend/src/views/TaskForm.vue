<template>
  <div class="task-form-page">
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑任务' : '创建任务' }}</span>
      </template>
      
      <el-form 
        ref="taskFormRef" 
        :model="taskForm" 
        :rules="taskRules" 
        label-width="120px"
        style="max-width: 800px;"
      >
        <el-form-item label="任务名称" prop="task_name">
          <el-input v-model="taskForm.task_name" placeholder="请输入任务名称" />
        </el-form-item>
        
        <el-form-item label="任务代码" prop="task_code">
          <el-input v-model="taskForm.task_code" placeholder="自动生成，可修改" />
        </el-form-item>
        
        <el-form-item label="任务类型" prop="task_type">
          <el-select v-model="taskForm.task_type" placeholder="请选择任务类型" style="width: 100%;">
            <el-option label="日常任务" value="daily" />
            <el-option label="主线任务" value="main" />
            <el-option label="支线任务" value="side" />
            <el-option label="活动任务" value="event" />
            <el-option label="成就任务" value="achievement" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input v-model="taskForm.description" type="textarea" :rows="3" placeholder="请输入任务描述" />
        </el-form-item>
        
        <el-form-item label="触发事件" prop="trigger_event_code">
          <el-select v-model="taskForm.trigger_event_code" placeholder="请选择触发事件" style="width: 100%;">
            <el-option 
              v-for="event in triggerEvents" 
              :key="event.event_code"
              :label="event.event_name + ' (' + event.event_code + ')'"
              :value="event.event_code"
            />
          </el-select>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="目标次数" prop="target_count">
              <el-input-number v-model="taskForm.target_count" :min="1" :max="10000" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-input-number v-model="taskForm.priority" :min="0" :max="10" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否日常">
              <el-switch v-model="taskForm.is_daily" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否可重复">
              <el-switch v-model="taskForm.is_repeatable" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="最大重复次数" v-if="taskForm.is_repeatable">
          <el-input-number v-model="taskForm.max_repeat_count" :min="1" :max="1000" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间">
              <el-date-picker
                v-model="taskForm.start_time"
                type="datetime"
                placeholder="选择开始时间"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间">
              <el-date-picker
                v-model="taskForm.end_time"
                type="datetime"
                placeholder="选择结束时间"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            提交
          </el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { taskApi, progressApi } from '../api'

const router = useRouter()
const route = useRoute()

const taskFormRef = ref(null)
const submitting = ref(false)
const triggerEvents = ref([])

const isEdit = computed(() => !!route.params.taskUuid)

const taskForm = reactive({
  task_name: '',
  task_code: `TASK_${Date.now()}`,
  task_type: 'daily',
  description: '',
  trigger_event_code: '',
  target_count: 1,
  priority: 0,
  is_daily: false,
  is_repeatable: false,
  max_repeat_count: 1,
  start_time: null,
  end_time: null
})

const taskRules = {
  task_name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  task_type: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  trigger_event_code: [{ required: true, message: '请选择触发事件', trigger: 'change' }]
}

const goBack = () => {
  router.push('/tasks')
}

const handleSubmit = async () => {
  if (!taskFormRef.value) return
  
  await taskFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const data = {
          ...taskForm,
          start_time: taskForm.start_time ? taskForm.start_time.toISOString() : null,
          end_time: taskForm.end_time ? taskForm.end_time.toISOString() : null
        }
        
        if (isEdit.value) {
          await taskApi.updateTask(route.params.taskUuid, data)
          ElMessage.success('任务更新成功')
        } else {
          await taskApi.createTask(data)
          ElMessage.success('任务创建成功')
        }
        
        router.push('/tasks')
      } catch (error) {
        console.error('提交失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

const loadTriggerEvents = async () => {
  try {
    const result = await progressApi.getTriggerEvents()
    triggerEvents.value = result.data
  } catch (error) {
    console.error('加载触发事件失败:', error)
  }
}

onMounted(() => {
  loadTriggerEvents()
})
</script>

<style scoped>
.task-form-page {
  max-width: 900px;
}
</style>
