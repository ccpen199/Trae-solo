<template>
  <div>
    <div class="page-header">
      <div class="page-title">运营报表</div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="礼物销量" name="gift-sales">
        <div class="card-content">
          <div class="filter-bar">
            <el-date-picker v-model="timeRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" @change="loadGiftSales" />
            <el-button type="primary" @click="loadGiftSales">查询</el-button>
          </div>
          <el-table :data="giftSales" v-loading="loading">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column label="礼物" width="160">
              <template #default="{ row }">
                <span class="gift-icon">{{ row.icon }}</span>{{ row.name }}
              </template>
            </el-table-column>
            <el-table-column prop="rarity" label="稀有度" width="100">
              <template #default="{ row }"><el-tag :class="'rarity-' + row.rarity">{{ rarityMap[row.rarity] }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="price" label="单价" width="100">
              <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="order_count" label="订单数" width="80" />
            <el-table-column prop="total_quantity" label="总销量" width="80" />
            <el-table-column prop="user_count" label="购买人数" width="100" />
            <el-table-column prop="total_amount" label="总收入" width="120">
              <template #default="{ row }">¥{{ row.total_amount.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button size="small" @click="viewGiftDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="主播收入排行" name="anchor-ranking">
        <div class="card-content">
          <div class="filter-bar">
            <el-date-picker v-model="timeRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" @change="loadAnchorRanking" />
            <el-button type="primary" @click="loadAnchorRanking">查询</el-button>
          </div>
          <el-table :data="anchorRanking" v-loading="loading">
            <el-table-column label="排名" width="60">
              <template #default="{ $index }">{{ $index + 1 }}</template>
            </el-table-column>
            <el-table-column label="主播" width="180">
              <template #default="{ row }">{{ row.nickname || row.username }}</template>
            </el-table-column>
            <el-table-column prop="gift_count" label="礼物次数" width="100" />
            <el-table-column prop="total_gifts" label="礼物总数" width="100" />
            <el-table-column prop="fan_count" label="粉丝数" width="100" />
            <el-table-column prop="total_received" label="总收入" width="140">
              <template #default="{ row }" style="color: #f56c6c; font-weight: 600;">¥{{ row.total_received.toFixed(2) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="用户偏好" name="preference">
        <div class="card-content">
          <el-row :gutter="16">
            <el-col :span="12">
              <div class="chart-container">
                <div class="chart-title">稀有度分布</div>
                <div ref="rarityChart" style="height: 300px;"></div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="chart-container">
                <div class="chart-title">场景分布</div>
                <div ref="sceneChart" style="height: 300px;"></div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="detailVisible" title="礼物销售详情" width="900px" @close="detailCurrentPage = 1">
      <div v-if="giftDetail">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="礼物名称">{{ giftDetail.gift.name }}</el-descriptions-item>
          <el-descriptions-item label="稀有度">{{ rarityMap[giftDetail.gift.rarity] }}</el-descriptions-item>
          <el-descriptions-item label="单价">¥{{ giftDetail.gift.price.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ giftDetail.gift.status === 'online' ? '上架' : '下架' }}</el-descriptions-item>
          <el-descriptions-item label="总销量">{{ giftDetail.stats.total_quantity }} 件</el-descriptions-item>
          <el-descriptions-item label="总收入">¥{{ giftDetail.stats.total_amount.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="成功订单">{{ giftDetail.stats.order_count - giftDetail.stats.failed_count }} 笔</el-descriptions-item>
          <el-descriptions-item label="失败订单" style="color: #f56c6c;">{{ giftDetail.stats.failed_count }} 笔 (¥{{ giftDetail.stats.failed_amount.toFixed(2) }})</el-descriptions-item>
          <el-descriptions-item label="购买人数">{{ giftDetail.stats.user_count }} 人</el-descriptions-item>
        </el-descriptions>

        <div v-if="giftDetail.activityStats && giftDetail.activityStats.filter(a => a.order_count > 0).length > 0" style="margin-top: 16px;">
          <h4 style="margin-bottom: 8px;">活动来源分布</h4>
          <el-table :data="giftDetail.activityStats.filter(a => a.order_count > 0)" size="small">
            <el-table-column prop="name" label="活动名称" />
            <el-table-column prop="type" label="活动类型" width="120">
              <template #default="{ row }">{{ activityTypeMap[row.type] || row.type }}</template>
            </el-table-column>
            <el-table-column prop="order_count" label="订单数" width="80" />
            <el-table-column prop="total_amount" label="贡献收入" width="120">
              <template #default="{ row }">¥{{ row.total_amount.toFixed(2) }}</template>
            </el-table-column>
          </el-table>
        </div>

        <div style="margin-top: 16px;">
          <div class="filter-bar">
            <el-select v-model="detailStatus" size="small" style="width: 120px;" @change="loadGiftDetailOrders">
              <el-option label="全部" value="all" />
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
            </el-select>
            <el-date-picker v-model="detailTimeRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" size="small" @change="loadGiftDetailOrders" />
          </div>
          <h4 style="margin: 8px 0;">订单明细</h4>
          <el-table :data="giftDetail.orders" size="small" stripe>
            <el-table-column prop="order_no" label="订单号" width="180" />
            <el-table-column label="送礼用户" width="120">
              <template #default="{ row }">{{ row.user_nickname || row.user_name }}</template>
            </el-table-column>
            <el-table-column label="接收主播" width="120">
              <template #default="{ row }">{{ row.receiver_nickname || row.receiver_name }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="60" />
            <el-table-column prop="total_amount" label="金额" width="100">
              <template #default="{ row }">¥{{ row.total_amount.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="scene" label="场景" width="80" />
            <el-table-column prop="activity_name" label="活动来源" width="140">
              <template #default="{ row }">{{ row.activity_name || '-' }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">{{ row.status === 'success' ? '成功' : '失败' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间" width="160" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button size="small" link @click="viewOrderDetail(row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            style="margin-top: 12px; justify-content: flex-end;"
            v-model:current-page="detailCurrentPage"
            :page-size="detailPageSize"
            :total="giftDetail.total"
            layout="total, prev, pager, next"
            @current-change="loadGiftDetailOrders"
          />
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="orderDetailVisible" title="订单详情" width="500px">
      <div v-if="currentOrder">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ currentOrder.order_no }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentOrder.status === 'success' ? 'success' : 'danger'">{{ currentOrder.status === 'success' ? '成功' : '失败' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="送礼用户">{{ currentOrder.user_nickname || currentOrder.user_name }}</el-descriptions-item>
          <el-descriptions-item label="接收主播">{{ currentOrder.receiver_nickname || currentOrder.receiver_name }}</el-descriptions-item>
          <el-descriptions-item label="礼物">{{ currentOrder.gift_name || giftDetail.gift.name }} x {{ currentOrder.quantity }}</el-descriptions-item>
          <el-descriptions-item label="金额">¥{{ currentOrder.total_amount.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="场景">{{ currentOrder.scene || '-' }}</el-descriptions-item>
          <el-descriptions-item label="活动来源">{{ currentOrder.activity_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="留言">{{ currentOrder.message || '-' }}</el-descriptions-item>
          <el-descriptions-item label="时间">{{ currentOrder.created_at }}</el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.status === 'failed'" label="失败原因">
            <span style="color: #f56c6c;">{{ currentOrder.fail_reason }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import request from '../utils/request'

const activeTab = ref('gift-sales')
const giftSales = ref([])
const anchorRanking = ref([])
const loading = ref(false)
const timeRange = ref(null)
const giftDetail = ref(null)
const detailVisible = ref(false)
const orderDetailVisible = ref(false)
const currentOrder = ref(null)
const rarityChart = ref(null)
const sceneChart = ref(null)
const detailStatus = ref('all')
const detailTimeRange = ref(null)
const detailCurrentPage = ref(1)
const detailPageSize = 10
let currentGiftId = null

const rarityMap = { normal: '普通', rare: '稀有', epic: '史诗', legendary: '传说' }
const activityTypeMap = { discount: '限时折扣', combo: '组合礼物', ranking: '排行榜加成', festival: '节日主题' }

async function loadGiftSales() {
  loading.value = true
  try {
    const params = { pageSize: 100 }
    if (timeRange.value?.[0]) params.startTime = timeRange.value[0]
    if (timeRange.value?.[1]) params.endTime = timeRange.value[1]
    const data = await request.get('/reports/gift-sales', { params })
    giftSales.value = data.items
  } finally {
    loading.value = false
  }
}

async function loadAnchorRanking() {
  loading.value = true
  try {
    const params = { pageSize: 100 }
    if (timeRange.value?.[0]) params.startTime = timeRange.value[0]
    if (timeRange.value?.[1]) params.endTime = timeRange.value[1]
    const data = await request.get('/reports/anchor-ranking', { params })
    anchorRanking.value = data.items
  } finally {
    loading.value = false
  }
}

async function loadPreference() {
  const data = await request.get('/reports/user-preference')
  
  await nextTick()
  
  if (rarityChart.value) {
    const chart = echarts.init(rarityChart.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        data: data.rarityStats.map(r => ({ name: rarityMap[r.rarity] || r.rarity, value: r.total_amount }))
      }]
    })
  }
  
  if (sceneChart.value) {
    const chart = echarts.init(sceneChart.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        data: data.sceneStats.map(s => ({ name: s.scene, value: s.total_amount }))
      }]
    })
  }
}

async function viewGiftDetail(row) {
  currentGiftId = row.id
  detailStatus.value = 'all'
  detailTimeRange.value = null
  detailCurrentPage.value = 1
  await loadGiftDetailOrders()
  detailVisible.value = true
}

async function loadGiftDetailOrders() {
  const params = {
    status: detailStatus.value,
    page: detailCurrentPage.value,
    pageSize: detailPageSize
  }
  if (detailTimeRange.value?.[0]) params.startTime = detailTimeRange.value[0]
  if (detailTimeRange.value?.[1]) params.endTime = detailTimeRange.value[1]
  
  giftDetail.value = await request.get(`/reports/gift-detail/${currentGiftId}`, { params })
}

function viewOrderDetail(row) {
  currentOrder.value = row
  orderDetailVisible.value = true
}

watch(activeTab, val => {
  if (val === 'preference') {
    nextTick(loadPreference)
  }
})

onMounted(() => {
  loadGiftSales()
  loadAnchorRanking()
})
</script>
