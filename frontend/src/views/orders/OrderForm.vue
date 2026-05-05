<template>
  <div class="order-form">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-button @click="goBack">
            <el-icon><ArrowLeft /></el-icon>返回
          </el-button>
          <span>{{ isEdit ? '编辑订单' : '创建订单' }}</span>
        </div>
      </template>
      
      <el-form
        ref="orderFormRef"
        :model="orderForm"
        :rules="orderRules"
        label-width="120px"
        class="form-container"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customer_name">
              <el-input v-model="orderForm.customer_name" placeholder="请输入客户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="customer_phone">
              <el-input v-model="orderForm.customer_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="订单类型" prop="order_type">
              <el-select v-model="orderForm.order_type" placeholder="请选择订单类型" style="width: 100%">
                <el-option label="普通运输" value="normal" />
                <el-option label="急件运输" value="urgent" />
                <el-option label="冷藏运输" value="cold" />
                <el-option label="危险品运输" value="danger" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="orderForm.priority" placeholder="请选择优先级" style="width: 100%">
                <el-option label="普通" :value="1" />
                <el-option label="紧急" :value="2" />
                <el-option label="特急" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">起点信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="起点地址" prop="origin_address">
              <el-input v-model="orderForm.origin_address" placeholder="请输入起点详细地址" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="起点经度" prop="origin_lng">
              <el-input-number v-model="orderForm.origin_lng" :precision="6" :step="0.0001" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="起点纬度" prop="origin_lat">
              <el-input-number v-model="orderForm.origin_lat" :precision="6" :step="0.0001" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">终点信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="终点地址" prop="dest_address">
              <el-input v-model="orderForm.dest_address" placeholder="请输入终点详细地址" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="终点经度" prop="dest_lng">
              <el-input-number v-model="orderForm.dest_lng" :precision="6" :step="0.0001" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="终点纬度" prop="dest_lat">
              <el-input-number v-model="orderForm.dest_lat" :precision="6" :step="0.0001" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">费用信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划出发时间" prop="plan_departure_time">
              <el-date-picker
                v-model="orderForm.plan_departure_time"
                type="datetime"
                placeholder="选择日期时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划到达时间" prop="plan_arrival_time">
              <el-date-picker
                v-model="orderForm.plan_arrival_time"
                type="datetime"
                placeholder="选择日期时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="运费金额" prop="total_fee">
              <el-input-number v-model="orderForm.total_fee" :precision="2" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">货物信息</el-divider>
        
        <el-table :data="orderForm.cargo" style="width: 100%; margin-bottom: 16px;">
          <el-table-column label="货物名称" min-width="120">
            <template #default="{ row, $index }">
              <el-input v-model="orderForm.cargo[$index].cargo_name" placeholder="货物名称" />
            </template>
          </el-table-column>
          <el-table-column label="货物类型" width="120">
            <template #default="{ row, $index }">
              <el-select v-model="orderForm.cargo[$index].cargo_type" placeholder="类型" style="width: 100%">
                <el-option label="普通货物" value="normal" />
                <el-option label="易碎品" value="fragile" />
                <el-option label="冷藏品" value="cold" />
                <el-option label="危险品" value="danger" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="重量(kg)" width="100">
            <template #default="{ row, $index }">
              <el-input-number v-model="orderForm.cargo[$index].weight" :min="0" :precision="2" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="体积(m³)" width="100">
            <template #default="{ row, $index }">
              <el-input-number v-model="orderForm.cargo[$index].volume" :min="0" :precision="2" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="数量" width="80">
            <template #default="{ row, $index }">
              <el-input-number v-model="orderForm.cargo[$index].quantity" :min="0" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="包装方式" width="120">
            <template #default="{ row, $index }">
              <el-input v-model="orderForm.cargo[$index].packaging" placeholder="包装" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" link @click="removeCargo($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-button type="primary" @click="addCargo">
          <el-icon><Plus /></el-icon>添加货物
        </el-button>
        
        <el-divider content-position="left">备注信息</el-divider>
        
        <el-form-item label="备注">
          <el-input v-model="orderForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">
            <el-icon><Check /></el-icon>{{ isEdit ? '保存修改' : '创建订单' }}
          </el-button>
          <el-button @click="resetForm">
            <el-icon><RefreshRight /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getOrderDetail, createOrder, updateOrder } from '@/api/orders'

const router = useRouter()
const route = useRoute()

const orderFormRef = ref(null)
const submitLoading = ref(false)
const isEdit = computed(() => !!route.params.id)

const defaultCargo = {
  cargo_name: '',
  cargo_type: 'normal',
  weight: 0,
  volume: 0,
  quantity: 1,
  packaging: '',
  special_requirements: ''
}

const orderForm = reactive({
  customer_name: '',
  customer_phone: '',
  origin_address: '',
  origin_lat: 0,
  origin_lng: 0,
  dest_address: '',
  dest_lat: 0,
  dest_lng: 0,
  order_type: 'normal',
  priority: 1,
  plan_departure_time: '',
  plan_arrival_time: '',
  total_fee: 0,
  remark: '',
  cargo: [{ ...defaultCargo }]
})

const orderRules = {
  customer_name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  customer_phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  origin_address: [{ required: true, message: '请输入起点地址', trigger: 'blur' }],
  dest_address: [{ required: true, message: '请输入终点地址', trigger: 'blur' }]
}

const goBack = () => {
  router.back()
}

const addCargo = () => {
  orderForm.cargo.push({ ...defaultCargo })
}

const removeCargo = (index) => {
  if (orderForm.cargo.length > 1) {
    orderForm.cargo.splice(index, 1)
  } else {
    ElMessage.warning('至少保留一项货物信息')
  }
}

const fetchOrderDetail = async () => {
  if (!route.params.id) return
  
  try {
    const res = await getOrderDetail(route.params.id)
    orderForm.customer_name = res.customer_name || ''
    orderForm.customer_phone = res.customer_phone || ''
    orderForm.origin_address = res.origin_address || ''
    orderForm.origin_lat = res.origin_lat || 0
    orderForm.origin_lng = res.origin_lng || 0
    orderForm.dest_address = res.dest_address || ''
    orderForm.dest_lat = res.dest_lat || 0
    orderForm.dest_lng = res.dest_lng || 0
    orderForm.order_type = res.order_type || 'normal'
    orderForm.priority = res.priority || 1
    orderForm.total_fee = res.total_fee || 0
    orderForm.remark = res.remark || ''
    orderForm.plan_departure_time = res.plan_departure_time ? dayjs(res.plan_departure_time).toDate() : ''
    orderForm.plan_arrival_time = res.plan_arrival_time ? dayjs(res.plan_arrival_time).toDate() : ''
    
    if (res.cargo && res.cargo.length > 0) {
      orderForm.cargo = res.cargo.map(item => ({
        cargo_name: item.cargo_name || '',
        cargo_type: item.cargo_type || 'normal',
        weight: item.weight || 0,
        volume: item.volume || 0,
        quantity: item.quantity || 1,
        packaging: item.packaging || '',
        special_requirements: item.special_requirements || ''
      }))
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
  }
}

const submitForm = async () => {
  if (!orderFormRef.value) return
  
  await orderFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const data = {
          customer_name: orderForm.customer_name,
          customer_phone: orderForm.customer_phone,
          origin_address: orderForm.origin_address,
          origin_lat: orderForm.origin_lat,
          origin_lng: orderForm.origin_lng,
          dest_address: orderForm.dest_address,
          dest_lat: orderForm.dest_lat,
          dest_lng: orderForm.dest_lng,
          order_type: orderForm.order_type,
          priority: orderForm.priority,
          total_fee: orderForm.total_fee,
          remark: orderForm.remark,
          plan_departure_time: orderForm.plan_departure_time ? dayjs(orderForm.plan_departure_time).format('YYYY-MM-DD HH:mm:ss') : null,
          plan_arrival_time: orderForm.plan_arrival_time ? dayjs(orderForm.plan_arrival_time).format('YYYY-MM-DD HH:mm:ss') : null,
          cargo: orderForm.cargo.filter(item => item.cargo_name)
        }
        
        if (isEdit.value) {
          await updateOrder(route.params.id, data)
          ElMessage.success('订单修改成功')
        } else {
          await createOrder(data)
          ElMessage.success('订单创建成功')
        }
        
        router.push('/orders')
      } catch (error) {
        console.error('提交失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const resetForm = () => {
  if (orderFormRef.value) {
    orderFormRef.value.resetFields()
  }
  orderForm.cargo = [{ ...defaultCargo }]
}

onMounted(() => {
  if (isEdit.value) {
    fetchOrderDetail()
  }
})
</script>

<style scoped>
.order-form {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-container {
  max-width: 1000px;
}
</style>
