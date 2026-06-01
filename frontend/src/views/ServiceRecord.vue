<template>
  <div class="service-record">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span class="title">订单列表</span>
          </template>
          <el-table
            :data="orders"
            style="cursor: pointer"
            highlight-current-row
            @row-click="selectOrder"
          >
            <el-table-column prop="order_no" label="订单号" show-overflow-tooltip />
            <el-table-column prop="patient_name" label="患者" width="80" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card v-if="selectedOrder">
          <template #header>
            <div class="card-header">
              <span class="title">服务进度</span>
              <span class="order-info">
                订单号：{{ selectedOrder.order_no }} | 患者：{{ selectedOrder.patient_name }}
              </span>
            </div>
          </template>

          <el-steps
            :active="activeStep"
            finish-status="success"
            direction="vertical"
            @click="handleStepClick"
          >
            <el-step
              v-for="(step, index) in steps"
              :key="step.id"
              :title="step.title"
              :description="getStepDescription(step)"
              :status="getStepStatus(index)"
            >
              <template #title>
                <span class="step-title" @click.stop="openCheckinDialog(index)">
                  {{ step.title }}
                  <el-tag v-if="step.checked" type="success" size="small" style="margin-left: 10px">
                    已签到
                  </el-tag>
                  <el-tag v-else type="info" size="small" style="margin-left: 10px">
                    待签到
                  </el-tag>
                </span>
              </template>
              <template #description>
                <div v-if="step.checked" class="step-desc">
                  <div>时间：{{ step.checkinTime }}</div>
                  <div v-if="step.remark">备注：{{ step.remark }}</div>
                </div>
                <div v-else class="step-desc">
                  <el-button type="primary" link size="small" @click.stop="openCheckinDialog(index)">
                    点击签到
                  </el-button>
                </div>
              </template>
            </el-step>
          </el-steps>
        </el-card>

        <el-empty v-else description="请选择订单查看服务记录" />
      </el-col>
    </el-row>

    <el-dialog
      v-model="checkinDialogVisible"
      title="签到确认"
      width="400px"
    >
      <el-form :model="checkinForm" label-width="80px">
        <el-form-item label="步骤">
          <el-input v-model="checkinForm.stepName" disabled />
        </el-form-item>
        <el-form-item label="签到时间">
          <el-date-picker
            v-model="checkinForm.time"
            type="datetime"
            placeholder="选择签到时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="checkinForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请填写备注信息（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkinDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCheckin">确认签到</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../api/request.js'

const orders = ref([])
const selectedOrder = ref(null)
const activeStep = ref(0)
const checkinDialogVisible = ref(false)
const currentStepIndex = ref(0)

const steps = ref([
  { id: 1, title: '出发', checked: false, checkinTime: '', remark: '' },
  { id: 2, title: '到院', checked: false, checkinTime: '', remark: '' },
  { id: 3, title: '挂号', checked: false, checkinTime: '', remark: '' },
  { id: 4, title: '检查', checked: false, checkinTime: '', remark: '' },
  { id: 5, title: '取药', checked: false, checkinTime: '', remark: '' },
  { id: 6, title: '报告', checked: false, checkinTime: '', remark: '' },
  { id: 7, title: '完成', checked: false, checkinTime: '', remark: '' }
])

const checkinForm = ref({
  stepName: '',
  time: '',
  remark: ''
})

const fetchOrders = async () => {
  try {
    const data = await request.get('/orders')
    orders.value = data.filter(o => ['servicing', 'in_service', 'assigned'].includes(o.status))
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  }
}

const fetchServiceRecords = async (orderId) => {
  try {
    const data = await request.get(`/service/records/${orderId}`)
    if (data && data.length > 0) {
      data.forEach(record => {
        const stepIndex = steps.value.findIndex(s => s.title === record.status)
        if (stepIndex !== -1) {
          steps.value[stepIndex].checked = true
          steps.value[stepIndex].checkinTime = record.created_at
          steps.value[stepIndex].remark = record.remark
        }
      })
      updateActiveStep()
    }
  } catch (error) {
    console.error('获取服务记录失败')
  }
}

const updateActiveStep = () => {
  const firstUnchecked = steps.value.findIndex(s => !s.checked)
  activeStep.value = firstUnchecked === -1 ? steps.value.length : firstUnchecked
}

const selectOrder = (row) => {
  selectedOrder.value = row
  steps.value.forEach(step => {
    step.checked = false
    step.checkinTime = ''
    step.remark = ''
  })
  fetchServiceRecords(row.id)
}

const getStepDescription = (step) => {
  return step.checked ? step.checkinTime : ''
}

const getStepStatus = (index) => {
  if (steps.value[index].checked) return 'success'
  if (index === activeStep.value) return 'process'
  if (index < activeStep.value) return 'success'
  return 'wait'
}

const handleStepClick = (index) => {
  if (index <= activeStep.value) {
    openCheckinDialog(index)
  }
}

const openCheckinDialog = (index) => {
  if (index > activeStep.value && !steps.value[index].checked) {
    ElMessage.warning('请按顺序完成签到')
    return
  }
  currentStepIndex.value = index
  checkinForm.value = {
    stepName: steps.value[index].title,
    time: new Date(),
    remark: steps.value[index].remark || ''
  }
  checkinDialogVisible.value = true
}

const handleCheckin = async () => {
  try {
    await request.post('/service/records', {
      order_id: selectedOrder.value.id,
      status: checkinForm.value.stepName,
      location: '',
      remark: checkinForm.value.remark,
      image_url: ''
    })
    
    steps.value[currentStepIndex.value].checked = true
    steps.value[currentStepIndex.value].checkinTime = checkinForm.value.time
    steps.value[currentStepIndex.value].remark = checkinForm.value.remark
    
    updateActiveStep()
    ElMessage.success('签到成功')
    checkinDialogVisible.value = false
  } catch (error) {
    ElMessage.error('签到失败')
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.service-record {
  padding: 20px;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-info {
  font-size: 14px;
  color: #909399;
}

.step-title {
  cursor: pointer;
  font-weight: 500;
}

.step-desc {
  font-size: 13px;
  color: #606266;
  margin-top: 5px;
}
</style>
