<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">司机详情</h1>
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
              <span class="detail-label">姓名：</span>
              <span class="detail-value">{{ driver.name }}</span>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">身份证号：</span>
              <span class="detail-value">{{ driver.id_card }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">手机号：</span>
              <span class="detail-value">{{ driver.phone }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">所属平台：</span>
              <span class="detail-value">{{ driver.platform_name }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">审核状态：</span>
              <span class="detail-value">
                <span :class="getAuditStatusClass(driver.audit_status)">{{ getAuditStatusText(driver.audit_status) }}</span>
              </span>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-row :gutter="16">
        <el-col :span="12">
          <div class="detail-section chart-container">
            <div class="detail-section-title">驾驶证信息</div>
            <div class="detail-item">
              <span class="detail-label">驾驶证号：</span>
              <span class="detail-value">{{ driver.driver_license_no }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">准驾车型：</span>
              <span class="detail-value">{{ driver.driver_license_type }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">有效期至：</span>
              <span class="detail-value">{{ driver.driver_license_expiry_date }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">初次领证日期：</span>
              <span class="detail-value">{{ driver.driver_license_issue_date }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-section chart-container">
            <div class="detail-section-title">从业资格证信息</div>
            <div class="detail-item">
              <span class="detail-label">资格证号：</span>
              <span class="detail-value">{{ driver.taxi_qualification_no }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">有效期至：</span>
              <span class="detail-value">{{ driver.taxi_qualification_expiry_date }}</span>
            </div>
          </div>
        </el-col>
      </el-row>

      <div class="detail-section chart-container">
        <div class="detail-section-title">关联车辆</div>
        <el-table :data="vehicles" border stripe>
          <el-table-column prop="plate_no" label="车牌号" width="120" />
          <el-table-column prop="audit_status" label="审核状态" width="100" align="center">
            <template #default="{ row }">
              <span :class="getAuditStatusClass(row.audit_status)">{{ getAuditStatusText(row.audit_status) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewVehicle(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="detail-section chart-container">
        <div class="detail-section-title">历史订单</div>
        <el-table :data="orders" border stripe>
          <el-table-column prop="platform_order_no" label="订单号" min-width="150" />
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

      <el-row :gutter="16">
        <el-col :span="12">
          <div class="detail-section chart-container">
            <div class="detail-section-title">投诉记录</div>
            <el-table :data="complaints" border stripe>
              <el-table-column prop="complaint_no" label="投诉编号" width="140" />
              <el-table-column prop="complaint_type" label="投诉类型" width="100">
              <template #default="{ row }">{{ getComplaintTypeText(row.complaint_type) }}</template>
            </el-table-column>
              <el-table-column prop="status" label="状态" width="80" align="center">
                <template #default="{ row }">
                  <span :class="getComplaintStatusClass(row.status)">{{ getComplaintStatusText(row.status) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="complaint_time" label="投诉时间" width="160" />
            </el-table>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-section chart-container">
            <div class="detail-section-title">案件记录</div>
            <el-table :data="cases" border stripe>
              <el-table-column prop="case_no" label="案件编号" width="140" />
              <el-table-column prop="case_type" label="案件类型" width="100" />
              <el-table-column prop="status" label="状态" width="80" align="center">
                <template #default="{ row }">
                  <span :class="getCaseStatusClass(row.status)">{{ getCaseStatusText(row.status) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="initial_fine_amount" label="处罚金额" width="100" />
            </el-table>
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
const driver = ref({})
const vehicles = ref([])
const orders = ref([])
const complaints = ref([])
const cases = ref([])

const getAuditStatusText = (status) => {
  const map = { pending: '待审核', approved: '已通过', rejected: '已驳回' }
  return map[status] || status
}

const getAuditStatusClass = (status) => {
  const map = { pending: 'tag-warning', approved: 'tag-success', rejected: 'tag-danger' }
  return map[status] || 'tag-info'
}

const getComplaintStatusText = (status) => {
  const map = { pending: '待处理', handling: '处理中', handled: '已处理', closed: '已关闭' }
  return map[status] || status
}

const getComplaintStatusClass = (status) => {
  const map = { pending: 'tag-warning', handling: 'tag-info', handled: 'tag-success', closed: 'tag-info' }
  return map[status] || 'tag-info'
}

const getCaseStatusText = (status) => {
  const map = { pending: '待处理', decision_made: '已处罚', appealed: '申诉中', reviewed: '已复核', rectifying: '整改中', closed: '已结案' }
  return map[status] || status
}

const getCaseStatusClass = (status) => {
  const map = { pending: 'tag-warning', decision_made: 'tag-danger', appealed: 'tag-info', reviewed: 'tag-success', rectifying: 'tag-warning', closed: 'tag-success' }
  return map[status] || 'tag-info'
}

const getCaseTypeText = (type) => {
  const map = { unlicensed_operation: '无证运营', detour: '绕路', overcharge: '乱收费', service_issue: '服务问题', safety_violation: '安全违规', other: '其他' }
  return map[type] || type
}

const getComplaintTypeText = (type) => {
  const map = { price_abnormal: '计价异常', detour: '绕路投诉', unlicensed: '无证运营', service_attitude: '服务态度', refusal: '拒载', other: '其他' }
  return map[type] || type
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const data = await request.get(`/drivers/${id}`)
    driver.value = data
    vehicles.value = data.vehicles
    orders.value = data.orders
    complaints.value = data.complaints
    cases.value = data.cases
  } catch (error) {
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const viewVehicle = (row) => {
  router.push(`/vehicles/${row.id}`)
}

const viewOrder = (row) => {
  router.push(`/orders/${row.id}`)
}

onMounted(() => {
  fetchDetail()
})
</script>
