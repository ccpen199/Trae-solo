<template>
  <div class="publish-cargo-page">
    <el-card shadow="hover">
      <template #header>
        <span class="card-title">发布货源</span>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="cargo-form"
      >
        <el-divider content-position="left">基本信息</el-divider>

        <el-row :gutter="24">
          <el-col :md="12" :sm="24">
            <el-form-item label="货物名称" prop="cargo_name">
              <el-input v-model="form.cargo_name" placeholder="请输入货物名称" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :sm="24">
            <el-form-item label="货物类型" prop="cargo_type">
              <el-select v-model="form.cargo_type" placeholder="请选择货物类型">
                <el-option label="普通货物" value="普通货物" />
                <el-option label="易碎品" value="易碎品" />
                <el-option label="危险品" value="危险品" />
                <el-option label="冷藏货物" value="冷藏货物" />
                <el-option label="大件货物" value="大件货物" />
                <el-option label="鲜活货物" value="鲜活货物" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :md="8" :sm="24">
            <el-form-item label="重量(吨)" prop="weight">
              <el-input-number v-model="form.weight" :min="0.1" :step="0.1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :md="8" :sm="24">
            <el-form-item label="体积(m³)" prop="volume">
              <el-input-number v-model="form.volume" :min="0.1" :step="0.1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :md="8" :sm="24">
            <el-form-item label="数量(件)" prop="quantity">
              <el-input-number v-model="form.quantity" :min="1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">运输信息</el-divider>

        <el-row :gutter="24">
          <el-col :md="12" :sm="24">
            <el-form-item label="出发城市" prop="departure_city">
              <el-input v-model="form.departure_city" placeholder="请输入出发城市" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :sm="24">
            <el-form-item label="目的城市" prop="destination_city">
              <el-input v-model="form.destination_city" placeholder="请输入目的城市" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :md="12" :sm="24">
            <el-form-item label="出发地址" prop="departure_address">
              <el-input v-model="form.departure_address" placeholder="请输入详细出发地址" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :sm="24">
            <el-form-item label="目的地址" prop="destination_address">
              <el-input v-model="form.destination_address" placeholder="请输入详细目的地址" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :md="8" :sm="24">
            <el-form-item label="运输距离(km)" prop="distance">
              <el-input-number v-model="form.distance" :min="1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :md="8" :sm="24">
            <el-form-item label="所需车型" prop="vehicle_type_required">
              <el-select v-model="form.vehicle_type_required" placeholder="请选择车型">
                <el-option label="平板车" value="平板车" />
                <el-option label="高栏车" value="高栏车" />
                <el-option label="厢式车" value="厢式车" />
                <el-option label="冷藏车" value="冷藏车" />
                <el-option label="自卸车" value="自卸车" />
                <el-option label="半挂车" value="半挂车" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :md="8" :sm="24">
            <el-form-item label="所需车长(米)" prop="vehicle_length_required">
              <el-select v-model="form.vehicle_length_required" placeholder="请选择车长">
                <el-option label="4.2米" value="4.2" />
                <el-option label="6.8米" value="6.8" />
                <el-option label="9.6米" value="9.6" />
                <el-option label="13米" value="13" />
                <el-option label="17.5米" value="17.5" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :md="12" :sm="24">
            <el-form-item label="装货时间" prop="loading_time">
              <el-date-picker
                v-model="form.loading_time"
                type="datetime"
                placeholder="选择装货时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :md="12" :sm="24">
            <el-form-item label="卸货时间" prop="delivery_time">
              <el-date-picker
                v-model="form.delivery_time"
                type="datetime"
                placeholder="选择卸货时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="备注" prop="remarks">
              <el-input
                v-model="form.remarks"
                type="textarea"
                :rows="3"
                placeholder="请输入其他运输要求或备注信息"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">价格估算</el-divider>

        <el-alert
          v-if="priceCalculating"
          title="正在计算价格..."
          type="info"
          :closable="false"
          show-icon
          class="price-alert"
        />

        <el-alert
          v-else-if="priceError"
          :title="priceError"
          type="warning"
          :closable="false"
          show-icon
          class="price-alert"
        />

        <el-row :gutter="24" v-else-if="priceResult">
          <el-col :md="6" :sm="12">
            <div class="price-card">
              <div class="price-label">建议价格</div>
              <div class="price-value primary">¥{{ priceResult.suggested_price?.toFixed(2) || '0.00' }}</div>
            </div>
          </el-col>
          <el-col :md="6" :sm="12">
            <div class="price-card">
              <div class="price-label">距离权重</div>
              <div class="price-value">{{ priceResult.distance_weight?.toFixed(2) || '0.00' }}</div>
            </div>
          </el-col>
          <el-col :md="6" :sm="12">
            <div class="price-card">
              <div class="price-label">车型权重</div>
              <div class="price-value">{{ priceResult.vehicle_weight?.toFixed(2) || '0.00' }}</div>
            </div>
          </el-col>
          <el-col :md="6" :sm="12">
            <div class="price-card">
              <div class="price-label">时效权重</div>
              <div class="price-value">{{ priceResult.time_weight?.toFixed(2) || '0.00' }}</div>
            </div>
          </el-col>
        </el-row>

        <el-form-item class="submit-form-item">
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
            发布货源
          </el-button>
          <el-button size="large" @click="handleReset">重置</el-button>
          <el-button size="large" @click="goBack">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { shipperApi } from '../../api/index'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)
const priceCalculating = ref(false)
const priceError = ref('')
const priceResult = ref(null)
let priceTimer = null

const form = reactive({
  cargo_name: '',
  cargo_type: '',
  weight: 1,
  volume: 1,
  quantity: 1,
  departure_city: '',
  departure_address: '',
  destination_city: '',
  destination_address: '',
  distance: null,
  vehicle_type_required: '',
  vehicle_length_required: '',
  loading_time: '',
  delivery_time: '',
  remarks: ''
})

const rules = {
  cargo_name: [{ required: true, message: '请输入货物名称', trigger: 'blur' }],
  cargo_type: [{ required: true, message: '请选择货物类型', trigger: 'change' }],
  weight: [{ required: true, message: '请输入重量', trigger: 'blur' }],
  volume: [{ required: true, message: '请输入体积', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  departure_city: [{ required: true, message: '请输入出发城市', trigger: 'blur' }],
  departure_address: [{ required: true, message: '请输入出发地址', trigger: 'blur' }],
  destination_city: [{ required: true, message: '请输入目的城市', trigger: 'blur' }],
  destination_address: [{ required: true, message: '请输入目的地址', trigger: 'blur' }],
  distance: [{ required: true, message: '请输入运输距离', trigger: 'blur' }],
  vehicle_type_required: [{ required: true, message: '请选择所需车型', trigger: 'change' }],
  vehicle_length_required: [{ required: true, message: '请选择所需车长', trigger: 'change' }],
  loading_time: [{ required: true, message: '请选择装货时间', trigger: 'change' }],
  delivery_time: [{ required: true, message: '请选择卸货时间', trigger: 'change' }]
}

async function calculatePrice() {
  if (!form.distance || !form.vehicle_type_required || !form.loading_time || !form.delivery_time) {
    priceError.value = '请填写距离、车型、装货时间和卸货时间以获取价格估算'
    priceResult.value = null
    return
  }
  if (new Date(form.delivery_time) <= new Date(form.loading_time)) {
    priceError.value = '卸货时间必须晚于装货时间'
    priceResult.value = null
    return
  }
  priceError.value = ''
  priceCalculating.value = true
  try {
    const res = await shipperApi.calculatePrice({
      distance: form.distance,
      vehicle_type: form.vehicle_type_required,
      loading_time: form.loading_time,
      delivery_time: form.delivery_time,
      weight: form.weight,
      volume: form.volume
    })
    priceResult.value = res.data || {}
  } catch (e) {
    priceError.value = '价格计算失败，请稍后重试'
    priceResult.value = null
  } finally {
    priceCalculating.value = false
  }
}

function debouncedCalculatePrice() {
  if (priceTimer) clearTimeout(priceTimer)
  priceTimer = setTimeout(() => {
    calculatePrice()
  }, 500)
}

watch(
  () => [form.distance, form.vehicle_type_required, form.loading_time, form.delivery_time],
  () => {
    debouncedCalculatePrice()
  }
)

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      await ElMessageBox.confirm('确认发布该货源吗？发布后司机可进行报价。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    submitting.value = true
    try {
      const submitData = {
        ...form,
        expected_price: priceResult.value?.suggested_price || 0
      }
      const res = await shipperApi.publishCargo(submitData)
      ElMessage.success('货源发布成功')
      router.push(`/shipper/cargo/${res.data?.id}`)
    } catch (e) {
      ElMessage.error(e.response?.data?.message || '发布失败，请重试')
    } finally {
      submitting.value = false
    }
  })
}

function handleReset() {
  formRef.value?.resetFields()
  priceResult.value = null
  priceError.value = ''
}

function goBack() {
  router.push('/shipper/cargo')
}

onMounted(() => {
  calculatePrice()
})
</script>

<style scoped>
.publish-cargo-page {
  max-width: 1000px;
  margin: 0 auto;
}
.card-title {
  font-weight: 600;
  font-size: 16px;
}
.cargo-form {
  padding-top: 10px;
}
.price-alert {
  margin-bottom: 20px;
}
.price-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  color: #fff;
  margin-bottom: 20px;
}
.price-card:nth-child(2n) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
.price-card:nth-child(3n) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}
.price-card:nth-child(4n) {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}
.price-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}
.price-value {
  font-size: 28px;
  font-weight: bold;
}
.price-value.primary {
  font-size: 32px;
}
.submit-form-item {
  margin-top: 30px;
  text-align: center;
}
@media (max-width: 768px) {
  .cargo-form {
    label-width: 90px;
  }
  .price-value {
    font-size: 22px;
  }
  .price-value.primary {
    font-size: 26px;
  }
}
</style>
