<template>
  <div class="entry-form">
    <el-card>
      <template #header>
        <span>车牌入场登记</span>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        style="max-width: 600px; margin: 0 auto"
      >
        <el-form-item label="车牌号" prop="plateNumber">
          <el-input v-model="form.plateNumber" placeholder="请输入车牌号，如：京A12345" size="large" />
        </el-form-item>

        <el-form-item label="车辆类型">
          <el-radio-group v-model="form.vehicleType">
            <el-radio value="car">小型车</el-radio>
            <el-radio value="truck">大型车</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="入口道闸">
          <el-select v-model="form.gateId" placeholder="请选择入口" style="width: 200px">
            <el-option label="主入口" value="main_gate" />
            <el-option label="侧入口" value="side_gate" />
          </el-select>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" @click="handleSubmit" :loading="loading">
            <el-icon><Check /></el-icon> 确认入场
          </el-button>
          <el-button size="large" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>入场须知</span>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="免费时长">首15分钟免费</el-descriptions-item>
        <el-descriptions-item label="小型车计费">
          ¥5/小时，日封顶 ¥50
        </el-descriptions-item>
        <el-descriptions-item label="大型车计费">
          ¥8/小时，日封顶 ¥80
        </el-descriptions-item>
        <el-descriptions-item label="夜间优惠">
          22:00 - 06:00 享受夜间优惠价 ¥2/小时
        </el-descriptions-item>
        <el-descriptions-item label="月卡说明">
          月卡车辆入场自动识别，无需支付停车费
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orderApi } from '@/api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  plateNumber: '',
  vehicleType: 'car',
  gateId: 'main_gate',
  remark: ''
})

const rules = {
  plateNumber: [
    { required: true, message: '请输入车牌号', trigger: 'blur' },
    { pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4}[A-Z0-9挂学警港澳]?$/, message: '请输入正确的车牌号格式', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await ElMessageBox.confirm(`确认车辆 ${form.plateNumber} 入场？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    })

    loading.value = true
    const res = await orderApi.createEntry({
      plateNumber: form.plateNumber.toUpperCase(),
      vehicleType: form.vehicleType,
      gateId: form.gateId,
      remark: form.remark
    })

    ElMessage.success('入场登记成功')
    
    if (res.data.isMonthlyCard) {
      ElMessage.info(`检测到月卡车辆，月卡有效期至: ${res.data.monthlyCard?.endDate}`)
    }

    router.push(`/orders/${res.data.order.id}`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('入场失败:', error)
    }
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  formRef.value.resetFields()
}
</script>

<style scoped>
.entry-form {
  padding: 0;
}
</style>