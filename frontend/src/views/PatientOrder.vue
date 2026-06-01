<template>
  <div class="patient-order">
    <el-card class="form-card" v-if="!showSuccess">
      <template #header>
        <div class="card-header">
          <span>患者预约申请</span>
        </div>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="患者姓名" prop="patientName">
              <el-input v-model="form.patientName" placeholder="请输入患者姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="选择医院" prop="hospital">
              <el-select v-model="form.hospital" placeholder="请选择医院" style="width: 100%">
                <el-option label="北京协和医院" value="北京协和医院" />
                <el-option label="北京大学第一医院" value="北京大学第一医院" />
                <el-option label="中国人民解放军总医院" value="中国人民解放军总医院" />
                <el-option label="上海瑞金医院" value="上海瑞金医院" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="选择科室" prop="department">
              <el-select v-model="form.department" placeholder="请选择科室" style="width: 100%">
                <el-option label="内科" value="内科" />
                <el-option label="外科" value="外科" />
                <el-option label="妇产科" value="妇产科" />
                <el-option label="儿科" value="儿科" />
                <el-option label="骨科" value="骨科" />
                <el-option label="眼科" value="眼科" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="就诊日期" prop="serviceDate">
              <el-date-picker
                v-model="form.serviceDate"
                type="date"
                placeholder="选择就诊日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="就诊时间" prop="serviceTime">
              <el-time-picker
                v-model="form.serviceTime"
                placeholder="选择就诊时间"
                style="width: 100%"
                value-format="HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="服务类型" prop="serviceType">
              <el-select v-model="form.serviceType" placeholder="请选择服务类型" style="width: 100%">
                <el-option label="普通陪诊" value="普通陪诊" />
                <el-option label="深度陪诊" value="深度陪诊" />
                <el-option label="全程陪诊" value="全程陪诊" />
                <el-option label="专项陪诊" value="专项陪诊" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务时长" prop="duration">
              <el-select v-model="form.duration" placeholder="请选择服务时长" style="width: 100%">
                <el-option label="2小时" :value="2" />
                <el-option label="4小时" :value="4" />
                <el-option label="6小时" :value="6" />
                <el-option label="全天(8小时)" :value="8" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="病情摘要" prop="condition">
          <el-input
            v-model="form.condition"
            type="textarea"
            :rows="3"
            placeholder="请简要描述患者病情，便于陪诊师了解情况"
          />
        </el-form-item>
        <el-form-item label="陪诊事项" prop="services">
          <el-checkbox-group v-model="form.services">
            <el-checkbox label="排队挂号" value="排队挂号">排队挂号</el-checkbox>
            <el-checkbox label="陪同就诊" value="陪同就诊">陪同就诊</el-checkbox>
            <el-checkbox label="代取报告" value="代取报告">代取报告</el-checkbox>
            <el-checkbox label="协助缴费" value="协助缴费">协助缴费</el-checkbox>
            <el-checkbox label="取药送药" value="取药送药">取药送药</el-checkbox>
            <el-checkbox label="接送服务" value="接送服务">接送服务</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="特殊需求" prop="specialRequirements">
          <el-input
            v-model="form.specialRequirements"
            type="textarea"
            :rows="2"
            placeholder="如有特殊需求请在此说明（如：轮椅、翻译等）"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">提交预约</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="success-card" v-else>
      <div class="success-content">
        <el-icon :size="80" color="#67C23A">
          <CircleCheck />
        </el-icon>
        <h2>预约提交成功！</h2>
        <p class="order-no">订单号：{{ orderInfo.orderNo }}</p>
        
        <el-descriptions :column="2" border class="order-detail">
          <el-descriptions-item label="患者姓名">{{ orderInfo.patientName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ orderInfo.phone }}</el-descriptions-item>
          <el-descriptions-item label="就诊医院">{{ orderInfo.hospital }}</el-descriptions-item>
          <el-descriptions-item label="就诊科室">{{ orderInfo.department }}</el-descriptions-item>
          <el-descriptions-item label="就诊日期">{{ orderInfo.serviceDate }}</el-descriptions-item>
          <el-descriptions-item label="就诊时间">{{ orderInfo.serviceTime }}</el-descriptions-item>
          <el-descriptions-item label="服务时长">{{ orderInfo.duration }}小时</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag type="warning">待派单</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预计服务费" :span="2">
            <span class="fee-highlight">¥{{ orderInfo.estimatedFee }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="next-steps">
          <h3>服务流程进度</h3>
          <el-steps :active="0" finish-status="success" align-center>
            <el-step title="提交预约" description="已完成" />
            <el-step title="客服派单" description="进行中" />
            <el-step title="陪诊服务" description="待开始" />
            <el-step title="完成结算" description="待开始" />
          </el-steps>
        </div>

        <div class="tips">
          <el-alert
            title="温馨提示"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>我们的客服人员将在1小时内与您联系，确认订单详情并匹配合适的陪诊师。</p>
              <p>您可以在"订单管理"中查看订单状态和派单进度。</p>
            </template>
          </el-alert>
        </div>

        <div class="action-buttons">
          <el-button type="primary" @click="goToOrderList">查看订单列表</el-button>
          <el-button @click="createNew">继续预约</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheck } from '@element-plus/icons-vue'
import request from '../api/request.js'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)
const showSuccess = ref(false)
const orderInfo = ref({})

const form = reactive({
  patientName: '',
  phone: '',
  hospital: '',
  department: '',
  serviceDate: '',
  serviceTime: '',
  serviceType: '普通陪诊',
  duration: 2,
  condition: '',
  services: [],
  specialRequirements: ''
})

const rules = {
  patientName: [{ required: true, message: '请输入患者姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  hospital: [{ required: true, message: '请选择医院', trigger: 'change' }],
  department: [{ required: true, message: '请选择科室', trigger: 'change' }],
  serviceDate: [{ required: true, message: '请选择就诊日期', trigger: 'change' }],
  serviceTime: [{ required: true, message: '请选择就诊时间', trigger: 'change' }],
  serviceType: [{ required: true, message: '请选择服务类型', trigger: 'change' }]
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    const orderData = {
      patientName: form.patientName,
      phone: form.phone,
      hospital: form.hospital,
      department: form.department,
      appointmentTime: `${form.serviceDate}T${form.serviceTime}`,
      duration: form.duration,
      condition: form.condition,
      services: form.services.length ? form.services : [form.serviceType],
      specialRequirements: form.specialRequirements
    }

    console.log('提交订单数据:', orderData)
    
    const response = await request.post('/orders', orderData)
    
    console.log('后端响应:', response)
    
    const orderDataResult = response.data || response
    
    orderInfo.value = {
      orderNo: orderDataResult.order_no || response.orderNo || response.order?.order_no || 'ORD' + Date.now(),
      patientName: form.patientName,
      phone: form.phone,
      hospital: form.hospital,
      department: form.department,
      serviceDate: form.serviceDate,
      serviceTime: form.serviceTime,
      duration: form.duration,
      estimatedFee: form.duration * 100
    }
    
    console.log('订单信息:', orderInfo.value)
    console.log('准备设置 showSuccess')
    
    showSuccess.value = true
    
    console.log('showSuccess 值:', showSuccess.value)
    
    await nextTick()
    
    console.log('nextTick 后 showSuccess 值:', showSuccess.value)
    
    ElMessage.success('预约提交成功！')
  } catch (error) {
    console.error('提交失败:', error)
    if (error.errors) {
      ElMessage.error('请完善表单信息')
    } else {
      ElMessage.error(error.message || '提交失败，请重试')
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const goToOrderList = () => {
  router.push('/order-list')
}

const createNew = () => {
  showSuccess.value = false
  resetForm()
}
</script>

<style scoped>
.patient-order {
  padding: 20px;
}

.form-card {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.success-card {
  max-width: 700px;
  margin: 0 auto;
}

.success-content {
  text-align: center;
  padding: 30px;
}

.success-content h2 {
  color: #67C23A;
  margin: 20px 0;
}

.order-no {
  font-size: 18px;
  color: #303133;
  margin-bottom: 30px;
  font-weight: 500;
}

.order-detail {
  margin: 30px 0;
  text-align: left;
}

.fee-highlight {
  font-size: 24px;
  font-weight: 600;
  color: #f56c6c;
}

.next-steps {
  margin: 40px 0;
  text-align: left;
}

.next-steps h3 {
  margin-bottom: 20px;
  color: #303133;
  text-align: center;
}

.tips {
  margin: 30px 0;
  text-align: left;
}

.action-buttons {
  margin-top: 30px;
}

.action-buttons .el-button {
  margin: 0 10px;
}
</style>
