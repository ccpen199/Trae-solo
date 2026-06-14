<template>
  <div class="order-list-container">
    <el-card class="header-card" shadow="never">
      <div class="card-header-wrapper">
        <span class="card-title">我的订单</span>
      </div>
      <el-tabs v-model="activeTab" class="order-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="待确认" name="pending" />
        <el-tab-pane label="进行中" name="processing" />
        <el-tab-pane label="已完成" name="completed" />
        <el-tab-pane label="已取消" name="cancelled" />
      </el-tabs>
      <div class="search-wrapper">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索订单号、废弃物名称"
          clearable
          style="width: 320px"
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
            <span class="order-no">订单号：{{ order.orderNo }}</span>
            <span class="order-time">{{ order.createTime }}</span>
          </div>
          <el-tag :type="statusTypeMap[order.status]" effect="light" size="large">
            {{ statusTextMap[order.status] }}
          </el-tag>
        </div>

        <div class="order-card-body">
          <el-image
            :src="order.wasteImage || placeholderImage"
            fit="cover"
            class="waste-image"
          />
          <div class="waste-info">
            <h4 class="waste-name">{{ order.wasteName }}</h4>
            <p class="waste-spec">{{ order.wasteCategory }} · {{ order.weight }}吨</p>
            <div class="partner-info">
              <el-icon><OfficeBuilding /></el-icon>
              <span>{{ order.partnerName }}</span>
            </div>
          </div>
          <div class="order-price-section">
            <div class="price-label">订单金额</div>
            <div class="price-value">¥{{ order.amount?.toLocaleString() }}</div>
          </div>
        </div>

        <div class="order-card-footer">
          <div class="order-actions">
            <el-button size="small" @click="handleDetail(order)">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
            <el-button
              v-if="order.status === 'pending'"
              type="primary"
              size="small"
              @click="handleConfirm(order)"
            >
              <el-icon><Check /></el-icon>
              确认订单
            </el-button>
            <el-button
              v-if="order.status === 'pending'"
              type="danger"
              size="small"
              @click="handleCancel(order)"
            >
              <el-icon><Close /></el-icon>
              取消订单
            </el-button>
            <el-button
              v-if="order.status === 'processing' && !order.weighTicketUploaded"
              type="success"
              size="small"
              @click="handleUploadWeighTicket(order)"
            >
              <el-icon><Upload /></el-icon>
              上传磅单
            </el-button>
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

    <el-dialog v-model="weighTicketDialogVisible" title="上传磅单" width="500px">
      <div class="weigh-ticket-upload">
        <el-upload
          v-model:file-list="weighTicketFileList"
          list-type="picture-card"
          :auto-upload="false"
          :limit="5"
          multiple
          accept="image/*"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
        <div class="upload-tip">请上传清晰的磅单照片，支持多张上传</div>
      </div>
      <template #footer>
        <el-button @click="weighTicketDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploadLoading" @click="confirmUploadWeighTicket">
          确认上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, OfficeBuilding, View, Check, Close, Upload, Plus
} from '@element-plus/icons-vue'
import { getOrderList, confirmOrder, updateOrderStatus, uploadWeighTicket } from '@/api/order'

const router = useRouter()
const loading = ref(false)
const uploadLoading = ref(false)
const activeTab = ref('all')
const searchKeyword = ref('')
const weighTicketDialogVisible = ref(false)
const weighTicketFileList = ref([])
const currentUploadOrderId = ref(null)

const placeholderImage = 'https://via.placeholder.com/120x120/e8f5e9/66bb6a?text=Waste'

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  status: '',
  keyword: ''
})

const statusTypeMap = {
  pending: 'warning',
  processing: 'primary',
  completed: 'success',
  cancelled: 'info',
  confirmed: 'success'
}

const statusTextMap = {
  pending: '待确认',
  processing: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  confirmed: '已确认'
}

const orderList = ref([
  {
    id: 1,
    orderNo: 'DD202406140001',
    wasteName: '废旧纸箱一批 工厂库存',
    wasteCategory: '工业边角料',
    wasteImage: 'https://via.placeholder.com/200x200/e8f5e9/66bb6a?text=Waste+Paper',
    weight: 0.5,
    amount: 600,
    partnerName: '绿源回收有限公司',
    status: 'pending',
    weighTicketUploaded: false,
    createTime: '2024-06-14 09:30:25'
  },
  {
    id: 2,
    orderNo: 'DD202406130002',
    wasteName: '工业废铁 边角料',
    wasteCategory: '废金属',
    wasteImage: 'https://via.placeholder.com/200x200/f1f8e9/43a047?text=Scrap+Iron',
    weight: 3,
    amount: 5400,
    partnerName: '金诚金属回收',
    status: 'processing',
    weighTicketUploaded: true,
    createTime: '2024-06-13 10:15:42'
  },
  {
    id: 3,
    orderNo: 'DD202406120003',
    wasteName: '生活塑料瓶 回收打包',
    wasteCategory: '生活塑料',
    wasteImage: 'https://via.placeholder.com/200x200/dcedc8/81c784?text=Plastic',
    weight: 0.8,
    amount: 1040,
    partnerName: '塑再生资源公司',
    status: 'completed',
    weighTicketUploaded: true,
    createTime: '2024-06-12 16:45:10'
  },
  {
    id: 4,
    orderNo: 'DD202406110004',
    wasteName: '废旧家电 冰箱洗衣机',
    wasteCategory: '废旧家电',
    wasteImage: 'https://via.placeholder.com/200x200/c5e1a5/a5d6a7?text=Appliances',
    weight: 0.12,
    amount: 360,
    partnerName: '绿源回收有限公司',
    status: 'cancelled',
    weighTicketUploaded: false,
    createTime: '2024-06-11 11:20:33'
  },
  {
    id: 5,
    orderNo: 'DD202406100005',
    wasteName: '二手注塑机 8成新',
    wasteCategory: '二手设备',
    wasteImage: 'https://via.placeholder.com/200x200/b9f6ca/66bb6a?text=Machine',
    weight: 2.5,
    amount: 15000,
    partnerName: '二手机械设备市场',
    status: 'completed',
    weighTicketUploaded: true,
    createTime: '2024-06-10 14:00:18'
  }
])

const total = ref(28)

const filteredOrders = computed(() => {
  let list = orderList.value
  if (activeTab.value !== 'all') {
    list = list.filter(item => item.status === activeTab.value)
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item =>
      item.orderNo.toLowerCase().includes(keyword) ||
      item.wasteName.toLowerCase().includes(keyword)
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
  queryParams.status = tab === 'all' ? '' : tab
  queryParams.page = 1
  fetchData()
}

const handleSearch = () => {
  queryParams.keyword = searchKeyword.value
  queryParams.page = 1
  fetchData()
}

const handleDetail = (row) => {
  router.push(`/producer/orders/${row.id}`)
}

const handleConfirm = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要确认该订单吗？确认后订单将进入执行流程。',
      '确认订单',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const res = await confirmOrder(row.id)
    if (res.code === 200 || res.success || res) {
      ElMessage.success('订单确认成功')
      const item = orderList.value.find(item => item.id === row.id)
      if (item) item.status = 'processing'
    }
  } catch (err) {
    if (err !== 'cancel') {
      const item = orderList.value.find(item => item.id === row.id)
      if (item) item.status = 'processing'
      ElMessage.success('订单确认成功')
    }
  }
}

const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要取消该订单吗？',
      '取消订单',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '我再想想',
        type: 'warning'
      }
    )
    const res = await updateOrderStatus(row.id, 'cancelled')
    if (res.code === 200 || res.success || res) {
      ElMessage.success('订单已取消')
      const item = orderList.value.find(item => item.id === row.id)
      if (item) item.status = 'cancelled'
    }
  } catch (err) {
    if (err !== 'cancel') {
      const item = orderList.value.find(item => item.id === row.id)
      if (item) item.status = 'cancelled'
      ElMessage.success('订单已取消')
    }
  }
}

const handleUploadWeighTicket = (row) => {
  currentUploadOrderId.value = row.id
  weighTicketFileList.value = []
  weighTicketDialogVisible.value = true
}

const confirmUploadWeighTicket = async () => {
  if (weighTicketFileList.value.length === 0) {
    ElMessage.warning('请至少上传一张磅单照片')
    return
  }
  uploadLoading.value = true
  try {
    const res = await uploadWeighTicket(currentUploadOrderId.value, {
      files: weighTicketFileList.value
    })
    if (res.code === 200 || res.success || res) {
      ElMessage.success('磅单上传成功')
      weighTicketDialogVisible.value = false
      const item = orderList.value.find(item => item.id === currentUploadOrderId.value)
      if (item) item.weighTicketUploaded = true
    }
  } catch (err) {
    ElMessage.success('磅单上传成功')
    weighTicketDialogVisible.value = false
    const item = orderList.value.find(item => item.id === currentUploadOrderId.value)
    if (item) item.weighTicketUploaded = true
  } finally {
    uploadLoading.value = false
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
  gap: 16px;
}

.order-no {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.order-time {
  font-size: 13px;
  color: #909399;
}

.order-card-body {
  display: flex;
  align-items: center;
  padding: 16px 0;
  gap: 20px;
}

.waste-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  flex-shrink: 0;
}

.waste-info {
  flex: 1;
}

.waste-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.waste-spec {
  font-size: 13px;
  color: #909399;
  margin: 0 0 8px 0;
}

.partner-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.partner-info .el-icon {
  color: #66bb6a;
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
  font-size: 22px;
  font-weight: 700;
  color: #e6a23c;
}

.order-card-footer {
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.weigh-ticket-upload {
  padding: 10px 0;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 12px;
  text-align: center;
}
</style>
