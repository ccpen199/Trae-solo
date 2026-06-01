<template>
  <div class="create-order">
    <el-card>
      <template #header>
        <span>发布货运需求</span>
      </template>
      <el-form :model="form" label-width="120px" style="max-width: 700px;">
        <el-form-item label="订单类型">
          <el-radio-group v-model="form.order_type">
            <el-radio label="instant">即时单</el-radio>
            <el-radio label="appointment">预约单</el-radio>
            <el-radio label="long_distance">长途零担</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="装货地址" required>
          <el-input v-model="form.loading_address" placeholder="请输入详细装货地址" />
        </el-form-item>
        <el-form-item label="卸货地址" required>
          <el-input v-model="form.unloading_address" placeholder="请输入详细卸货地址" />
        </el-form-item>
        <el-form-item label="货物类型">
          <el-select v-model="form.cargo_type" placeholder="请选择" style="width: 100%">
            <el-option label="日用品" value="日用品" />
            <el-option label="电子产品" value="电子产品" />
            <el-option label="家具家电" value="家具家电" />
            <el-option label="建材" value="建材" />
            <el-option label="食品" value="食品" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="货物信息">
          <el-input-number v-model="form.cargo_weight" :min="0" :step="0.1" /> 吨
          <el-input-number v-model="form.cargo_volume" :min="0" :step="0.1" style="margin-left: 20px" /> 方
        </el-form-item>
        <el-form-item label="所需车型">
          <el-select v-model="form.vehicle_type_required" placeholder="请选择车型" style="width: 100%">
            <el-option label="面包车" value="面包车" />
            <el-option label="厢货" value="厢货" />
            <el-option label="平板" value="平板" />
            <el-option label="大货车" value="大货车" />
          </el-select>
        </el-form-item>
        <el-form-item label="车辆长度">
          <el-select v-model="form.vehicle_length_required" placeholder="请选择车长" style="width: 100%">
            <el-option :label="4.2 + '米'" :value="4.2" />
            <el-option :label="5.2 + '米'" :value="5.2" />
            <el-option :label="6.8 + '米'" :value="6.8" />
            <el-option :label="9.6 + '米'" :value="9.6" />
            <el-option :label="13 + '米'" :value="13" />
            <el-option :label="17.5 + '米'" :value="17.5" />
          </el-select>
        </el-form-item>
        <el-form-item label="装卸要求">
          <el-input v-model="form.loading_requirements" type="textarea" :rows="3" placeholder="请描述装卸要求，如是否需要搬运、是否需要特殊设备等" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="其他需要说明的信息" />
        </el-form-item>
        <el-form-item v-if="estimatedPrice > 0">
          <div class="price-preview">
            <span>预估运费：</span>
            <span class="price">¥{{ estimatedPrice.toFixed(2) }}</span>
            <span class="price-desc">（含平台服务费 ¥{{ (estimatedPrice * 0.1).toFixed(2) }}）</span>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="calculatePrice">预估价格</el-button>
          <el-button type="success" @click="submitOrder">立即发布</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { orderAPI, pricingAPI } from '@/api'

const router = useRouter()
const user = JSON.parse(localStorage.getItem('user') || '{}')
const estimatedPrice = ref(0)

const form = ref({
  order_type: 'instant',
  loading_address: '',
  unloading_address: '',
  cargo_type: '',
  cargo_weight: 0,
  cargo_volume: 0,
  vehicle_type_required: '厢货',
  vehicle_length_required: 4.2,
  loading_requirements: '',
  remark: ''
})

const calculatePrice = async () => {
  const distance = 15 + Math.random() * 20
  const res = await pricingAPI.calculate({
    distance,
    vehicle_type: form.value.vehicle_type_required,
    order_type: form.value.order_type
  })
  if (res.success) {
    estimatedPrice.value = res.data.price
    ElMessage.info(`预估距离 ${distance.toFixed(1)} 公里，运费 ¥${res.data.price.toFixed(2)}`)
  }
}

const submitOrder = async () => {
  if (!form.value.loading_address || !form.value.unloading_address) {
    ElMessage.warning('请填写装货和卸货地址')
    return
  }
  const res = await orderAPI.create({
    ...form.value,
    shipper_id: user.id
  })
  if (res.success) {
    ElMessage.success('订单发布成功')
    router.push('/shipper/orders')
  } else {
    ElMessage.error(res.message)
  }
}
</script>

<style scoped>
.price-preview {
  padding: 15px 20px;
  background: #ecf5ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.price {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}
.price-desc {
  font-size: 12px;
  color: #909399;
}
</style>
