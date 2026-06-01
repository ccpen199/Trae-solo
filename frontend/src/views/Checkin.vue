<template>
  <div class="checkin">
    <el-card>
      <template #header><span>入园核验</span></template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="二维码核验" name="qr">
          <el-form :inline="true">
            <el-form-item label="二维码">
              <el-input v-model="qrCode" placeholder="扫描或输入二维码" style="width: 300px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="checkinByQr">核验入园</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="证件核验" name="id">
          <el-form :inline="true">
            <el-form-item label="身份证号">
              <el-input v-model="idCard" placeholder="请输入身份证号" style="width: 300px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="checkinById">核验入园</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="车牌核验" name="plate">
          <el-form :inline="true">
            <el-form-item label="车牌号">
              <el-input v-model="licensePlate" placeholder="请输入车牌号" style="width: 300px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="checkinByPlate">核验入园</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <el-divider />

      <div v-if="appointment" class="appointment-info">
        <h4>预约信息</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="预约号">{{ appointment.appointment_no }}</el-descriptions-item>
          <el-descriptions-item label="访客">{{ appointment.visitor_name }}</el-descriptions-item>
          <el-descriptions-item label="企业">{{ appointment.enterprise_name }}</el-descriptions-item>
          <el-descriptions-item label="被访人">{{ appointment.contact_person }}</el-descriptions-item>
          <el-descriptions-item label="车牌">{{ appointment.license_plate || '无' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(appointment.status)">{{ statusText(appointment.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预约到达" :span="2">{{ formatTime(appointment.scheduled_arrival) }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <el-alert v-if="error" :type="errorType" :title="error" show-icon style="margin-top: 20px">
        <template v-if="showHandleBtn" #default>
          <el-button size="small" type="primary" plain @click="forceCheckin">特殊处理</el-button>
        </template>
      </el-alert>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { checkin } from '../api'

const activeTab = ref('qr')
const qrCode = ref('')
const idCard = ref('')
const licensePlate = ref('')
const appointment = ref(null)
const error = ref('')
const errorCode = ref('')

const errorType = computed(() => {
  if (['EXPIRED', 'PENDING_REVIEW', 'REJECTED'].includes(errorCode.value)) return 'warning'
  return 'error'
})

const showHandleBtn = computed(() => {
  return ['EXPIRED', 'ID_MISMATCH', 'PLATE_MISMATCH', 'PENDING_REVIEW'].includes(errorCode.value)
})

const reset = () => {
  appointment.value = null
  error.value = ''
  errorCode.value = ''
}

const doCheckin = async (data) => {
  reset()
  try {
    const res = await checkin.do(data)
    if (res.data.success) {
      appointment.value = res.data.appointment
      ElMessage.success('入园成功')
    }
  } catch (e) {
    const data = e.response?.data
    error.value = data?.error || '核验失败'
    errorCode.value = data?.errorCode || ''
    if (data?.appointment) {
      appointment.value = data.appointment
    }
  }
}

const checkinByQr = () => doCheckin({ qrCode: qrCode.value, method: 'qrcode', gateNo: '东门' })
const checkinById = () => doCheckin({ idCard: idCard.value, method: 'idcard', gateNo: '东门' })
const checkinByPlate = () => doCheckin({ licensePlate: licensePlate.value, method: 'plate', gateNo: '东门' })

const forceCheckin = async () => {
  if (!appointment.value) return
  try {
    const res = await checkin.do({ appointmentId: appointment.value.id, method: 'manual', gateNo: '东门' })
    if (res.data.success) {
      appointment.value = res.data.appointment
      error.value = ''
      ElMessage.success('入园成功')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

const statusType = (s) => ({ pending: 'info', checked_in: 'success', checked_out: '' }[s] || '')
const statusText = (s) => ({ pending: '待入园', checked_in: '已入园', checked_out: '已离园' }[s] || s)
const formatTime = (t) => t ? t.slice(0, 16) : ''
</script>

<style scoped>
.appointment-info h4 {
  margin-bottom: 15px;
  color: #333;
}
</style>
