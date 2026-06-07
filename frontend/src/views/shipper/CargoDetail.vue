<template>
  <div class="cargo-detail-page">
    <el-page-header @back="goBack" class="page-header">
      <template #content>
        <span class="page-title">货源详情</span>
        <el-tag :type="getStatusType(cargo.status)" size="large" style="margin-left: 12px">
          {{ getStatusText(cargo.status) }}
        </el-tag>
      </template>
    </el-page-header>

    <el-card shadow="hover" style="margin-top: 20px" v-loading="loading">
      <template #header>
        <span class="card-title">匹配流程</span>
      </template>
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="货源发布" description="已发布" />
        <el-step title="司机报价" :description="bids.length > 0 ? `${bids.length}条报价` : '等待报价'" />
        <el-step title="接受报价" :description="hasAcceptedBid ? '已选择司机' : '等待选择'" />
        <el-step title="签约完成" :description="cargo.status === 'signed' || cargo.status === 'accepted' || cargo.status === 'transporting' || cargo.status === 'completed' ? '已签约' : '待签约'" />
        <el-step title="运单生成">
          <template #description>
            <span v-if="matchedWaybill">
              <el-link type="primary" @click="goToWaybill">
                {{ matchedWaybill.waybill_no }}
              </el-link>
            </span>
            <span v-else>待生成</span>
          </template>
        </el-step>
      </el-steps>
    </el-card>

    <el-card shadow="hover" v-if="matchedWaybill" class="waybill-card" style="margin-top: 20px">
      <div class="waybill-content">
        <div class="waybill-icon">
          <el-icon :size="40" color="#67c23a"><DocumentChecked /></el-icon>
        </div>
        <div class="waybill-info">
          <div class="waybill-title">已生成运单</div>
          <div class="waybill-no">运单号: {{ matchedWaybill.waybill_no }}</div>
        </div>
        <el-button type="primary" @click="goToWaybill">查看运单详情</el-button>
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :lg="16" :md="24">
        <el-card shadow="hover" v-loading="loading">
          <template #header>
            <span class="card-title">货源信息</span>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="货源ID">{{ cargo.id }}</el-descriptions-item>
            <el-descriptions-item label="货物名称">{{ cargo.cargo_name }}</el-descriptions-item>
            <el-descriptions-item label="货物类型">{{ cargo.cargo_type }}</el-descriptions-item>
            <el-descriptions-item label="数量">{{ cargo.quantity }}件</el-descriptions-item>
            <el-descriptions-item label="重量">{{ cargo.weight }}吨</el-descriptions-item>
            <el-descriptions-item label="体积">{{ cargo.volume }}m³</el-descriptions-item>
            <el-descriptions-item label="运输距离">{{ cargo.distance }}km</el-descriptions-item>
            <el-descriptions-item label="期望价格">¥{{ cargo.expected_price?.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="所需车型">{{ cargo.vehicle_type_required }}</el-descriptions-item>
            <el-descriptions-item label="所需车长">{{ cargo.vehicle_length_required }}米</el-descriptions-item>
            <el-descriptions-item label="装货时间">{{ formatDate(cargo.loading_time) }}</el-descriptions-item>
            <el-descriptions-item label="卸货时间">{{ formatDate(cargo.delivery_time) }}</el-descriptions-item>
            <el-descriptions-item label="出发地" :span="2">
              {{ cargo.departure_city }} {{ cargo.departure_address }}
            </el-descriptions-item>
            <el-descriptions-item label="目的地" :span="2">
              {{ cargo.destination_city }} {{ cargo.destination_address }}
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ cargo.remarks || '无' }}</el-descriptions-item>
            <el-descriptions-item label="发布时间" :span="2">{{ formatDate(cargo.created_at) }}</el-descriptions-item>
          </el-descriptions>

          <div class="action-bar" v-if="['pending', 'published', 'trading'].includes(cargo.status)">
            <el-button type="danger" :loading="cancelling" @click="handleCancel">
              取消货源
            </el-button>
          </div>
        </el-card>

        <el-card shadow="hover" style="margin-top: 20px" v-loading="loading">
          <template #header>
            <span class="card-title">定价依据</span>
          </template>
          
          <div class="pricing-basis">
            <div class="formula-block">
              <div class="formula-title">定价公式</div>
              <el-alert type="info" :closable="false" class="formula-alert">
                <code class="price-formula">
                  suggested_price = base_price × distance_factor × vehicle_factor × time_factor
                </code>
              </el-alert>
            </div>

            <el-row :gutter="16" class="pricing-factors">
              <el-col :xs="12" :sm="6">
                <div class="factor-card">
                  <div class="factor-label">基础价</div>
                  <div class="factor-value">¥{{ cargo.base_price?.toFixed(2) || '0.00' }}</div>
                  <div class="factor-name">base_price</div>
                </div>
              </el-col>
              <el-col :xs="12" :sm="6">
                <div class="factor-card">
                  <div class="factor-label">距离系数</div>
                  <div class="factor-value">{{ cargo.distance_factor?.toFixed(3) || '1.000' }}</div>
                  <div class="factor-name">distance_factor</div>
                </div>
              </el-col>
              <el-col :xs="12" :sm="6">
                <div class="factor-card">
                  <div class="factor-label">车型系数</div>
                  <div class="factor-value">{{ cargo.vehicle_factor?.toFixed(3) || '1.000' }}</div>
                  <div class="factor-name">vehicle_factor</div>
                </div>
              </el-col>
              <el-col :xs="12" :sm="6">
                <div class="factor-card">
                  <div class="factor-label">时效系数</div>
                  <div class="factor-value">{{ cargo.time_factor?.toFixed(3) || '1.000' }}</div>
                  <div class="factor-name">time_factor</div>
                </div>
              </el-col>
            </el-row>

            <el-divider />

            <div class="price-result">
              <div class="price-range">
                <span class="range-label">价格区间:</span>
                <span class="range-value">¥{{ cargo.min_price?.toFixed(2) || '0.00' }} ~ ¥{{ cargo.max_price?.toFixed(2) || '0.00' }}</span>
              </div>
              <div class="suggested-price">
                <span class="suggested-label">建议价:</span>
                <span class="suggested-value">¥{{ cargo.suggested_price?.toFixed(2) || '0.00' }}</span>
              </div>
              <div v-if="acceptedBidPrice > 0" class="price-comparison">
                <el-alert :type="priceComparisonType" :closable="false" class="comparison-alert">
                  <span>实际成交价: </span>
                  <strong>¥{{ acceptedBidPrice.toFixed(2) }}</strong>
                  <span> (较建议价{{ priceComparisonText }})</span>
                </el-alert>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" style="margin-top: 20px" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="card-title">司机报价</span>
              <el-badge :value="bids.length" class="bid-badge" />
            </div>
          </template>

          <el-table :data="bids" stripe v-if="bids.length > 0" :row-class-name="getBidRowClassName">
            <el-table-column label="司机信息" min-width="180">
              <template #default="{ row }">
                <div class="driver-info">
                  <el-avatar :size="48">{{ row.driver_name?.charAt(0) }}</el-avatar>
                  <div class="driver-detail">
                    <div class="driver-name">{{ row.driver_name }}</div>
                    <div class="driver-phone">{{ row.driver_phone }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="信用评分" width="120">
              <template #default="{ row }">
                <div class="credit-score">
                  <span class="score-value">{{ row.credit_score || 0 }}</span>
                  <span class="score-max">/100</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="车辆信息" min-width="160">
              <template #default="{ row }">
                <div>{{ row.vehicle_type }} / {{ row.vehicle_length }}米</div>
                <div class="plate-number">{{ row.plate_number }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="bid_price" label="报价(元)" width="120">
              <template #default="{ row }">
                <span class="bid-price">¥{{ row.bid_price?.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="bid_time" label="报价时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.bid_time) }}
              </template>
            </el-table-column>
            <el-table-column label="留言" min-width="150" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="bid-message">{{ row.message || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'accepted' ? 'success' : 'info'">
                  {{ row.status === 'accepted' ? '已接受' : '待确认' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    :disabled="!['pending', 'published', 'trading'].includes(cargo.status) || row.status === 'accepted'"
                    @click="handleAcceptBid(row)"
                  >
                    接受报价
                  </el-button>
                  <el-button
                    type="success"
                    link
                    size="small"
                    :disabled="addingWhitelist === row.id"
                    @click="handleAddWhitelist(row)"
                  >
                    加入熟车
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-else description="暂无司机报价" />
        </el-card>
      </el-col>

      <el-col :lg="8" :md="24">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">价格信息</span>
          </template>
          <div class="price-info">
            <div class="price-item">
              <span class="price-label">期望价格</span>
              <span class="price-value">¥{{ cargo.expected_price?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="price-item">
              <span class="price-label">建议价格</span>
              <span class="price-value suggested">¥{{ cargo.suggested_price?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="price-item" v-if="bids.length > 0">
              <span class="price-label">最低报价</span>
              <span class="price-value min">¥{{ minBidPrice?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="price-item" v-if="bids.length > 0">
              <span class="price-label">平均报价</span>
              <span class="price-value">¥{{ avgBidPrice?.toFixed(2) || '0.00' }}</span>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" style="margin-top: 20px">
          <template #header>
            <span class="card-title">报价统计</span>
          </template>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ bids.length }}</div>
              <div class="stat-label">报价数量</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ acceptedBidsCount }}</div>
              <div class="stat-label">已接受</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="acceptDialogVisible" title="确认接受报价" width="400px">
      <div v-if="selectedBid" class="confirm-content">
        <p>确定要接受以下司机的报价吗？</p>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="司机">{{ selectedBid.driver_name }}</el-descriptions-item>
          <el-descriptions-item label="报价">¥{{ selectedBid.bid_price?.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="车型">{{ selectedBid.vehicle_type }} / {{ selectedBid.vehicle_length }}米</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="acceptDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="accepting" @click="confirmAccept">确认接受</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DocumentChecked } from '@element-plus/icons-vue'
import { shipperApi, waybillApi } from '../../api/index'

const route = useRoute()
const router = useRouter()
const cargoId = route.params.id

const loading = ref(false)
const cancelling = ref(false)
const accepting = ref(false)
const addingWhitelist = ref(null)
const acceptDialogVisible = ref(false)
const selectedBid = ref(null)
const matchedWaybill = ref(null)

const cargo = ref({})
const bids = ref([])

const currentStep = computed(() => {
  const status = cargo.value.status
  if (status === 'signed' || status === 'accepted' || status === 'transporting' || status === 'completed') {
    return matchedWaybill.value ? 4 : 3
  }
  if (hasAcceptedBid.value) {
    return 2
  }
  if (bids.value.length > 0) {
    return 1
  }
  return 0
})

const hasAcceptedBid = computed(() => {
  return bids.value.some(b => b.status === 'accepted')
})

const acceptedBidPrice = computed(() => {
  const acceptedBid = bids.value.find(b => b.status === 'accepted')
  return acceptedBid ? acceptedBid.bid_price : 0
})

const priceComparisonType = computed(() => {
  const diff = acceptedBidPrice.value - (cargo.value.suggested_price || 0)
  if (diff < 0) return 'success'
  if (diff > 0) return 'warning'
  return 'info'
})

const priceComparisonText = computed(() => {
  const diff = acceptedBidPrice.value - (cargo.value.suggested_price || 0)
  if (diff < 0) return `低¥${Math.abs(diff).toFixed(2)}`
  if (diff > 0) return `高¥${diff.toFixed(2)}`
  return '持平'
})

const minBidPrice = computed(() => {
  if (bids.value.length === 0) return 0
  return Math.min(...bids.value.map(b => b.bid_price || 0))
})

const avgBidPrice = computed(() => {
  if (bids.value.length === 0) return 0
  const total = bids.value.reduce((sum, b) => sum + (b.bid_price || 0), 0)
  return total / bids.value.length
})

const acceptedBidsCount = computed(() => {
  return bids.value.filter(b => b.status === 'accepted').length
})

function getStatusType(status) {
  const map = {
    pending: 'warning',
    published: 'warning',
    trading: 'primary',
    signed: 'success',
    accepted: 'primary',
    transporting: 'primary',
    completed: 'success',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    pending: '待报价',
    published: '待报价',
    trading: '议价中',
    signed: '已签约',
    accepted: '已接单',
    transporting: '运输中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

function getBidRowClassName({ row }) {
  return row.status === 'accepted' ? 'accepted-bid-row' : ''
}

function goBack() {
  router.push('/shipper/cargo')
}

function goToWaybill() {
  if (matchedWaybill.value) {
    router.push(`/waybill/${matchedWaybill.value.id}`)
  }
}

async function fetchWaybill() {
  try {
    const res = await waybillApi.getList({ cargo_id: cargoId, page: 1, page_size: 10 })
    const waybills = res.data?.list || res.data?.items || res.data || []
    if (waybills.length > 0) {
      matchedWaybill.value = waybills[0]
    }
  } catch (e) {
    console.error('Fetch waybill error:', e)
  }
}

async function fetchDetail() {
  loading.value = true
  try {
    const res = await shipperApi.getCargoDetail(cargoId)
    const data = res.data || {}
    cargo.value = data
    bids.value = data.bids || []
    await fetchWaybill()
  } catch (e) {
    ElMessage.error('获取货源详情失败')
  } finally {
    loading.value = false
  }
}

async function handleCancel() {
  try {
    await ElMessageBox.confirm('确定要取消该货源吗？取消后所有报价将失效。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  cancelling.value = true
  try {
    await shipperApi.cancelCargo(cargoId)
    ElMessage.success('货源已取消')
    cargo.value.status = 'cancelled'
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '取消失败')
  } finally {
    cancelling.value = false
  }
}

function handleAcceptBid(bid) {
  selectedBid.value = bid
  acceptDialogVisible.value = true
}

async function handleAddWhitelist(bid) {
  addingWhitelist.value = bid.id
  try {
    await shipperApi.addWhitelist({
      driver_id: bid.driver_id,
      driver_name: bid.driver_name,
      phone: bid.driver_phone
    })
    ElMessage.success('已加入熟车白名单')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '添加失败')
  } finally {
    addingWhitelist.value = null
  }
}

async function confirmAccept() {
  if (!selectedBid.value) return
  accepting.value = true
  try {
    await shipperApi.acceptBid(cargoId, {
      bid_id: selectedBid.value.id,
      driver_id: selectedBid.value.driver_id,
      price: selectedBid.value.bid_price
    })
    ElMessage.success('报价已接受，运单已创建')
    acceptDialogVisible.value = false
    fetchDetail()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '接受失败')
  } finally {
    accepting.value = false
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.cargo-detail-page {
  padding: 0;
}
.page-header {
  margin-bottom: 20px;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-weight: 600;
  font-size: 16px;
}
.bid-badge {
  margin-left: 10px;
}
.driver-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.driver-detail {
  flex: 1;
}
.driver-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}
.driver-phone {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}
.plate-number {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
.bid-price {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}
.bid-message {
  font-size: 13px;
  color: #606266;
}
.action-buttons {
  display: flex;
  gap: 8px;
}
.credit-score {
  display: flex;
  align-items: baseline;
  justify-content: center;
}
.score-value {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}
.score-max {
  font-size: 12px;
  color: #909399;
  margin-left: 2px;
}
:deep(.accepted-bid-row) {
  background-color: #f0f9eb !important;
}
:deep(.accepted-bid-row td) {
  background-color: #f0f9eb !important;
}
.action-bar {
  margin-top: 20px;
  text-align: right;
}
.price-info {
  padding: 10px 0;
}
.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}
.price-item:last-child {
  border-bottom: none;
}
.price-label {
  font-size: 14px;
  color: #606266;
}
.price-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.price-value.min {
  color: #67c23a;
}
.price-value.suggested {
  color: #e6a23c;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.stat-item {
  text-align: center;
  padding: 20px 0;
  background-color: #f5f7fa;
  border-radius: 8px;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
.confirm-content {
  margin-bottom: 20px;
}
.confirm-content p {
  margin-bottom: 12px;
  color: #606266;
}
.waybill-card {
  background: linear-gradient(135deg, #f0f9eb 0%, #e8f5e8 100%);
  border: 1px solid #67c23a;
}
.waybill-content {
  display: flex;
  align-items: center;
  gap: 20px;
}
.waybill-icon {
  flex-shrink: 0;
}
.waybill-info {
  flex: 1;
}
.waybill-title {
  font-size: 18px;
  font-weight: 600;
  color: #67c23a;
  margin-bottom: 4px;
}
.waybill-no {
  font-size: 14px;
  color: #606266;
}
.pricing-basis {
  padding: 10px 0;
}
.formula-block {
  margin-bottom: 20px;
}
.formula-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 10px;
}
.formula-alert {
  margin-bottom: 0;
}
.price-formula {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  color: #409eff;
  background-color: #ecf5ff;
  padding: 2px 6px;
  border-radius: 4px;
}
.pricing-factors {
  margin-top: 20px;
}
.factor-card {
  text-align: center;
  padding: 16px 8px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
}
.factor-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}
.factor-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}
.factor-name {
  font-size: 11px;
  color: #909399;
  font-family: monospace;
}
.price-result {
  text-align: center;
}
.price-range {
  margin-bottom: 12px;
}
.range-label {
  font-size: 14px;
  color: #606266;
  margin-right: 8px;
}
.range-value {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}
.suggested-price {
  margin-bottom: 16px;
}
.suggested-label {
  font-size: 14px;
  color: #606266;
  margin-right: 8px;
}
.suggested-value {
  font-size: 28px;
  font-weight: bold;
  color: #e6a23c;
}
.comparison-alert {
  margin-top: 16px;
  text-align: left;
}
</style>
