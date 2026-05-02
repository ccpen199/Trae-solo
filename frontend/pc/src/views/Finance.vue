<template>
  <div class="finance-container">
    <div class="finance-header">
      <div class="header-left">
        <h2>财务管理</h2>
        <span class="store-info">{{ userInfo?.storeName || '门店' }}</span>
      </div>
      <div class="header-right">
        <span class="finance-name">{{ userInfo?.realName || '财务' }}</span>
        <el-button type="primary" plain @click="handleLogout">退出</el-button>
      </div>
    </div>

    <div class="finance-content">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="日结管理" name="settlement">
          <div class="settlement-section">
            <div class="settlement-header">
              <h3>日结报表</h3>
              <div class="date-selector">
                <el-date-picker
                  v-model="settlementDate"
                  type="date"
                  placeholder="选择日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
                <el-button type="primary" @click="generateSettlement">生成日结</el-button>
              </div>
            </div>
            
            <div v-if="currentSettlement" class="settlement-detail">
              <div class="settlement-info">
                <div class="info-row">
                  <span class="label">日期:</span>
                  <span>{{ currentSettlement.settlementDate }}</span>
                </div>
                <div class="info-row">
                  <span class="label">总销售额:</span>
                  <span class="amount">¥{{ currentSettlement.totalSales.toFixed(2) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">总退款:</span>
                  <span class="amount refund">¥{{ currentSettlement.totalRefund.toFixed(2) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">总折扣:</span>
                  <span class="amount">¥{{ currentSettlement.totalDiscount.toFixed(2) }}</span>
                </div>
              </div>
              
              <div class="payment-breakdown">
                <h4>支付方式明细</h4>
                <div class="payment-row">
                  <span>现金:</span>
                  <span>¥{{ currentSettlement.cashSales.toFixed(2) }}</span>
                </div>
                <div class="payment-row">
                  <span>银行卡:</span>
                  <span>¥{{ currentSettlement.cardSales.toFixed(2) }}</span>
                </div>
                <div class="payment-row">
                  <span>微信支付:</span>
                  <span>¥{{ currentSettlement.wechatSales.toFixed(2) }}</span>
                </div>
                <div class="payment-row">
                  <span>支付宝:</span>
                  <span>¥{{ currentSettlement.alipaySales.toFixed(2) }}</span>
                </div>
              </div>
              
              <div class="other-stats">
                <h4>其他统计</h4>
                <div class="stats-grid">
                  <div class="stat-item">
                    <span>交易笔数:</span>
                    <span>{{ currentSettlement.transactionCount }}</span>
                  </div>
                  <div class="stat-item">
                    <span>退款笔数:</span>
                    <span>{{ currentSettlement.refundCount }}</span>
                  </div>
                  <div class="stat-item">
                    <span>积分使用:</span>
                    <span>{{ currentSettlement.pointsRedeemed }}</span>
                  </div>
                  <div class="stat-item">
                    <span>优惠券使用:</span>
                    <span>{{ currentSettlement.couponsUsed }}</span>
                  </div>
                </div>
              </div>
              
              <div class="settlement-actions">
                <el-button type="primary" @click="exportSettlement">导出报表</el-button>
                <el-button @click="printSettlement">打印报表</el-button>
              </div>
            </div>
            <div v-else class="empty-settlement">
              <p>请选择日期并生成日结报表</p>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="交易流水" name="flow">
          <div class="flow-section">
            <div class="flow-header">
              <h3>交易流水</h3>
              <div class="date-selector">
                <el-date-picker
                  v-model="flowDate"
                  type="date"
                  placeholder="选择日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  @change="loadTransactionFlow"
                />
              </div>
            </div>
            <el-table :data="transactionFlows || []" style="width: 100%">
              <el-table-column prop="transactionNo" label="交易号" width="180" />
              <el-table-column prop="cashierName" label="收银员" width="120" />
              <el-table-column prop="memberName" label="会员" width="120" />
              <el-table-column prop="totalAmount" label="总金额" width="100">
                <template #default="scope">
                  ¥{{ scope.row.totalAmount?.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="discountAmount" label="折扣" width="100">
                <template #default="scope">
                  ¥{{ scope.row.discountAmount?.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="actualAmount" label="实收" width="100">
                <template #default="scope">
                  ¥{{ scope.row.actualAmount?.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="paymentMethod" label="支付方式" width="100" />
              <el-table-column prop="status" label="状态" width="80" />
              <el-table-column prop="transactionTime" label="交易时间">
                <template #default="scope">
                  {{ formatDateTime(scope.row.transactionTime) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="财务报表" name="summary">
          <div class="summary-section">
            <div class="summary-header">
              <h3>财务汇总</h3>
              <div class="date-range">
                <el-date-picker
                  v-model="summaryDateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  @change="loadSummary"
                />
                <el-button type="primary" @click="loadSummary">查询</el-button>
              </div>
            </div>
            
            <div v-if="summaryData" class="summary-detail">
              <div class="summary-grid">
                <div class="summary-card">
                  <div class="summary-title">总销售额</div>
                  <div class="summary-value">¥{{ summaryData.totalSales?.toFixed(2) || '0.00' }}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-title">总退款</div>
                  <div class="summary-value refund">¥{{ summaryData.totalRefund?.toFixed(2) || '0.00' }}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-title">净销售额</div>
                  <div class="summary-value">¥{{ summaryData.netSales?.toFixed(2) || '0.00' }}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-title">平均客单价</div>
                  <div class="summary-value">¥{{ summaryData.avgTransactionAmount?.toFixed(2) || '0.00' }}</div>
                </div>
              </div>
              
              <div class="summary-actions">
                <el-button type="primary" @click="exportSummary">导出报表</el-button>
              </div>
            </div>
            <div v-else class="empty-summary">
              <p>请选择日期范围并查询</p>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const activeTab = ref('settlement')
const settlementDate = ref(new Date())
const currentSettlement = ref(null)
const flowDate = ref(new Date())
const transactionFlows = ref([])
const summaryDateRange = ref([])
const summaryData = ref(null)

const userInfo = computed(() => {
  const user = localStorage.getItem('userInfo')
  return user ? JSON.parse(user) : null
})

onMounted(() => {
  loadSummary()
})

const generateSettlement = async () => {
  if (!settlementDate.value) {
    ElMessage.warning('请选择日期')
    return
  }
  
  try {
    const response = await axios.post('/api/finance/settlement/daily', {
      storeId: userInfo.value?.storeId || 1,
      date: settlementDate.value
    })
    
    if (response.data.success) {
      currentSettlement.value = response.data.data
      ElMessage.success('日结生成成功')
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (error) {
    console.error('生成日结失败:', error)
    ElMessage.error('生成日结失败，请稍后重试')
  }
}

const loadTransactionFlow = async () => {
  if (!flowDate.value) return
  
  try {
    const response = await axios.get(`/api/finance/flow?storeId=${userInfo.value?.storeId || 1}&date=${flowDate.value}`)
    if (response.data.success) {
      transactionFlows.value = response.data.data
    }
  } catch (error) {
    console.error('加载交易流水失败:', error)
  }
}

const loadSummary = async () => {
  if (!summaryDateRange.value || summaryDateRange.value.length !== 2) {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)
    summaryDateRange.value = [startDate, endDate]
  }
  
  try {
    const response = await axios.get(`/api/finance/summary?storeId=${userInfo.value?.storeId || 1}&startDate=${summaryDateRange.value[0]}&endDate=${summaryDateRange.value[1]}`)
    if (response.data.success) {
      summaryData.value = response.data.data
    }
  } catch (error) {
    console.error('加载财务汇总失败:', error)
  }
}

const exportSettlement = async () => {
  if (!currentSettlement.value) {
    ElMessage.warning('请先生成日结报表')
    return
  }
  
  try {
    const response = await axios.get(`/api/finance/export?storeId=${userInfo.value?.storeId || 1}&startDate=${currentSettlement.value.settlementDate}&endDate=${currentSettlement.value.settlementDate}`)
    if (response.data.success) {
      ElMessage.success('报表导出成功')
    }
  } catch (error) {
    console.error('导出报表失败:', error)
    ElMessage.error('导出报表失败，请稍后重试')
  }
}

const printSettlement = () => {
  if (!currentSettlement.value) {
    ElMessage.warning('请先生成日结报表')
    return
  }
  window.print()
}

const exportSummary = async () => {
  if (!summaryDateRange.value || summaryDateRange.value.length !== 2) {
    ElMessage.warning('请选择日期范围')
    return
  }
  
  try {
    const response = await axios.get(`/api/finance/export?storeId=${userInfo.value?.storeId || 1}&startDate=${summaryDateRange.value[0]}&endDate=${summaryDateRange.value[1]}`)
    if (response.data.success) {
      ElMessage.success('报表导出成功')
    }
  } catch (error) {
    console.error('导出报表失败:', error)
    ElMessage.error('导出报表失败，请稍后重试')
  }
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
.finance-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.finance-header {
  height: 60px;
  background: #f56c6c;
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

.finance-name {
  margin-right: 20px;
}

.finance-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f5f7fa;
}

.settlement-section,
.flow-section,
.summary-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.settlement-header,
.flow-header,
.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.settlement-header h3,
.flow-header h3,
.summary-header h3 {
  margin: 0;
  color: #333;
}

.date-selector,
.date-range {
  display: flex;
  gap: 10px;
  align-items: center;
}

.settlement-detail {
  margin-top: 20px;
}

.settlement-info {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
}

.label {
  font-weight: 600;
  color: #666;
}

.amount {
  font-weight: 600;
  color: #f56c6c;
}

.amount.refund {
  color: #999;
}

.payment-breakdown,
.other-stats {
  margin-bottom: 20px;
}

.payment-breakdown h4,
.other-stats h4 {
  margin-bottom: 15px;
  color: #333;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 8px;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
}

.settlement-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.empty-settlement,
.empty-summary {
  text-align: center;
  padding: 60px 0;
  color: #999;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.summary-card {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.summary-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #f56c6c;
}

.summary-value.refund {
  color: #999;
}

.summary-actions {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .settlement-header,
  .flow-header,
  .summary-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .date-selector,
  .date-range {
    flex-direction: column;
    align-items: stretch;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .summary-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .settlement-actions {
    flex-direction: column;
  }
}
</style>