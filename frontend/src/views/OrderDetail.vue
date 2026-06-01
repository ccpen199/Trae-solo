<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">订单详情</h1>
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <div v-loading="loading">
      <div class="detail-section chart-container">
        <div class="detail-section-title">订单基本信息</div>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">平台订单号：</span>
              <span class="detail-value">{{ order.platform_order_no }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">平台：</span>
              <span class="detail-value">{{ order.platform_name }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">订单状态：</span>
              <span class="detail-value">
                <span :class="getOrderStatusClass(order.status)">{{ getOrderStatusText(order.status) }}</span>
              </span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">订单时间：</span>
              <span class="detail-value">{{ order.pickup_time }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">订单金额：</span>
              <span class="detail-value">{{ order.total_amount }} 元</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">支付方式：</span>
              <span class="detail-value">{{ order.payment_method }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">行驶里程：</span>
              <span class="detail-value">{{ order.distance }} 公里</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">行驶时长：</span>
              <span class="detail-value">{{ order.duration }} 分钟</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-row :gutter="16">
        <el-col :span="12">
          <div class="detail-section chart-container">
            <div class="detail-section-title">上车地点</div>
            <div class="detail-item">
              <span class="detail-label">地址：</span>
              <span class="detail-value">{{ order.pickup_address }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">经纬度：</span>
              <span class="detail-value">{{ order.pickup_lng }}, {{ order.pickup_lat }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">上车时间：</span>
              <span class="detail-value">{{ order.pickup_time }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-section chart-container">
            <div class="detail-section-title">下车地点</div>
            <div class="detail-item">
              <span class="detail-label">地址：</span>
              <span class="detail-value">{{ order.dropoff_address }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">经纬度：</span>
              <span class="detail-value">{{ order.dropoff_lng }}, {{ order.dropoff_lat }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">下车时间：</span>
              <span class="detail-value">{{ order.dropoff_time }}</span>
            </div>
          </div>
        </el-col>
      </el-row>

      <div class="detail-section chart-container">
        <div class="detail-section-title">计费明细</div>
        <el-table :data="billingDetails" border stripe>
          <el-table-column prop="item" label="项目" width="150" />
          <el-table-column prop="description" label="说明" min-width="200" />
          <el-table-column prop="amount" label="金额(元)" width="120" align="right" />
        </el-table>
        <div style="margin-top: 16px; text-align: right; font-size: 16px; font-weight: 600">
          合计：{{ order.total_amount }} 元
        </div>
      </div>

      <div class="detail-section chart-container">
        <div class="detail-section-title">轨迹点列表</div>
        <el-table :data="trackPoints" border stripe max-height="300">
          <el-table-column prop="index" label="序号" width="80" align="center" />
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="lng" label="经度" width="150" />
          <el-table-column prop="lat" label="纬度" width="150" />
          <el-table-column prop="speed" label="速度(km/h)" width="120" align="center" />
          <el-table-column prop="heading" label="方向" width="100" align="center" />
        </el-table>
      </div>

      <el-row :gutter="16">
        <el-col :span="12">
          <div class="detail-section chart-container">
            <div class="detail-section-title">司机信息</div>
            <div class="detail-item">
              <span class="detail-label">姓名：</span>
              <span class="detail-value">
                <el-button type="primary" link @click="viewDriver">{{ order.driver_name }}</el-button>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">手机号：</span>
              <span class="detail-value">{{ order.driver_phone }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">身份证号：</span>
              <span class="detail-value">{{ order.driver_id_card }}</span>
            </div>

          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-section chart-container">
            <div class="detail-section-title">车辆信息</div>
            <div class="detail-item">
              <span class="detail-label">车牌号：</span>
              <span class="detail-value">
                <el-button type="primary" link @click="viewVehicle">{{ order.plate_no }}</el-button>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">品牌型号：</span>
              <span class="detail-value">{{ order.brand }} {{ order.model }}</span>
            </div>


          </div>
        </el-col>
      </el-row>
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
const order = ref({})
const billingDetails = ref([])
const trackPoints = ref([])

const getOrderStatusText = (status) => {
  const map = { pending: '待接单', accepted: '已接单', picking: '接驾中', ongoing: '行程中', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

const getOrderStatusClass = (status) => {
  const map = { pending: 'tag-warning', accepted: 'tag-info', picking: 'tag-info', ongoing: 'tag-info', completed: 'tag-success', cancelled: 'tag-danger' }
  return map[status] || 'tag-info'
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const data = await request.get(`/orders/${id}`)
    order.value = data
    billingDetails.value = [
      { item: '基础运费', description: '基础运费', amount: data.base_fare || 0 },
      { item: '路桥费', description: '路桥费', amount: data.toll_fee || 0 },
      { item: '停车费', description: '停车费', amount: data.parking_fee || 0 },
      { item: '小费', description: '小费', amount: data.tip_amount || 0 },
      { item: '合计', description: '合计', amount: data.total_amount || 0 }
    ]
    try {
      trackPoints.value = data.trajectory_points ? JSON.parse(data.trajectory_points) : []
    } catch { trackPoints.value = [] }
  } catch (error) {
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const viewDriver = () => {
  if (order.value.driver_id) {
    router.push(`/drivers/${order.value.driver_id}`)
  }
}

const viewVehicle = () => {
  if (order.value.vehicle_id) {
    router.push(`/vehicles/${order.value.vehicle_id}`)
  }
}

onMounted(() => {
  fetchDetail()
})
</script>
