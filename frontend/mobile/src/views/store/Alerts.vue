<template>
  <div class="store-alerts">
    <div class="alerts-header">
      <h3>门店预警</h3>
      <el-button type="primary" size="small" @click="refreshAlerts">
        刷新
      </el-button>
    </div>

    <div class="alerts-section">
      <h4>库存预警</h4>
      <div class="alert-list">
        <div v-for="(item, index) in inventoryAlerts" :key="index" class="alert-item warning">
          <div class="alert-content">
            <div class="alert-title">{{ item.productName }}</div>
            <div class="alert-detail">
              当前库存: {{ item.currentStock }}
              <span class="threshold">（预警: {{ item.lowStockThreshold }}）</span>
            </div>
          </div>
          <el-button type="primary" size="small" @click="handleStockAlert(item)">
            处理
          </el-button>
        </div>
        <div v-if="inventoryAlerts.length === 0" class="empty-alerts">
          <p>暂无库存预警</p>
        </div>
      </div>
    </div>

    <div class="alerts-section">
      <h4>销售异常</h4>
      <div class="alert-list">
        <div v-for="(item, index) in salesAlerts" :key="index" class="alert-item danger">
          <div class="alert-content">
            <div class="alert-title">{{ item.title }}</div>
            <div class="alert-detail">{{ item.detail }}</div>
          </div>
          <el-button type="danger" size="small" @click="handleSalesAlert(item)">
            查看
          </el-button>
        </div>
        <div v-if="salesAlerts.length === 0" class="empty-alerts">
          <p>暂无销售异常</p>
        </div>
      </div>
    </div>

    <div class="alerts-section">
      <h4>系统通知</h4>
      <div class="alert-list">
        <div v-for="(item, index) in systemAlerts" :key="index" class="alert-item info">
          <div class="alert-content">
            <div class="alert-title">{{ item.title }}</div>
            <div class="alert-detail">{{ item.detail }}</div>
            <div class="alert-time">{{ item.time }}</div>
          </div>
        </div>
        <div v-if="systemAlerts.length === 0" class="empty-alerts">
          <p>暂无系统通知</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const inventoryAlerts = ref([])
const salesAlerts = ref([])
const systemAlerts = ref([])

const userInfo = computed(() => {
  const user = localStorage.getItem('userInfo')
  return user ? JSON.parse(user) : null
})

onMounted(() => {
  loadInventoryAlerts()
  loadSalesAlerts()
  loadSystemAlerts()
})

const refreshAlerts = () => {
  loadInventoryAlerts()
  loadSalesAlerts()
  loadSystemAlerts()
  ElMessage.success('刷新成功')
}

const loadInventoryAlerts = async () => {
  if (!userInfo.value?.storeId) return
  
  try {
    const response = await axios.get(`/api/manager/inventory-alert?storeId=${userInfo.value.storeId}`)
    if (response.data.success) {
      inventoryAlerts.value = response.data.data
    }
  } catch (error) {
    console.error('加载库存预警失败:', error)
    // 加载模拟数据
    loadMockInventoryAlerts()
  }
}

const loadSalesAlerts = () => {
  // 模拟数据
  salesAlerts.value = [
    {
      title: '销售异常下降',
      detail: '今日销售额较昨日下降30%',
      time: '10:30'
    },
    {
      title: '商品销售异常',
      detail: '可口可乐销量异常增长',
      time: '09:15'
    }
  ]
}

const loadSystemAlerts = () => {
  // 模拟数据
  systemAlerts.value = [
    {
      title: '系统更新通知',
      detail: '系统将于今晚23:00进行例行维护',
      time: '08:00'
    },
    {
      title: '新功能上线',
      detail: '会员积分兑换功能已上线',
      time: '昨天'
    }
  ]
}

const loadMockInventoryAlerts = () => {
  inventoryAlerts.value = [
    {
      productId: 1,
      productName: '可口可乐',
      currentStock: 5,
      lowStockThreshold: 10
    },
    {
      productId: 2,
      productName: '康师傅冰红茶',
      currentStock: 3,
      lowStockThreshold: 10
    },
    {
      productId: 3,
      productName: '脉动',
      currentStock: 8,
      lowStockThreshold: 10
    }
  ]
}

const handleStockAlert = (item) => {
  ElMessageBox.alert(`商品 ${item.productName} 库存不足，当前库存: ${item.currentStock}，建议补货至至少 ${item.lowStockThreshold * 2} 件。`, '库存预警', {
    confirmButtonText: '确定',
    type: 'warning'
  })
}

const handleSalesAlert = (item) => {
  ElMessageBox.alert(item.detail, item.title, {
    confirmButtonText: '确定',
    type: 'danger'
  })
}
</script>

<style scoped>
.store-alerts {
  padding-bottom: 20px;
}

.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.alerts-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.alerts-section {
  background: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.alerts-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.alert-list {
  margin-top: 10px;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 8px;
  border-left: 4px solid;
}

.alert-item.warning {
  background: #fdf6ec;
  border-left-color: #e6a23c;
}

.alert-item.danger {
  background: #fef0f0;
  border-left-color: #f56c6c;
}

.alert-item.info {
  background: #ecf5ff;
  border-left-color: #409EFF;
}

.alert-content {
  flex: 1;
  margin-right: 10px;
}

.alert-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
}

.alert-detail {
  font-size: 12px;
  color: #666;
  margin-bottom: 3px;
}

.threshold {
  color: #909399;
}

.alert-time {
  font-size: 11px;
  color: #909399;
}

.empty-alerts {
  text-align: center;
  padding: 30px 0;
  color: #909399;
}
</style>