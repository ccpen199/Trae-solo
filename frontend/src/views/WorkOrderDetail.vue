<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">工单详情</h1>
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <div v-loading="loading">
      <div class="detail-section chart-container">
        <div class="detail-section-title">工单信息</div>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">工单号：</span>
              <span class="detail-value">{{ workOrder.work_order_no }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">来源：</span>
              <span class="detail-value">{{ getSourceText(workOrder.source) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">类型：</span>
              <span class="detail-value">{{ getTypeText(workOrder.work_order_type) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">优先级：</span>
              <span class="detail-value">
                <span :class="getPriorityClass(workOrder.priority)">{{ getPriorityText(workOrder.priority) }}</span>
              </span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">状态：</span>
              <span class="detail-value">
                <span :class="getStatusClass(workOrder.status)">{{ getStatusText(workOrder.status) }}</span>
              </span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">指派给：</span>
              <span class="detail-value">{{ workOrder.assign_to || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">创建时间：</span>
              <span class="detail-value">{{ workOrder.created_at }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">完成时间：</span>
              <span class="detail-value">{{ workOrder.verify_time || '-' }}</span>
            </div>
          </el-col>
        </el-row>
        <div class="detail-item" style="margin-top: 12px">
          <span class="detail-label">工单标题：</span>
          <span class="detail-value">{{ workOrder.title }}</span>
        </div>
        <div class="detail-item" style="margin-top: 12px">
          <span class="detail-label">工单描述：</span>
          <span class="detail-value">{{ workOrder.description }}</span>
        </div>
      </div>

      <el-row :gutter="16" v-if="relatedComplaint || relatedOrder">
        <el-col :span="12" v-if="relatedComplaint">
          <div class="detail-section chart-container">
            <div class="detail-section-title">关联投诉</div>
            <div class="detail-item">
              <span class="detail-label">投诉编号：</span>
              <span class="detail-value">
                <el-button type="primary" link @click="viewComplaint">{{ relatedComplaint.complaint_no }}</el-button>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">投诉类型：</span>
              <span class="detail-value">{{ getComplaintTypeText(relatedComplaint.complaint_type) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">投诉人：</span>
              <span class="detail-value">{{ relatedComplaint.complainant_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">投诉时间：</span>
              <span class="detail-value">{{ relatedComplaint.complaint_time }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="12" v-if="relatedOrder">
          <div class="detail-section chart-container">
            <div class="detail-section-title">关联订单</div>
            <div class="detail-item">
              <span class="detail-label">订单号：</span>
              <span class="detail-value">
                <el-button type="primary" link @click="viewOrder">{{ relatedOrder.order_no }}</el-button>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">平台：</span>
              <span class="detail-value">{{ relatedOrder.platform_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">金额：</span>
              <span class="detail-value">{{ relatedOrder.amount }} 元</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">订单时间：</span>
              <span class="detail-value">{{ relatedOrder.order_time }}</span>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <div class="detail-section chart-container">
            <div class="detail-section-title">司机信息</div>
            <div class="detail-item">
              <span class="detail-label">姓名：</span>
              <span class="detail-value">
                <el-button v-if="driver.id" type="primary" link @click="viewDriver">{{ driver.name }}</el-button>
                <span v-else>-</span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">手机号：</span>
              <span class="detail-value">{{ driver.phone || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">身份证号：</span>
              <span class="detail-value">{{ driver.id_card || '-' }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-section chart-container">
            <div class="detail-section-title">车辆信息</div>
            <div class="detail-item">
              <span class="detail-label">车牌号：</span>
              <span class="detail-value">
                <el-button v-if="vehicle.id" type="primary" link @click="viewVehicle">{{ vehicle.plate_no }}</el-button>
                <span v-else>-</span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">品牌型号：</span>
              <span class="detail-value">{{ vehicle.brand ? `${vehicle.brand} ${vehicle.model}` : '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">营运证号：</span>
              <span class="detail-value">{{ vehicle.operation_license_no || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">所属平台：</span>
              <span class="detail-value">{{ vehicle.platform_name || '-' }}</span>
            </div>
          </div>
        </el-col>
      </el-row>

      <div class="detail-section chart-container">
        <div class="detail-section-title">核查记录</div>
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in verificationRecords"
            :key="index"
            :timestamp="record.time"
            :type="getTimelineType(record.action)"
          >
            <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600">{{ record.actionText }}</h4>
            <p style="margin: 0; color: #6b7280">{{ record.remark }}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af">核查人：{{ record.operator }}</p>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-if="verificationRecords.length === 0" description="暂无核查记录" />
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
const workOrder = ref({})
const relatedComplaint = ref(null)
const relatedOrder = ref(null)
const driver = ref({})
const vehicle = ref({})
const verificationRecords = ref([])

const getStatusText = (status) => {
  const map = { pending: '待派单', processing: '处理中', completed: '已完成', closed: '已关闭' }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = { pending: 'tag-warning', processing: 'tag-info', completed: 'tag-success', closed: 'tag-danger' }
  return map[status] || 'tag-info'
}

const getPriorityText = (priority) => {
  const map = { high: '高', medium: '中', low: '低' }
  return map[priority] || priority
}

const getPriorityClass = (priority) => {
  const map = { high: 'tag-danger', medium: 'tag-warning', low: 'tag-info' }
  return map[priority] || 'tag-info'
}

const getTypeText = (type) => {
  const map = { order_check: '订单抽查', complaint: '投诉', manual: '手动创建' }
  return map[type] || type
}

const getSourceText = (source) => {
  const map = { order: '订单抽查', complaint: '投诉', manual: '手动创建' }
  return map[source] || source
}

const getComplaintTypeText = (type) => {
  const map = { price: '价格纠纷', service: '服务态度', detour: '绕路', refuse: '拒载', other: '其他' }
  return map[type] || type
}

const getTimelineType = (action) => {
  const map = { create: 'primary', assign: 'warning', process: 'info', verify: 'success', close: 'danger' }
  return map[action] || 'primary'
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const data = await request.get(`/work-orders/${id}`)
    workOrder.value = data
    relatedComplaint.value = data.complaint_id
      ? { id: data.complaint_id, complaint_no: data.complaint_no, complaint_type: '', complainant_name: '', complaint_time: '' }
      : null
    relatedOrder.value = data.order_id
      ? { id: data.order_id, order_no: data.platform_order_no, platform_name: data.platform_name, amount: '', order_time: '' }
      : null
    driver.value = data.driver_id
      ? { id: data.driver_id, name: data.driver_name, phone: data.driver_phone, id_card: data.driver_id_card }
      : {}
    vehicle.value = data.vehicle_id
      ? { id: data.vehicle_id, plate_no: data.plate_no, brand: data.brand, model: data.model, operation_license_no: '', platform_name: data.platform_name }
      : {}
    verificationRecords.value = data.verify_result
      ? [{ action: 'verify', actionText: '核查完成', time: data.verify_time, remark: data.verify_result, operator: data.assign_to }]
      : []
  } catch (error) {
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const viewComplaint = () => {
  if (relatedComplaint.value?.id) {
    router.push(`/complaints/${relatedComplaint.value.id}`)
  }
}

const viewOrder = () => {
  if (relatedOrder.value?.id) {
    router.push(`/orders/${relatedOrder.value.id}`)
  }
}

const viewDriver = () => {
  if (driver.value?.id) {
    router.push(`/drivers/${driver.value.id}`)
  }
}

const viewVehicle = () => {
  if (vehicle.value?.id) {
    router.push(`/vehicles/${vehicle.value.id}`)
  }
}

onMounted(() => {
  fetchDetail()
})
</script>
