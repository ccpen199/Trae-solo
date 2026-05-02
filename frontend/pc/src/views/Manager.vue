<template>
  <div class="manager-container">
    <div class="manager-header">
      <div class="header-left">
        <h2>门店管理</h2>
        <span class="store-info">{{ userInfo?.storeName || '门店' }}</span>
      </div>
      <div class="header-right">
        <span class="manager-name">{{ userInfo?.realName || '店长' }}</span>
        <el-button type="primary" plain @click="handleLogout">退出</el-button>
      </div>
    </div>

    <div class="manager-content">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="经营看板" name="dashboard">
          <div class="dashboard-section">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-title">今日销售</div>
                <div class="stat-value">¥{{ dashboardData?.todaySales?.toFixed(2) || '0.00' }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-title">今日交易</div>
                <div class="stat-value">{{ dashboardData?.todayTransactions || 0 }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-title">本月销售</div>
                <div class="stat-value">¥{{ dashboardData?.monthSales?.toFixed(2) || '0.00' }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-title">低库存商品</div>
                <div class="stat-value">{{ dashboardData?.lowStockCount || 0 }}</div>
              </div>
            </div>

            <div class="chart-section">
              <h3>销售趋势</h3>
              <div class="chart-placeholder">
                <p>销售趋势图表</p>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="实时销售" name="realtime">
          <div class="realtime-section">
            <div class="realtime-header">
              <h3>实时交易流水</h3>
              <div class="total-info">
                <span>今日总销售额: ¥{{ realtimeData?.totalAmount?.toFixed(2) || '0.00' }}</span>
                <span>交易笔数: {{ realtimeData?.transactionCount || 0 }}</span>
              </div>
            </div>
            <el-table :data="realtimeData?.transactions || []" style="width: 100%">
              <el-table-column prop="transactionNo" label="交易号" width="180" />
              <el-table-column prop="totalAmount" label="总金额" width="120">
                <template #default="scope">
                  ¥{{ scope.row.totalAmount?.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="actualAmount" label="实收金额" width="120">
                <template #default="scope">
                  ¥{{ scope.row.actualAmount?.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="paymentMethod" label="支付方式" width="100" />
              <el-table-column prop="transactionTime" label="交易时间">
                <template #default="scope">
                  {{ formatDateTime(scope.row.transactionTime) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="库存预警" name="inventory">
          <div class="inventory-section">
            <h3>低库存商品预警</h3>
            <el-table :data="inventoryAlerts || []" style="width: 100%">
              <el-table-column prop="productId" label="商品ID" width="80" />
              <el-table-column prop="productName" label="商品名称" />
              <el-table-column prop="currentStock" label="当前库存" width="100" />
              <el-table-column prop="lowStockThreshold" label="预警阈值" width="100" />
              <el-table-column label="操作" width="120">
                <template #default="scope">
                  <el-button type="primary" size="small" @click="handleStockAlert(scope.row)">
                    处理
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="商品销量" name="sales">
          <div class="sales-section">
            <h3>商品销售排行</h3>
            <div class="date-range">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="loadSalesData"
              />
              <el-button type="primary" @click="loadSalesData">查询</el-button>
            </div>
            <el-table :data="salesData || []" style="width: 100%">
              <el-table-column prop="productName" label="商品名称" />
              <el-table-column prop="quantity" label="销售数量" width="100" />
              <el-table-column prop="amount" label="销售金额" width="120">
                <template #default="scope">
                  ¥{{ scope.row.amount?.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="unitPrice" label="平均单价" width="100">
                <template #default="scope">
                  ¥{{ scope.row.unitPrice?.toFixed(2) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const activeTab = ref('dashboard')
const dashboardData = ref(null)
const realtimeData = ref(null)
const inventoryAlerts = ref([])
const salesData = ref([])
const dateRange = ref([])

const userInfo = computed(() => {
  const user = localStorage.getItem('userInfo')
  return user ? JSON.parse(user) : null
})

onMounted(() => {
  loadDashboardData()
  loadRealtimeData()
  loadInventoryAlerts()
  loadSalesData()
})

watch(activeTab, (newTab) => {
  if (newTab === 'dashboard') {
    loadDashboardData()
  } else if (newTab === 'realtime') {
    loadRealtimeData()
  } else if (newTab === 'inventory') {
    loadInventoryAlerts()
  } else if (newTab === 'sales') {
    loadSalesData()
  }
})

const loadDashboardData = async () => {
  try {
    const response = await axios.get(`/api/manager/dashboard?storeId=${userInfo.value?.storeId || 1}`)
    if (response.data.success) {
      dashboardData.value = response.data.data
    }
  } catch (error) {
    console.error('加载看板数据失败:', error)
  }
}

const loadRealtimeData = async () => {
  try {
    const response = await axios.get(`/api/manager/realtime-sales?storeId=${userInfo.value?.storeId || 1}`)
    if (response.data.success) {
      realtimeData.value = response.data.data
    }
  } catch (error) {
    console.error('加载实时数据失败:', error)
  }
}

const loadInventoryAlerts = async () => {
  try {
    const response = await axios.get(`/api/manager/inventory-alert?storeId=${userInfo.value?.storeId || 1}`)
    if (response.data.success) {
      inventoryAlerts.value = response.data.data
    }
  } catch (error) {
    console.error('加载库存预警失败:', error)
  }
}

const loadSalesData = async () => {
  try {
    let url = `/api/manager/product-sales?storeId=${userInfo.value?.storeId || 1}`
    if (dateRange.value && dateRange.value.length === 2) {
      url += `&startDate=${dateRange.value[0]}&endDate=${dateRange.value[1]}`
    }
    const response = await axios.get(url)
    if (response.data.success) {
      salesData.value = response.data.data
    }
  } catch (error) {
    console.error('加载销售数据失败:', error)
  }
}

const handleStockAlert = (item) => {
  ElMessageBox.alert(`商品 ${item.productName} 库存不足，当前库存: ${item.currentStock}，建议补货。`, '库存预警', {
    confirmButtonText: '确定',
    type: 'warning'
  })
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('pos_token')
    localStorage.removeItem('userInfo')
    router.push('/login')
  })
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.manager-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.manager-header {
  height: 60px;
  background: #67c23a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left h2 {
  margin: 0;
  font-size: 18px;
}

.store-info {
  font-size: 14px;
  margin-left: 20px;
  opacity: 0.9;
}

.manager-name {
  margin-right: 20px;
}

.manager-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f5f7fa;
}

.dashboard-section {
  margin-bottom: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #67c23a;
}

.chart-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-section h3 {
  margin-bottom: 20px;
  color: #333;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.chart-placeholder {
  height: 300px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  border-radius: 4px;
}

.realtime-section,
.inventory-section,
.sales-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.realtime-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.realtime-header h3 {
  margin: 0;
  color: #333;
}

.total-info {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;
}

.inventory-section h3,
.sales-section h3 {
  margin-bottom: 20px;
  color: #333;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.date-range {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .realtime-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .total-info {
    flex-direction: column;
    gap: 5px;
  }
  
  .date-range {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>