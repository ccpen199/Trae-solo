<template>
  <div class="create-task-container">
    <el-card class="task-card">
      <template #header>
        <div class="card-header">
          <h2>发布新任务</h2>
        </div>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-divider content-position="left">物品信息</el-divider>

        <el-form-item label="物品名称" prop="item_name">
          <el-input v-model="form.item_name" placeholder="请输入物品名称" />
        </el-form-item>

        <el-form-item label="物品类别" prop="item_category">
          <el-select v-model="form.item_category" placeholder="请选择物品类别" style="width: 100%">
            <el-option label="宠物" value="宠物" />
            <el-option label="生鲜" value="生鲜" />
            <el-option label="证件" value="证件" />
            <el-option label="药品" value="药品" />
            <el-option label="文件" value="文件" />
            <el-option label="电子产品" value="电子产品" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="安全等级" prop="safety_level_id">
          <el-radio-group v-model="form.safety_level_id">
            <el-radio :label="1">
              <span class="safety-option">
                <el-icon><Stamp /></el-icon> 活体
              </span>
            </el-radio>
            <el-radio :label="2">
              <span class="safety-option">
                <el-icon><Warning /></el-icon> 易碎
              </span>
            </el-radio>
            <el-radio :label="3">
              <span class="safety-option">
                <el-icon><Clock /></el-icon> 时效敏感
              </span>
            </el-radio>
            <el-radio :label="4">
              <span class="safety-option">
                <el-icon><Box /></el-icon> 普通
              </span>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="特殊要求" prop="special_requirements">
          <el-input v-model="form.special_requirements" type="textarea" :rows="3" placeholder="请输入特殊要求（如：轻拿轻放、保持低温等）" />
        </el-form-item>

        <el-divider content-position="left">地址信息</el-divider>

        <el-form-item label="取货地址" prop="pickup_address">
          <el-input v-model="form.pickup_address" placeholder="请输入取货地址" />
        </el-form-item>

        <el-form-item label="送货地址" prop="delivery_address">
          <el-input v-model="form.delivery_address" placeholder="请输入送货地址" />
        </el-form-item>

        <el-form-item label="预估距离" prop="distance_km">
          <el-input-number v-model="form.distance_km" :min="0.1" :max="100" :step="0.1" style="width: 100%">
            <template #append>公里</template>
          </el-input-number>
        </el-form-item>

        <el-divider content-position="left">时间要求</el-divider>

        <el-form-item label="取货时间" prop="pickup_time">
          <el-date-picker
            v-model="form.pickup_time"
            type="datetime"
            placeholder="选择取货时间"
            style="width: 100%"
            :disabled-date="disabledDate"
          />
        </el-form-item>

        <el-form-item label="最晚送达" prop="delivery_deadline">
          <el-date-picker
            v-model="form.delivery_deadline"
            type="datetime"
            placeholder="选择最晚送达时间"
            style="width: 100%"
            :disabled-date="disabledDate"
          />
        </el-form-item>

        <el-divider content-position="left">费用预估</el-divider>

        <div class="price-preview">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="price-item">
                <div class="price-label">基础费用</div>
                <div class="price-value">¥{{ pricePreview.base_price || 0 }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="price-item">
                <div class="price-label">动态调整</div>
                <div class="price-value">×{{ pricePreview.dynamic_multiplier || 1.0 }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="price-item highlight">
                <div class="price-label">预估总价</div>
                <div class="price-value">¥{{ pricePreview.final_price || 0 }}</div>
              </div>
            </el-col>
          </el-row>
          <div class="price-hint">
            <el-icon><InfoFilled /></el-icon>
            <span>实际价格可能根据接单时间、物品安全等级等因素有所调整</span>
          </div>
        </div>

        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" @click="handleSubmit" :loading="loading">
            确认发布任务
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { taskApi, pricingApi } from '@/api/modules'

const router = useRouter()

const loading = ref(false)
const formRef = ref()

const form = reactive({
  item_name: '',
  item_category: '',
  safety_level_id: 4,
  special_requirements: '',
  pickup_address: '',
  delivery_address: '',
  distance_km: 1,
  pickup_time: null,
  delivery_deadline: null
})

const pricePreview = ref({
  base_price: 0,
  dynamic_multiplier: 1.0,
  final_price: 0
})

const rules = {
  item_name: [
    { required: true, message: '请输入物品名称', trigger: 'blur' }
  ],
  pickup_address: [
    { required: true, message: '请输入取货地址', trigger: 'blur' }
  ],
  delivery_address: [
    { required: true, message: '请输入送货地址', trigger: 'blur' }
  ],
  distance_km: [
    { required: true, message: '请输入预估距离', trigger: 'blur' }
  ]
}

const disabledDate = (date) => {
  return date.getTime() < Date.now() - 8.64e7
}

const calculatePrice = async () => {
  if (form.distance_km > 0) {
    try {
      const res = await pricingApi.calculate({
        distance_km: form.distance_km,
        safety_level_id: form.safety_level_id,
        pickup_time: form.pickup_time
      })

      if (res.success) {
        const basePrice = res.breakdown.base_price
        const multiplier = res.breakdown.distance_factor * res.breakdown.safety_factor * res.breakdown.time_multiplier

        pricePreview.value = {
          base_price: basePrice.toFixed(2),
          dynamic_multiplier: multiplier.toFixed(2),
          final_price: res.final_price.toFixed(2)
        }
      }
    } catch (error) {
      console.error('计算价格失败:', error)
    }
  }
}

watch(
  () => [form.distance_km, form.safety_level_id, form.pickup_time],
  () => {
    calculatePrice()
  },
  { immediate: true }
)

const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await taskApi.create({
          ...form,
          distance_km: form.distance_km
        })

        if (res.success) {
          ElMessage.success('任务发布成功')
          router.push(`/tasks/${res.task.id}`)
        }
      } catch (error) {
        console.error('发布任务失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.create-task-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 40px 20px;
}

.task-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header h2 {
  margin: 0;
  text-align: center;
  color: #303133;
}

.safety-option {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.price-preview {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.price-item {
  text-align: center;
}

.price-item .price-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.price-item .price-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.price-item.highlight .price-value {
  color: #409eff;
}

.price-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
  color: #909399;
  font-size: 12px;
}
</style>
