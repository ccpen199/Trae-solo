<template>
  <div class="waybill-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><el-icon><Document /></el-icon> 运单列表</span>
          <el-button type="primary" @click="loadData" :loading="loading">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </template>
      <el-radio-group v-model="statusFilter" class="status-filter" @change="handleStatusChange">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="created">待装货</el-radio-button>
        <el-radio-button value="loading">装货中</el-radio-button>
        <el-radio-button value="in_transit">运输中</el-radio-button>
        <el-radio-button value="completed">已完成</el-radio-button>
        <el-radio-button value="exception">异常</el-radio-button>
      </el-radio-group>
      <el-table :data="tableData" v-loading="loading" stripe row-key="id" @expand-change="handleExpandChange">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content" v-loading="expandLoadingMap[row.id]">
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="expand-section">
                    <div class="expand-title">定价明细</div>
                    <div class="pricing-grid" v-if="row.base_price != null">
                      <div class="pricing-item">
                        <span class="pricing-label">基础价</span>
                        <span class="pricing-value">¥{{ row.base_price }}</span>
                      </div>
                      <div class="pricing-item">
                        <span class="pricing-label">距离系数</span>
                        <span class="pricing-value">×{{ row.distance_factor }}</span>
                      </div>
                      <div class="pricing-item">
                        <span class="pricing-label">车型系数</span>
                        <span class="pricing-value">×{{ row.vehicle_factor }}</span>
                      </div>
                      <div class="pricing-item">
                        <span class="pricing-label">时效系数</span>
                        <span class="pricing-value">×{{ row.time_factor }}</span>
                      </div>
                      <div class="pricing-item highlight">
                        <span class="pricing-label">建议价</span>
                        <span class="pricing-value">¥{{ row.suggested_price }}</span>
                      </div>
                      <div class="pricing-item">
                        <span class="pricing-label">价格区间</span>
                        <span class="pricing-value">¥{{ row.min_price }} ~ ¥{{ row.max_price }}</span>
                      </div>
                      <div class="pricing-item highlight">
                        <span class="pricing-label">成交价</span>
                        <span class="pricing-value agreed">¥{{ row.agreed_price }}</span>
                      </div>
                    </div>
                    <div v-else class="no-data">暂无定价数据</div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="expand-section">
                    <div class="expand-title">报价记录</div>
                    <div v-if="expandBidsMap[row.id]?.length" class="bids-list">
                      <div v-for="bid in expandBidsMap[row.id]" :key="bid.id" class="bid-item">
                        <div class="bid-header">
                          <span class="bid-driver">{{ bid.driver_name }}</span>
                          <el-tag size="small" :type="getBidStatusType(bid.status)">
                            {{ getBidStatusText(bid.status) }}
                          </el-tag>
                        </div>
                        <div class="bid-details">
                          <span class="bid-price">¥{{ bid.bid_price }}</span>
                          <span v-if="bid.message" class="bid-message">{{ bid.message }}</span>
                        </div>
                      </div>
                    </div>
                    <div v-else class="no-data">暂无报价记录</div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="waybill_no" label="运单号" width="200" />
        <el-table-column prop="cargo_name" label="货物名称" min-width="150" />
        <el-table-column label="路线" min-width="200">
          <template #default="{ row }">
            <div class="route">
              <span class="city">{{ row.start_city }}</span>
              <el-icon class="arrow"><Right /></el-icon>
              <span class="city">{{ row.end_city }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="司机/货主" min-width="150">
          <template #default="{ row }">
            <div v-if="currentRole === 'shipper'">
              <div>{{ row.driver_name }}</div>
              <div class="sub-text">{{ row.vehicle_no }}</div>
            </div>
            <div v-else>
              <div>{{ row.shipper_name }}</div>
              <div class="sub-text">{{ row.company_name }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="定价依据" width="120" align="center">
          <template #default="{ row }">
            <el-popover placement="left" :width="280" trigger="hover" v-if="row.suggested_price != null">
              <template #reference>
                <el-button type="primary" link>
                  <el-icon><DataLine /></el-icon> 查看
                </el-button>
              </template>
              <div class="pricing-popover">
                <div class="pricing-row">
                  <span class="pricing-label">基础价</span>
                  <span class="pricing-value">¥{{ row.base_price }}</span>
                </div>
                <div class="pricing-row">
                  <span class="pricing-label">距离系数</span>
                  <span class="pricing-value">×{{ row.distance_factor }}</span>
                </div>
                <div class="pricing-row">
                  <span class="pricing-label">车型系数</span>
                  <span class="pricing-value">×{{ row.vehicle_factor }}</span>
                </div>
                <div class="pricing-row">
                  <span class="pricing-label">时效系数</span>
                  <span class="pricing-value">×{{ row.time_factor }}</span>
                </div>
                <el-divider style="margin: 8px 0" />
                <div class="pricing-row highlight">
                  <span class="pricing-label">建议价</span>
                  <span class="pricing-value suggested">¥{{ row.suggested_price }}</span>
                </div>
                <div class="pricing-row">
                  <span class="pricing-label">价格区间</span>
                  <span class="pricing-value">¥{{ row.min_price }} ~ ¥{{ row.max_price }}</span>
                </div>
              </div>
            </el-popover>
            <span v-else class="sub-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="150">
          <template #default="{ row }">
            <div class="price-cell">
              <span class="price">¥{{ row.agreed_price }}</span>
              <div v-if="row.suggested_price != null && row.agreed_price" class="price-diff">
                <span :class="getPriceDiffClass(row)">
                  {{ getPriceDiffText(row) }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="撮合状态" width="160" align="center">
          <template #default="{ row }">
            <div class="match-status">
              <el-tag
                v-for="(step, idx) in getMatchSteps(row)"
                :key="idx"
                :type="step.type"
                size="small"
                class="match-tag"
                effect="light"
              >
                {{ step.label }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="报价记录" width="110" align="center">
          <template #default="{ row }">
            <el-popover placement="left" :width="320" trigger="click" v-if="row.bid_count > 0 || expandBidsMap[row.id]?.length">
              <template #reference>
                <el-button type="primary" link>
                  {{ row.bid_count || expandBidsMap[row.id]?.length || 0 }}条报价
                </el-button>
              </template>
              <div class="bids-popover">
                <div class="bids-popover-title">报价详情</div>
                <div v-if="expandBidsMap[row.id]?.length">
                  <div v-for="bid in expandBidsMap[row.id]" :key="bid.id" class="bid-popover-item">
                    <div class="bid-popover-header">
                      <span class="bid-popover-driver">{{ bid.driver_name }}</span>
                      <el-tag size="small" :type="getBidStatusType(bid.status)">
                        {{ getBidStatusText(bid.status) }}
                      </el-tag>
                    </div>
                    <div class="bid-popover-body">
                      <span class="bid-popover-price">¥{{ bid.bid_price }}</span>
                      <span v-if="bid.message" class="bid-popover-msg">{{ bid.message }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="no-data">点击展开行查看报价详情</div>
              </div>
            </el-popover>
            <span v-else class="sub-text">无报价</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row)">
              <el-icon><Search /></el-icon> 详情
            </el-button>
            <el-button type="success" size="small" @click="viewTracking(row)" v-if="row.status === 'in_transit'">
              <el-icon><Location /></el-icon> 追踪
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
        @update:current-page="(val) => pagination.page = val"
        @update:page-size="(val) => pagination.pageSize = val"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Refresh, Right, Search, Location, DataLine } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'
import { waybillApi, shipperApi } from '../../api'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const tableData = ref([])
const statusFilter = ref('')
const expandLoadingMap = reactive({})
const expandBidsMap = reactive({})

const currentRole = computed(() => userStore.user?.role || '')

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function getStatusType(status) {
  const types = {
    created: 'info',
    loading: 'warning',
    in_transit: 'primary',
    completed: 'success',
    exception: 'danger'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    created: '待装货',
    loading: '装货中',
    in_transit: '运输中',
    completed: '已完成',
    exception: '异常'
  }
  return texts[status] || status
}

function getBidStatusType(status) {
  const map = { pending: 'warning', accepted: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

function getBidStatusText(status) {
  const map = { pending: '待确认', accepted: '已接受', rejected: '已拒绝' }
  return map[status] || status
}

function getMatchSteps(row) {
  const steps = []
  const cargoStatus = row.cargo_status

  steps.push({ label: '已发布', type: 'info' })

  if (cargoStatus === 'published' && (!row.bid_count || row.bid_count === 0)) {
    steps.push({ label: '等待报价', type: 'warning' })
    return steps
  }

  if (cargoStatus === 'trading' || cargoStatus === 'signed' || row.bid_count > 0) {
    steps.push({ label: `议价中(${row.bid_count || 0}条)`, type: 'primary' })
  } else {
    steps.push({ label: '等待报价', type: 'warning' })
    return steps
  }

  if (cargoStatus === 'signed' || cargoStatus === 'completed' || row.status) {
    steps.push({ label: '已签约', type: 'success' })
  } else {
    return steps
  }

  steps.push({ label: '已成单', type: 'success' })
  return steps
}

function getPriceDiffText(row) {
  if (!row.suggested_price || !row.agreed_price) return ''
  const diff = ((row.agreed_price - row.suggested_price) / row.suggested_price * 100).toFixed(1)
  if (diff > 0) return `+${diff}%`
  return `${diff}%`
}

function getPriceDiffClass(row) {
  if (!row.suggested_price || !row.agreed_price) return ''
  const diff = row.agreed_price - row.suggested_price
  if (diff > 0) return 'price-diff-up'
  if (diff < 0) return 'price-diff-down'
  return 'price-diff-equal'
}

async function fetchCargoDetail(row) {
  if (!row.cargo_id) return
  expandLoadingMap[row.id] = true
  try {
    const res = await shipperApi.getCargoDetail(row.cargo_id)
    const data = res.data || {}
    expandBidsMap[row.id] = data.bids || []
  } catch (err) {
    console.error('Failed to fetch cargo detail:', err)
    expandBidsMap[row.id] = []
  } finally {
    expandLoadingMap[row.id] = false
  }
}

function handleExpandChange(row, expandedRows) {
  const isExpanded = expandedRows.some(r => r.id === row.id)
  if (isExpanded && !expandBidsMap[row.id]) {
    fetchCargoDetail(row)
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await waybillApi.getList({
      status: statusFilter.value || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function handleStatusChange() {
  pagination.page = 1
  loadData()
}

function viewDetail(row) {
  router.push({ name: 'WaybillDetail', params: { id: row.id } })
}

function viewTracking(row) {
  router.push({ name: 'WaybillTracking', params: { id: row.id } })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.waybill-list {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.status-filter {
  margin-bottom: 20px;
}
.route {
  display: flex;
  align-items: center;
  gap: 8px;
}
.city {
  font-weight: 500;
}
.arrow {
  color: #409eff;
}
.price {
  color: #f56c6c;
  font-weight: 600;
}
.sub-text {
  color: #909399;
  font-size: 12px;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.price-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.price-diff {
  font-size: 12px;
  line-height: 1;
}
.price-diff-up {
  color: #f56c6c;
}
.price-diff-down {
  color: #67c23a;
}
.price-diff-equal {
  color: #909399;
}

.pricing-popover .pricing-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}
.pricing-popover .pricing-row.highlight {
  font-weight: 600;
}
.pricing-popover .pricing-label {
  color: #606266;
  font-size: 13px;
}
.pricing-popover .pricing-value {
  font-size: 13px;
  color: #303133;
}
.pricing-popover .pricing-value.suggested {
  color: #409eff;
  font-weight: 600;
}

.match-status {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}
.match-tag {
  font-size: 11px;
}

.bids-popover-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 10px;
  color: #303133;
}
.bid-popover-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
.bid-popover-item:last-child {
  border-bottom: none;
}
.bid-popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.bid-popover-driver {
  font-weight: 500;
  font-size: 13px;
}
.bid-popover-body {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bid-popover-price {
  color: #f56c6c;
  font-weight: 600;
  font-size: 13px;
}
.bid-popover-msg {
  color: #909399;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.expand-content {
  padding: 16px 48px;
}
.expand-section {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
}
.expand-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.pricing-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}
.pricing-item.highlight {
  border-color: #409eff;
  background: #ecf5ff;
}
.pricing-item .pricing-label {
  font-size: 12px;
  color: #909399;
}
.pricing-item .pricing-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.pricing-item .pricing-value.agreed {
  color: #f56c6c;
}

.bids-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bid-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}
.bid-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bid-driver {
  font-weight: 500;
  font-size: 13px;
}
.bid-details {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bid-price {
  color: #f56c6c;
  font-weight: 600;
  font-size: 13px;
}
.bid-message {
  color: #909399;
  font-size: 12px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-data {
  color: #c0c4cc;
  font-size: 13px;
  text-align: center;
  padding: 20px 0;
}
</style>
