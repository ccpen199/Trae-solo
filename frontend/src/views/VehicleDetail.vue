<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">车辆详情</h1>
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <div v-loading="loading">
      <div class="detail-section chart-container">
        <div class="detail-section-title">基本信息</div>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">车牌号：</span>
              <span class="detail-value">{{ vehicle.plate_no }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">车辆类型：</span>
              <span class="detail-value">{{ getVehicleTypeText(vehicle.vehicle_type) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">品牌：</span>
              <span class="detail-value">{{ vehicle.brand }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">型号：</span>
              <span class="detail-value">{{ vehicle.model }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">颜色：</span>
              <span class="detail-value">{{ vehicle.color }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">所属平台：</span>
              <span class="detail-value">{{ vehicle.platform_name }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">注册日期：</span>
              <span class="detail-value">{{ vehicle.register_date }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">审核状态：</span>
              <span class="detail-value">
                <span :class="getAuditStatusClass(vehicle.audit_status)">{{ getAuditStatusText(vehicle.audit_status) }}</span>
              </span>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-row :gutter="16">
        <el-col :span="12">
          <div class="detail-section chart-container">
            <div class="detail-section-title">行驶证信息</div>
            <div class="detail-item">
              <span class="detail-label">行驶证号：</span>
              <span class="detail-value">{{ vehicle.vehicle_license_no }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">所有人：</span>
              <span class="detail-value">{{ vehicle.owner_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">有效期至：</span>
              <span class="detail-value">{{ vehicle.vehicle_license_expiry_date }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-section chart-container">
            <div class="detail-section-title">营运证信息</div>
            <div class="detail-item">
              <span class="detail-label">营运证号：</span>
              <span class="detail-value">{{ vehicle.operation_license_no }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">有效期至：</span>
              <span class="detail-value">{{ vehicle.operation_license_expiry_date }}</span>
            </div>
          </div>
        </el-col>
      </el-row>

      <div class="detail-section chart-container">
        <div class="detail-section-title">关联司机</div>
        <el-table :data="drivers" border stripe>
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="id_card" label="身份证号" min-width="150" />
          <el-table-column prop="phone" label="手机号" width="120" />
          <el-table-column prop="taxi_qualification_no" label="从业资格证号" min-width="150" />
          <el-table-column prop="audit_status" label="审核状态" width="100" align="center">
            <template #default="{ row }">
              <span :class="getAuditStatusClass(row.audit_status)">{{ getAuditStatusText(row.audit_status) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewDriver(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="detail-section chart-container">
        <div class="detail-section-title">历史订单</div>
        <el-table :data="orders" border stripe>
          <el-table-column prop="platform_order_no" label="订单号" min-width="150" />
          <el-table-column prop="driver_name" label="司机" width="100" />
          <el-table-column prop="pickup_address" label="上车地点" min-width="150" />
          <el-table-column prop="dropoff_address" label="下车地点" min-width="150" />
          <el-table-column prop="total_amount" label="金额(元)" width="100" />
          <el-table-column prop="pickup_time" label="订单时间" width="180" />
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewOrder(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const vehicle = ref({})
const drivers = ref([])
const orders = ref([])

const getVehicleTypeText = (type) => {
  const map = { 'taxi': '出租车', 'ride-hailing': '网约车', 'carpool': '顺风车' }
  return map[type] || type
}

const getAuditStatusText = (status) => {
  const map = { pending: '待审核', approved: '已通过', rejected: '已驳回' }
  return map[status] || status
}

const getAuditStatusClass = (status) => {
  const map = { pending: 'tag-warning', approved: 'tag-success', rejected: 'tag-danger' }
  return map[status] || 'tag-info'
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const data = await request.get(`/vehicles/${id}`)
    vehicle.value = data
    drivers.value = data.drivers
    orders.value = data.orders
  } catch (error) {
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const viewDriver = (row) => {
  router.push(`/drivers/${row.id}`)
}

const viewOrder = (row) => {
  router.push(`/orders/${row.id}`)
}

onMounted(() => {
  fetchDetail()
})
</script>
