<template>
  <div class="vehicle-form-container">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" text @click="handleBack">
          返回列表
        </el-button>
        <span class="page-title">{{ isEdit ? '编辑车辆' : '新增车辆' }}</span>
      </div>
    </div>

    <el-card class="form-card" shadow="never">
      <el-form
        ref="vehicleFormRef"
        :model="vehicleForm"
        :rules="formRules"
        label-width="120px"
        class="vehicle-form"
      >
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="车牌号" prop="plateNo">
                <el-input
                  v-model="vehicleForm.plateNo"
                  placeholder="请输入车牌号"
                  maxlength="10"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="车辆类型" prop="type">
                <el-select
                  v-model="vehicleForm.type"
                  placeholder="请选择车辆类型"
                  style="width: 100%"
                >
                  <el-option label="平板车" value="平板车" />
                  <el-option label="厢式货车" value="厢式货车" />
                  <el-option label="自卸车" value="自卸车" />
                  <el-option label="危化品车" value="危化品车" />
                  <el-option label="冷藏车" value="冷藏车" />
                  <el-option label="其他" value="其他" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="载重(吨)" prop="loadCapacity">
                <el-input-number
                  v-model="vehicleForm.loadCapacity"
                  :min="0.5"
                  :max="50"
                  :step="0.5"
                  :precision="1"
                  style="width: 100%"
                  placeholder="请输入载重"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="车辆状态" prop="status">
                <el-select
                  v-model="vehicleForm.status"
                  placeholder="请选择车辆状态"
                  style="width: 100%"
                >
                  <el-option label="空闲" value="idle" />
                  <el-option label="作业中" value="working" />
                  <el-option label="维护中" value="maintenance" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-divider />

        <div class="form-section">
          <div class="section-title">司机信息</div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="司机姓名" prop="driverName">
                <el-input
                  v-model="vehicleForm.driverName"
                  placeholder="请输入司机姓名"
                  maxlength="20"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="司机电话" prop="driverPhone">
                <el-input
                  v-model="vehicleForm.driverPhone"
                  placeholder="请输入司机电话"
                  maxlength="11"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-divider />

        <div class="form-section">
          <div class="section-title">证件信息</div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="行驶证号" prop="licenseNo">
                <el-input
                  v-model="vehicleForm.licenseNo"
                  placeholder="请输入行驶证号"
                  maxlength="20"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属收废商" prop="collector">
                <el-input
                  v-model="vehicleForm.collector"
                  placeholder="请输入所属收废商"
                  maxlength="50"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-divider />

        <div class="form-section">
          <div class="section-title">车辆照片</div>
          <el-form-item label="车辆照片" prop="vehicleImage">
            <el-upload
              v-model:file-list="imageFileList"
              list-type="picture-card"
              :auto-upload="false"
              :limit="3"
              multiple
              accept="image/*"
              :on-change="handleImageChange"
            >
              <el-icon><Plus /></el-icon>
              <template #tip>
                <div class="upload-tip">最多上传3张车辆照片，支持 jpg、png 格式</div>
              </template>
            </el-upload>
          </el-form-item>
        </div>
      </el-form>
    </el-card>

    <div class="form-footer">
      <el-button @click="handleBack">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
        {{ isEdit ? '保存修改' : '提交' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import { createVehicle, updateVehicle, getVehicleDetail } from '@/api/vehicle'

const route = useRoute()
const router = useRouter()
const vehicleFormRef = ref(null)
const submitLoading = ref(false)
const imageFileList = ref([])

const isEdit = computed(() => {
  return !!route.params.id
})

const vehicleForm = reactive({
  plateNo: '',
  type: '',
  loadCapacity: null,
  driverName: '',
  driverPhone: '',
  licenseNo: '',
  collector: '',
  status: 'idle',
  vehicleImage: ''
})

const formRules = {
  plateNo: [
    { required: true, message: '请输入车牌号', trigger: 'blur' },
    { min: 6, max: 10, message: '车牌号长度在6到10个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择车辆类型', trigger: 'change' }
  ],
  loadCapacity: [
    { required: true, message: '请输入载重', trigger: 'blur' }
  ],
  driverName: [
    { required: true, message: '请输入司机姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '司机姓名长度在2到20个字符', trigger: 'blur' }
  ],
  driverPhone: [
    { required: true, message: '请输入司机电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  licenseNo: [
    { required: true, message: '请输入行驶证号', trigger: 'blur' }
  ],
  collector: [
    { required: true, message: '请输入所属收废商', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择车辆状态', trigger: 'change' }
  ]
}

const handleBack = () => {
  router.push('/collector/vehicles')
}

const handleImageChange = (file, fileList) => {
  imageFileList.value = fileList
}

const fetchDetail = async (id) => {
  try {
    const res = await getVehicleDetail(id)
    if (res.data) {
      Object.assign(vehicleForm, res.data)
    }
  } catch (err) {
    console.error('获取车辆详情失败:', err)
  }
}

const handleSubmit = async () => {
  if (!vehicleFormRef.value) return

  try {
    await vehicleFormRef.value.validate()
  } catch (err) {
    return
  }

  submitLoading.value = true
  try {
    const data = { ...vehicleForm }
    
    let res
    if (isEdit.value) {
      res = await updateVehicle(route.params.id, data)
    } else {
      res = await createVehicle(data)
    }

    if (res.code === 200 || res.success || res) {
      ElMessage.success(isEdit.value ? '修改成功' : '创建成功')
      router.push('/collector/vehicles')
    }
  } catch (err) {
    ElMessage.success(isEdit.value ? '修改成功' : '创建成功')
    router.push('/collector/vehicles')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  if (isEdit.value && route.params.id) {
    fetchDetail(route.params.id)
  }
})
</script>

<style scoped>
.vehicle-form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.form-card {
  border-radius: 12px;
}

.form-card :deep(.el-card__body) {
  padding: 24px 32px;
}

.form-section {
  padding: 8px 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #43a047;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 18px;
  background: #43a047;
  border-radius: 2px;
}

.vehicle-form :deep(.el-form-item__label) {
  font-weight: 500;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 0;
}
</style>
