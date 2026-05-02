<template>
  <div class="order-form">
    <el-card>
      <template #header>
        <span>新建日志采集</span>
      </template>
      
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        style="max-width: 800px"
      >
        <el-divider content-position="left">基本信息</el-divider>
        
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入日志采集任务标题" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入任务描述"
          />
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-select v-model="formData.priority" placeholder="请选择优先级" style="width: 200px">
            <el-option label="低" value="low" />
            <el-option label="中" value="normal" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>

        <el-form-item label="期望完成时间">
          <el-date-picker
            v-model="formData.expected_finish_time"
            type="datetime"
            placeholder="选择期望完成时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-divider content-position="left">采集器配置</el-divider>
        
        <el-form-item label="采集器配置">
          <div v-for="(collector, index) in formData.collectors" :key="index" class="collector-item">
            <el-card shadow="never">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <span>采集器 {{ index + 1 }}</span>
                  <el-button 
                    type="danger" 
                    link 
                    v-if="formData.collectors.length > 1"
                    @click="removeCollector(index)"
                  >
                    删除
                  </el-button>
                </div>
              </template>
              <el-form-item label="采集器名称" :prop="`collectors.${index}.name`" :rules="[{ required: true, message: '请输入采集器名称', trigger: 'blur' }]">
                <el-input v-model="collector.name" placeholder="请输入采集器名称" />
              </el-form-item>
              <el-form-item label="采集器类型">
                <el-select v-model="collector.type" placeholder="请选择采集器类型" style="width: 100%">
                  <el-option label="文件采集" value="file" />
                  <el-option label="网络采集" value="network" />
                  <el-option label="API采集" value="api" />
                  <el-option label="数据库采集" value="database" />
                </el-select>
              </el-form-item>
              <el-form-item label="采集间隔(秒)">
                <el-input-number v-model="collector.collect_interval" :min="1" :max="86400" />
              </el-form-item>
            </el-card>
          </div>
          <el-button type="primary" plain @click="addCollector" style="width: 100%">
            <el-icon><Plus /></el-icon>
            添加采集器
          </el-button>
        </el-form-item>

        <el-divider content-position="left">日志明细（可选）</el-divider>
        
        <el-form-item label="日志明细">
          <div v-for="(detail, index) in formData.details" :key="index" class="detail-item">
            <el-card shadow="never">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <span>日志明细 {{ index + 1 }}</span>
                  <el-button 
                    type="danger" 
                    link 
                    v-if="formData.details.length > 0"
                    @click="removeDetail(index)"
                  >
                    删除
                  </el-button>
                </div>
              </template>
              <el-form-item label="日志来源">
                <el-input v-model="detail.log_source" placeholder="如：应用服务器、数据库等" />
              </el-form-item>
              <el-form-item label="日志路径">
                <el-input v-model="detail.log_path" placeholder="如：/var/log/nginx/access.log" />
              </el-form-item>
              <el-form-item label="日志格式">
                <el-select v-model="detail.log_format" placeholder="请选择日志格式" style="width: 100%">
                  <el-option label="JSON格式" value="json" />
                  <el-option label="文本格式" value="text" />
                  <el-option label="CSV格式" value="csv" />
                  <el-option label="自定义格式" value="custom" />
                </el-select>
              </el-form-item>
            </el-card>
          </div>
          <el-button type="primary" plain @click="addDetail" style="width: 100%">
            <el-icon><Plus /></el-icon>
            添加日志明细
          </el-button>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            提交
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createOrder } from '@/api/orders'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)

const formData = reactive({
  title: '',
  description: '',
  priority: 'normal',
  expected_finish_time: '',
  assignee_id: null,
  collectors: [
    { name: '', type: 'file', collect_interval: 60 }
  ],
  details: []
})

const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ]
}

const addCollector = () => {
  formData.collectors.push({ name: '', type: 'file', collect_interval: 60 })
}

const removeCollector = (index) => {
  formData.collectors.splice(index, 1)
}

const addDetail = () => {
  formData.details.push({ log_source: '', log_path: '', log_format: 'text', log_count: 0 })
}

const removeDetail = (index) => {
  formData.details.splice(index, 1)
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      expected_finish_time: formData.expected_finish_time || null,
      assignee_id: formData.assignee_id,
      collectors: formData.collectors.filter(c => c.name.trim()),
      details: formData.details
    }
    
    const res = await createOrder(data)
    ElMessage.success('创建成功')
    router.push(`/orders/${res.data.id}`)
  } catch (error) {
    console.error('创建失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleReset = () => {
  formRef.value.resetFields()
  formData.collectors = [{ name: '', type: 'file', collect_interval: 60 }]
  formData.details = []
}
</script>

<style scoped>
.order-form {
  min-height: 100%;
}

.collector-item,
.detail-item {
  margin-bottom: 16px;
}
</style>
