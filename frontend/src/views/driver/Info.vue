<template>
  <div class="driver-info">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><el-icon><Document /></el-icon> 司机信息维护</span>
        </div>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" class="info-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="驾驶证号" prop="driver_license_no">
              <el-input v-model="form.driver_license_no" placeholder="请输入驾驶证号" maxlength="18" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="准驾车型" prop="driver_license_type">
              <el-select v-model="form.driver_license_type" placeholder="请选择准驾车型" style="width: 100%">
                <el-option label="A1" value="A1" />
                <el-option label="A2" value="A2" />
                <el-option label="A3" value="A3" />
                <el-option label="B1" value="B1" />
                <el-option label="B2" value="B2" />
                <el-option label="C1" value="C1" />
                <el-option label="C2" value="C2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车牌号" prop="vehicle_no">
              <el-input v-model="form.vehicle_no" placeholder="请输入车牌号" maxlength="10" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车辆类型" prop="vehicle_type">
              <el-select v-model="form.vehicle_type" placeholder="请选择车辆类型" style="width: 100%">
                <el-option label="平板车" value="平板车" />
                <el-option label="高栏车" value="高栏车" />
                <el-option label="厢式车" value="厢式车" />
                <el-option label="冷藏车" value="冷藏车" />
                <el-option label="自卸车" value="自卸车" />
                <el-option label="半挂车" value="半挂车" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车长(米)" prop="vehicle_length">
              <el-input-number v-model="form.vehicle_length" :min="1" :max="30" :step="0.5" style="width: 100%" placeholder="请输入车长" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="载重(吨)" prop="vehicle_load">
              <el-input-number v-model="form.vehicle_load" :min="0.5" :max="100" :step="0.5" style="width: 100%" placeholder="请输入载重" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading" size="large">
            <el-icon><Check /></el-icon> 保存信息
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Check } from '@element-plus/icons-vue'
import { driverApi, authApi } from '../../api'

const formRef = ref()
const loading = ref(false)
const form = reactive({
  driver_license_no: '',
  driver_license_type: '',
  vehicle_no: '',
  vehicle_type: '',
  vehicle_length: null,
  vehicle_load: null
})

const rules = {
  driver_license_no: [{ required: true, message: '请输入驾驶证号', trigger: 'blur' }],
  driver_license_type: [{ required: true, message: '请选择准驾车型', trigger: 'change' }],
  vehicle_no: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  vehicle_type: [{ required: true, message: '请选择车辆类型', trigger: 'change' }]
}

async function loadDriverInfo() {
  try {
    const res = await authApi.profile()
    if (res.data?.driver_info) {
      const info = res.data.driver_info
      form.driver_license_no = info.driver_license_no || ''
      form.driver_license_type = info.driver_license_type || ''
      form.vehicle_no = info.vehicle_no || ''
      form.vehicle_type = info.vehicle_type || ''
      form.vehicle_length = info.vehicle_length || null
      form.vehicle_load = info.vehicle_load || null
    }
  } catch (err) {
    console.error(err)
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    await driverApi.submitInfo(form)
    ElMessage.success('司机信息保存成功')
    await loadDriverInfo()
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDriverInfo()
})
</script>

<style scoped>
.driver-info {
  padding: 20px;
}
.card-header {
  font-size: 16px;
  font-weight: 600;
}
.info-form {
  max-width: 800px;
}
</style>
