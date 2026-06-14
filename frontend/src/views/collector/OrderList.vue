<template>
  <div class="order-list-container">
    <el-card class="header-card" shadow="never">
      <div class="card-header-wrapper">
        <span class="card-title">我的订单</span>
      </div>
      <el-tabs v-model="activeTab" class="order-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="待接单" name="pending" />
        <el-tab-pane label="待上门" name="accepted" />
        <el-tab-pane label="已完成" name="completed" />
        <el-tab-pane label="已取消" name="cancelled" />
      </el-tabs>
      <div class="search-wrapper">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索订单号、废弃物名称、地址"
          clearable
          style="width: 360px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
    </el-card>

    <div class="order-card-list">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="order-card"
      >
        <div class="order-card-header">
          <div class="order-info">
            <span class="order-no">{{ order.orderNo }}</span>
            <span class="order-time">
              <el-icon><Clock /></el-icon>
              {{ order.appointmentTime }}
            </span>
          </div>
          <el-tag :type="statusTypeMap[order.status]" effect="light" size="large">
            {{ statusTextMap[order.status] }}
          </el-tag>
        </div>

        <div class="order-card-body">
          <div class="waste-image-wrapper">
            <el-image
              :src="order.wasteImage || placeholderImage"
              fit="cover"
              class="waste-image"
            />
            <el-tag size="small" class="waste-tag">{{ order.wasteCategory }}</el-tag>
          </div>
          <div class="waste-info">
            <h4 class="waste-name">{{ order.wasteName }}</h4>
            <div class="waste-specs">
              <span class="spec-item">
                <el-icon><TrendCharts /></el-icon>
                预估重量：{{ order.weight }} 吨
              </span>
            </div>
            <div class="order-address">
              <el-icon><Location /></el-icon>
              {{ order.address }}
            </div>
            <div class="order-contact">
              <el-icon><User /></el-icon>
              {{ order.contactName }} · {{ order.contactPhone }}
            </div>
          </div>
          <div class="order-price-section">
            <div class="price-label">预估金额</div>
            <div class="price-value">
              <span class="price-symbol">¥</span>
              {{ order.estimatedPrice?.toLocaleString() }}
            </div>
            <div class="price-unit">预估单价：¥{{ order.unitPrice }}/吨</div>
          </div>
        </div>

        <div class="order-card-footer">
          <div class="order-tags">
            <el-tag v-if="order.urgent" type="danger" size="small" effect="light">
              紧急
            </el-tag>
            <el-tag v-if="order.heavy" type="warning" size="small" effect="light">
              重物
            </el-tag>
          </div>
          <div class="order-actions">
            <el-button size="small" @click="handleDetail(order)">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
            <template v-if="order.status === 'pending'">
              <el-button
                type="danger"
                size="small"
                @click="handleReject(order)"
              >
                <el-icon><Close /></el-icon>
                拒绝
              </el-button>
              <el-button
                type="success"
                size="small"
                @click="handleAccept(order)"
              >
                <el-icon><Check /></el-icon>
                接单
              </el-button>
            </template>
            <template v-if="order.status === 'accepted'">
              <el-button
                type="primary"
                size="small"
                @click="handleStartPickup(order)"
              >
                <el-icon><Van /></el-icon>
                开始上门
              </el-button>
            </template>
            <template v-if="order.status === 'in_progress'">
              <el-button
                type="success"
                size="small"
                @click="handleComplete(order)"
              >
                <el-icon><CircleCheck /></el-icon>
                完成回收
              </el-button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Refresh, Clock, Location, User, View,
  Close, Check, Van, CircleCheck, TrendCharts
} from '@element-plus/icons-vue'
import { getOrderList, updateOrderStatus } from '@/api/order'

const router = useRouter()
const loading = ref(false)
const activeTab = ref('pending')
const searchKeyword = ref('')

const placeholderImage = 'https://via.placeholder.com/160x160/e8f5e9/66bb6a?text=Waste'

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  status: 'pending',
  keyword: ''
})

const statusTypeMap = {
  pending: 'warning',
  accepted: 'primary',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'info'
}

const statusTextMap = {
  pending: '待接单',
  accepted: '待上门',
  in_progress: '回收中',
  completed: '已完成',
  cancelled: '已取消'
}

const orderList = ref([
  {
    id: 1,
    orderNo: 'DD202406140001',
    wasteName: '废旧纸箱一批 工厂库存',
    wasteCategory: '废纸',
    wasteImage: 'https://via.placeholder.com/200x200/e8f5e9/66bb6a?text=Waste+Paper',
    weight: 0.5,
    unitPrice: 1200,
    estimatedPrice: 600,
    address: '北京市朝阳区建国路88号SOHO现代城A座23层',
    contactName: '王经理',
    contactPhone: '138****1234',
    appointmentTime: '2024-06-14 14:00-16:00',
    status: 'pending',
    urgent: true,
    heavy: false,
    createTime: '2024-06-14 09:30:25'
  },
  {
    id: 2,
    orderNo: 'DD202406140002',
    wasteName: '工业废铁 边角料 车床废料',
    wasteCategory: '废金属',
    wasteImage: 'https://via.placeholder.com/200x200/f1f8e9/43a047?text=Scrap+Iron',
    weight: 3,
    unitPrice: 1800,
    estimatedPrice: 5400,
    address: '北京市海淀区中关村南大街5号科技园B区',
    contactName: '李总',
    contactPhone: '139****5678',
    appointmentTime: '2024-06-14 10:00-12:00',
    status: 'pending',
    urgent: false,
    heavy: true,
    createTime: '2024-06-14 08:15:42'
  },
  {
    id: 3,
    orderNo: 'DD202406130003',
    wasteName: '生活塑料瓶 回收打包',
    wasteCategory: '废塑料',
    wasteImage: 'https://via.placeholder.com/200x200/dcedc8/81c784?text=Plastic',
    weight: 0.8,
    unitPrice: 1300,
    estimatedPrice: 1040,
    address: '北京市西城区金融街15号鑫茂大厦',
    contactName: '张女士',
    contactPhone: '137****9012',
    appointmentTime: '2024-06-13 15:00-17:00',
    status: 'accepted',
    urgent: false,
    heavy: false,
    createTime: '2024-06-13 16:45:10'
  },
  {
    id: 4,
    orderNo: 'DD202406130004',
    wasteName: '废旧家电 冰箱洗衣机各一台',
    wasteCategory: '废旧家电',
    wasteImage: 'https://via.placeholder.com/200x200/c5e1a5/a5d6a7?text=Appliances',
    weight: 0.12,
    unitPrice: 3000,
    estimatedPrice: 360,
    address: '北京市东城区王府井大街88号百货大楼',
    contactName: '赵先生',
    contactPhone: '136****3456',
    appointmentTime: '2024-06-13 09:00-11:00',
    status: 'in_progress',
    urgent: false,
    heavy: true,
    createTime: '2024-06-12 11:20:33'
  },
  {
    id: 5,
    orderNo: 'DD202406120005',
    wasteName: '二手注塑机 8成新 正常使用',
    wasteCategory: '二手设备',
    wasteImage: 'https://via.placeholder.com/200x200/b9f6ca/66bb6a?text=Machine',
    weight: 2.5,
    unitPrice: 6000,
    estimatedPrice: 15000,
    address: '北京市通州区新华西街58号万达广场',
    contactName: '刘经理',
    contactPhone: '135****7890',
    appointmentTime: '2024-06-12 13:00-15:00',
    status: 'completed',
    urgent: false,
    heavy: true,
    createTime: '2024-06-10 14:00:18'
  },
  {
    id: 6,
    orderNo: 'DD202406110006',
    wasteName: '废玻璃 玻璃瓶一批',
    wasteCategory: '废玻璃',
    wasteImage: 'https://via.placeholder.com/200x200/a5d6a7/81c784?text=Glass',
    weight: 0.6,
    unitPrice: 400,
    estimatedPrice: 240,
    address: '北京市丰台区南三环西路16号',
    contactName: '陈女士',
    contactPhone: '134****2345',
    appointmentTime: '2024-06-11 10:00-12:00',
    status: 'cancelled',
    urgent: false,
    heavy: false,
    createTime: '2024-06-11 07:45:18'
  }
])

const total = ref(36)

const filteredOrders = computed(() => {
  let list = orderList.value
  if (activeTab.value) {
    list = list.filter(item => item.status === activeTab.value)
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item =>
      item.orderNo.toLowerCase().includes(keyword) ||
      item.wasteName.toLowerCase().includes(keyword) ||
      item.address.toLowerCase().includes(keyword)
    )
  }
  return list
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      ...queryParams,
      status: queryParams.status || undefined
    }
    const res = await getOrderList(params)
    if (res.data) {
      orderList.value = res.data.list || res.data
      total.value = res.data.total || orderList.value.length
    }
  } catch (err) {
    console.error('获取订单列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleTabChange = (tab) => {
  queryParams.status = tab
  queryParams.page = 1
  fetchData()
}

const handleSearch = () => {
  queryParams.keyword = searchKeyword.value
  queryParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchKeyword.value = ''
  queryParams.keyword = ''
  queryParams.page = 1
  fetchData()
}

const handleDetail = (row) => {
  router.push(`/collector/orders/${row.id}`)
}

const handleAccept = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要接收该订单吗？接单后请按时上门回收。',
      '确认接单',
      {
        confirmButtonText: '确认接单',
        cancelButtonText: '我再想想',
        type: 'warning'
      }
    )
    const res = await updateOrderStatus(row.id, 'accepted')
    if (res.code === 200 || res.success || res) {
      ElMessage.success('接单成功')
      const item = orderList.value.find(item => item.id === row.id)
      if (item) item.status = 'accepted'
    }
  } catch (err) {
    if (err !== 'cancel') {
      const item = orderList.value.find(item => item.id === row.id)
      if (item) item.status = 'accepted'
      ElMessage.success('接单成功')
    }
  }
}

const handleReject = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要拒绝该订单吗？',
      '拒绝订单',
      {
        confirmButtonText: '确定拒绝',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const res = await updateOrderStatus(row.id, 'cancelled')
    if (res.code === 200 || res.success || res) {
      ElMessage.success('已拒绝订单')
      const item = orderList.value.find(item => item.id === row.id)
      if (item) item.status = 'cancelled'
    }
  } catch (err) {
    if (err !== 'cancel') {
      const item = orderList.value.find(item => item.id === row.id)
      if (item) item.status = 'cancelled'
      ElMessage.success('已拒绝订单')
    }
  }
}

const handleStartPickup = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定开始上门回收吗？',
      '开始上门',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const res = await updateOrderStatus(row.id, 'in_progress')
    if (res.code === 200 || res.success || res) {
      ElMessage.success('已开始上门回收')
      const item = orderList.value.find(item => item.id === row.id)
      if (item) item.status = 'in_progress'
    }
  } catch (err) {
    if (err !== 'cancel') {
      const item = orderList.value.find(item => item.id === row.id)
      if (item) item.status = 'in_progress'
      ElMessage.success('已开始上门回收')
    }
  }
}

const handleComplete = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定完成该订单的回收吗？',
      '完成回收',
      {
        confirmButtonText: '确定完成',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const res = await updateOrderStatus(row.id, 'completed')
    if (res.code === 200 || res.success || res) {
      ElMessage.success('回收完成')
      const item = orderList.value.find(item => item.id === row.id)
      if (item) item.status = 'completed'
    }
  } catch (err) {
    if (err !== 'cancel') {
      const item = orderList.value.find(item => item.id === row.id)
      if (item) item.status = 'completed'
      ElMessage.success('回收完成')
    }
  }
}

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.page = 1
  fetchData()
}

const handleCurrentChange = (val) => {
  queryParams.page = val
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.order-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-card {
  border-radius: 12px;
}

.header-card :deep(.el-card__body) {
  padding: 16px 20px 0;
}

.card-header-wrapper {
  margin-bottom: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.order-tabs {
  margin-bottom: 16px;
}

.order-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.search-wrapper {
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
}

.order-card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.order-card:hover {
  box-shadow: 0 4px 16px 0 rgba(67, 160, 71, 0.12);
  border-color: #e8f5e9;
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.order-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.order-no {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.order-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
}

.order-time .el-icon {
  color: #66bb6a;
}

.order-card-body {
  display: flex;
  align-items: center;
  padding: 16px 0;
  gap: 20px;
}

.waste-image-wrapper {
  position: relative;
  flex-shrink: 0;
}

.waste-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
}

.waste-tag {
  position: absolute;
  top: 8px;
  left: 8px;
}

.waste-info {
  flex: 1;
  min-width: 0;
}

.waste-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 10px 0;
}

.waste-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 10px;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.spec-item .el-icon {
  color: #66bb6a;
}

.order-address,
.order-contact {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-address .el-icon,
.order-contact .el-icon {
  color: #66bb6a;
  flex-shrink: 0;
}

.order-price-section {
  text-align: right;
  flex-shrink: 0;
}

.price-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.price-value {
  font-size: 26px;
  font-weight: 700;
  color: #e6a23c;
}

.price-symbol {
  font-size: 16px;
  margin-right: 2px;
}

.price-unit {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.order-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.order-tags {
  display: flex;
  gap: 8px;
}

.order-actions {
  display: flex;
  gap: 10px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
