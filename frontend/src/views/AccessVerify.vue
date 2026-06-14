<template>
  <div class="access-verify-page">
    <div class="page-header">
      <h2 class="page-title">扫码开门</h2>
    </div>
    
    <div class="verify-container">
      <el-card class="verify-card">
        <div class="verify-form">
          <el-form :model="form" label-width="100px">
            <el-form-item label="选择设备">
              <el-select v-model="form.device_id" placeholder="请选择门禁设备" style="width: 100%;">
                <el-option v-for="d in devices" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="认证方式">
              <el-radio-group v-model="form.access_type">
                <el-radio value="qrcode">授权码</el-radio>
                <el-radio value="card">门禁卡</el-radio>
                <el-radio value="face">人脸</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item v-if="form.access_type === 'qrcode'" label="授权码">
              <el-input v-model="form.auth_code" placeholder="请输入访客授权码" />
            </el-form-item>
            
            <el-form-item label="体温">
              <el-input-number v-model="form.temperature" :precision="1" :step="0.1" :min="35" :max="42" />
              <span style="margin-left: 10px; color: #909399;">℃</span>
            </el-form-item>
            
            <el-form-item label="口罩检测">
              <el-switch v-model="form.mask_detected" active-text="已戴" inactive-text="未戴" />
            </el-form-item>
          </el-form>
          
          <el-button type="primary" size="large" class="verify-btn" :loading="verifying" @click="handleVerify">
            <el-icon><Key /></el-icon>
            认证开门
          </el-button>
          
          <el-alert v-if="result" :type="resultType" :title="resultTitle" :description="resultDesc" show-icon style="margin-top: 20px;" />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '../store/user'
import { verifyAccess, getAccessDevices } from '../api'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const verifying = ref(false)
const devices = ref([])
const result = ref(null)

const form = reactive({
  device_id: null,
  access_type: 'qrcode',
  auth_code: '',
  temperature: 36.5,
  mask_detected: true
})

const resultType = computed(() => result.value?.success ? 'success' : 'error')
const resultTitle = computed(() => result.value?.success ? '认证通过' : '认证失败')
const resultDesc = computed(() => result.value?.message || '')

async function loadDevices() {
  const res = await getAccessDevices({ status: 'online' })
  devices.value = res.data
  if (devices.value.length > 0) {
    form.device_id = devices.value[0].id
  }
}

async function handleVerify() {
  if (!form.device_id) {
    ElMessage.warning('请选择门禁设备')
    return
  }
  
  verifying.value = true
  try {
    const params = {
      user_id: userStore.userId,
      device_id: form.device_id,
      access_type: form.access_type,
      temperature: form.temperature,
      mask_detected: form.mask_detected ? 1 : 0
    }
    
    if (form.access_type === 'qrcode' && form.auth_code) {
      params.auth_code = form.auth_code
    }
    
    const res = await verifyAccess(params)
    result.value = { success: true, message: '门禁已开启，请通行' }
    ElMessage.success('认证通过')
    
    if (form.temperature > 37.3) {
      ElMessage.warning('体温异常，已自动上报物业')
    }
  } catch (err) {
    result.value = { success: false, message: err.message }
    ElMessage.error(err.message || '认证失败')
  } finally {
    verifying.value = false
  }
}

onMounted(() => {
  loadDevices()
})
</script>

<style scoped>
.access-verify-page {
  padding: 0;
}

.verify-container {
  max-width: 600px;
  margin: 0 auto;
}

.verify-card {
  border: none;
  border-radius: 16px;
  padding: 30px;
}

.verify-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  margin-top: 10px;
}
</style>
