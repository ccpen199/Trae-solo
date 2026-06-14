<template>
  <div class="purchase-list-container">
    <el-card class="header-card" shadow="never">
      <div class="card-header-wrapper">
        <span class="card-title">我的采购</span>
      </div>
      <el-tabs v-model="activeTab" class="purchase-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="待确认" name="pending" />
        <el-tab-pane label="进行中" name="processing" />
        <el-tab-pane label="已完成" name="completed" />
        <el-tab-pane label="已取消" name="cancelled" />
      </el-tabs>
      <div class="search-wrapper">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索订单号、商品名称"
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

    <el-card class="order-table-card" shadow="never">
      <el-table :data="filteredOrders" style="width: 100%" stripe>
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column label="商品信息" min-width="240">
          <template #default="scope">
            <div class="product-cell">
              <el-image :src="scope.row.productImage" fit="cover" class="product-thumb" />
              <div class="product-info">
                <div class="product-name">{{ scope.row.productName }}</div>
                <div class="product-category">{{ scope.row.category }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="数量重量" width="120">
          <template #default="scope">
            <span>{{ scope.row.weight }} 吨</span>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="140">
          <template #default="scope">
            <span class="amount-text">¥{{ scope.row.amount.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sellerName" label="卖家" width="160" />
        <el-table-column label="状态" width="110">
          <template #default="scope">
            <el-tag :type="statusTypeMap[scope.row.status]" effect="light">
              {{ statusTextMap[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button type="primary" link size="small" @click="handleDetail(scope.row)">
                查看详情
              </el-button>
              <el-button
                v-if="scope.row.status === 'processing'"
                type="success"
                link
                size="small"
                @click="handleReceive(scope.row)"
              >
                确认收货
              </el-button>
              <el-button
                v-if="scope.row.status === 'pending'"
                type="danger"
                link
                size="small"
                @click="handleCancel(scope.row)"
              >
                取消订单
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="订单详情" width="700px">
      <div v-if="currentOrder" class="order-detail">
        <div class="detail-section">
          <div class="section-title">订单信息</div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="statusTypeMap[currentOrder.status]" effect="light">
                {{ statusTextMap[currentOrder.status] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ currentOrder.createTime }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ currentOrder.payTime || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="section-title">商品信息</div>
          <div class="product-detail-row">
            <el-image :src="currentOrder.productImage" fit="cover" class="detail-image" />
            <div class="product-detail-info">
              <h4>{{ currentOrder.productName }}</h4>
              <p class="detail-category">{{ currentOrder.category }}</p>
              <div class="detail-specs">
                <span>重量：{{ currentOrder.weight }} 吨</span>
                <span>单价：¥{{ currentOrder.unitPrice.toLocaleString() }}/吨</span>
              </div>
              <p class="detail-amount">
                订单金额：<span class="amount-text">¥{{ currentOrder.amount.toLocaleString() }}</span>
              </p>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-title">买卖双方</div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="卖家">{{ currentOrder.sellerName }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ currentOrder.sellerContact }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentOrder.sellerPhone }}</el-descriptions-item>
            <el-descriptions-item label="所在地">{{ currentOrder.sellerLocation }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="section-title">物流信息</div>
          <el-steps :active="logisticsStep" finish-status="success" size="small">
            <el-step title="已下单" description="买家提交订单" />
            <el-step title="已确认" description="卖家确认订单" />
            <el-step title="运输中" description="货物运输中" />
            <el-step title="已收货" description="买家确认收货" />
          </el-steps>
        </div>

        <div v-if="currentOrder.remark" class="detail-section">
          <div class="section-title">备注信息</div>
          <p class="remark-text">{{ currentOrder.remark }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button v-if="currentOrder?.status === 'processing'" type="success" @click="handleReceive(currentOrder)">
          确认收货
        </el-button>
        <el-button v-if="currentOrder?.status === 'pending'" type="danger" @click="handleCancel(currentOrder)">
          取消订单
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const activeTab = ref('all')
const searchKeyword = ref('')
const detailDialogVisible = ref(false)
const currentOrder = ref(null)

const statusTypeMap = {
  pending: 'warning',
  processing: 'primary',
  completed: 'success',
  cancelled: 'info'
}

const statusTextMap = {
  pending: '待确认',
  processing: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  status: '',
  keyword: ''
})

const orderList = ref([
  {
    id: 1,
    orderNo: 'CG202406140001',
    productName: '工厂废铁边角料 纯净度高 量大从优',
    productImage: 'https://via.placeholder.com/100x100/e8f5e9/66bb6a?text=Scrap+Iron',
    category: '工业边角料',
    weight: 10.5,
    unitPrice: 2800,
    amount: 29400,
    sellerName: '鑫源金属回收有限公司',
    sellerContact: '张经理',
    sellerPhone: '138****6688',
    sellerLocation: '江苏省苏州市',
    status: 'pending',
    createTime: '2024-06-14 09:30:25',
    payTime: null,
    remark: '请尽快安排发货，每周一收货'
  },
  {
    id: 2,
    orderNo: 'CG202406130002',
    productName: 'PET塑料瓶打包料 干净无杂质',
    productImage: 'https://via.placeholder.com/100x100/c5e1a5/a5d6a7?text=PET+Bottles',
    category: '生活塑料',
    weight: 5.0,
    unitPrice: 3200,
    amount: 16000,
    sellerName: '塑联再生科技',
    sellerContact: '李总',
    sellerPhone: '139****2233',
    sellerLocation: '山东省青岛市',
    status: 'processing',
    createTime: '2024-06-13 14:20:10',
    payTime: '2024-06-13 14:35:20',
    remark: ''
  },
  {
    id: 3,
    orderNo: 'CG202406120003',
    productName: '二手注塑机 8成新 正常使用中',
    productImage: 'https://via.placeholder.com/100x100/f1f8e9/43a047?text=Injection+Machine',
    category: '二手设备',
    weight: 3.2,
    unitPrice: 45000,
    amount: 144000,
    sellerName: '顺达二手机械',
    sellerContact: '王经理',
    sellerPhone: '137****5566',
    sellerLocation: '广东省东莞市',
    status: 'completed',
    createTime: '2024-06-12 10:15:42',
    payTime: '2024-06-12 10:30:00',
    remark: '设备状态良好，已验收'
  },
  {
    id: 4,
    orderNo: 'CG202406110004',
    productName: '废旧家电一批 冰箱洗衣机空调',
    productImage: 'https://via.placeholder.com/100x100/dcedc8/81c784?text=Home+Appliances',
    category: '废旧家电',
    weight: 8.6,
    unitPrice: 1200,
    amount: 10320,
    sellerName: '绿源再生资源',
    sellerContact: '陈女士',
    sellerPhone: '136****7788',
    sellerLocation: '浙江省杭州市',
    status: 'processing',
    createTime: '2024-06-11 16:45:30',
    payTime: '2024-06-11 17:00:15',
    remark: ''
  },
  {
    id: 5,
    orderNo: 'CG202406100005',
    productName: '废纸箱 工厂库存 纯黄板纸',
    productImage: 'https://via.placeholder.com/100x100/b9f6ca/66bb6a?text=Waste+Paper',
    category: '工业边角料',
    weight: 15.0,
    unitPrice: 1850,
    amount: 27750,
    sellerName: '华丰纸品回收',
    sellerContact: '刘经理',
    sellerPhone: '135****9900',
    sellerLocation: '江苏省无锡市',
    status: 'completed',
    createTime: '2024-06-10 09:00:00',
    payTime: '2024-06-10 09:15:30',
    remark: ''
  },
  {
    id: 6,
    orderNo: 'CG202406090006',
    productName: 'HDPE塑料颗粒 再生料',
    productImage: 'https://via.placeholder.com/100x100/dcedc8/81c784?text=HDPE+Pellets',
    category: '生活塑料',
    weight: 8.0,
    unitPrice: 5800,
    amount: 46400,
    sellerName: '科泰塑业',
    sellerContact: '赵总',
    sellerPhone: '134****3344',
    sellerLocation: '浙江省宁波市',
    status: 'cancelled',
    createTime: '2024-06-09 14:30:20',
    payTime: null,
    remark: '价格协商未达成一致'
  },
  {
    id: 7,
    orderNo: 'CG202406080007',
    productName: '废不锈钢 304材质 边角料',
    productImage: 'https://via.placeholder.com/100x100/e8f5e9/66bb6a?text=Stainless+Steel',
    category: '工业边角料',
    weight: 6.5,
    unitPrice: 9500,
    amount: 61750,
    sellerName: '宝盛金属回收',
    sellerContact: '孙经理',
    sellerPhone: '133****1122',
    sellerLocation: '广东省佛山市',
    status: 'completed',
    createTime: '2024-06-08 11:20:00',
    payTime: '2024-06-08 11:35:45',
    remark: '质量很好，长期合作'
  },
  {
    id: 8,
    orderNo: 'CG202406070008',
    productName: '废铅酸蓄电池 HW49',
    productImage: 'https://via.placeholder.com/100x100/ffebee/ef5350?text=Batteries',
    category: '危废',
    weight: 3.5,
    unitPrice: 6500,
    amount: 22750,
    sellerName: '恒泰危废处理',
    sellerContact: '周经理',
    sellerPhone: '132****7788',
    sellerLocation: '河北省唐山市',
    status: 'processing',
    createTime: '2024-06-07 16:00:00',
    payTime: '2024-06-07 16:20:30',
    remark: '需提供危废处理资质'
  }
])

const total = ref(35)

const filteredOrders = computed(() => {
  let list = orderList.value
  if (activeTab.value !== 'all') {
    list = list.filter(item => item.status === activeTab.value)
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item =>
      item.orderNo.toLowerCase().includes(keyword) ||
      item.productName.toLowerCase().includes(keyword)
    )
  }
  return list
})

const logisticsStep = computed(() => {
  if (!currentOrder.value) return 0
  const stepMap = {
    pending: 1,
    processing: 3,
    completed: 4,
    cancelled: 0
  }
  return stepMap[currentOrder.value.status] || 0
})

const handleTabChange = (tab) => {
  queryParams.status = tab === 'all' ? '' : tab
  queryParams.page = 1
}

const handleSearch = () => {
  queryParams.keyword = searchKeyword.value
  queryParams.page = 1
}

const handleDetail = (row) => {
  currentOrder.value = row
  detailDialogVisible.value = true
}

const handleReceive = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确认已收到货物？确认后订单将完成。',
      '确认收货',
      {
        confirmButtonText: '确认收货',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    const item = orderList.value.find(item => item.id === row.id)
    if (item) item.status = 'completed'
    if (currentOrder.value?.id === row.id) {
      currentOrder.value.status = 'completed'
    }
    ElMessage.success('已确认收货，订单完成')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('操作失败，请重试')
    }
  }
}

const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要取消该订单吗？取消后无法恢复。',
      '取消订单',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '我再想想',
        type: 'warning'
      }
    )
    const item = orderList.value.find(item => item.id === row.id)
    if (item) item.status = 'cancelled'
    if (currentOrder.value?.id === row.id) {
      currentOrder.value.status = 'cancelled'
    }
    ElMessage.success('订单已取消')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('操作失败，请重试')
    }
  }
}

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.page = 1
}

const handleCurrentChange = (val) => {
  queryParams.page = val
}
</script>

<style scoped>
.purchase-list-container {
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

.purchase-tabs {
  margin-bottom: 16px;
}

.purchase-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.search-wrapper {
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
}

.order-table-card {
  border-radius: 12px;
}

.order-table-card :deep(.el-card__body) {
  padding: 16px 20px 20px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-thumb {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-category {
  font-size: 12px;
  color: #909399;
}

.amount-text {
  color: #f56c6c;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.order-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  padding-bottom: 16px;
  border-bottom: 1px dashed #e0e0e0;
}

.detail-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #66bb6a;
}

.product-detail-row {
  display: flex;
  gap: 20px;
}

.detail-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  flex-shrink: 0;
}

.product-detail-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.detail-category {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #909399;
}

.detail-specs {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #606266;
}

.detail-amount {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.detail-amount .amount-text {
  font-size: 20px;
}

.remark-text {
  margin: 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}
</style>
