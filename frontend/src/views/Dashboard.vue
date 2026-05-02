<template>
  <div>
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF;">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalPurchases }}</div>
              <div class="stat-label">采购申请总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C;">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingApproval }}</div>
              <div class="stat-label">待审批</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A;">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.approved }}</div>
              <div class="stat-label">已通过</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F56C6C;">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalAmount.toFixed(2) }}</div>
              <div class="stat-label">总金额 (¥)</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>快速操作</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card shadow="hover" style="text-align: center; cursor: pointer;" @click="goToCreatePurchase">
                <el-icon size="40" color="#409EFF"><Plus /></el-icon>
                <div style="margin-top: 10px;">新建采购申请</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" style="text-align: center; cursor: pointer;" @click="goToProducts">
                <el-icon size="40" color="#67C23A"><Goods /></el-icon>
                <div style="margin-top: 10px;">商品目录</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" style="text-align: center; cursor: pointer;" @click="goToMyPurchases">
                <el-icon size="40" color="#E6A23C"><Document /></el-icon>
                <div style="margin-top: 10px;">我的申请</div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>最近申请</span>
              <el-button type="text" @click="goToPurchases">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentPurchases" v-loading="loading">
            <el-table-column prop="order_no" label="订单号" width="200" />
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="total_amount_with_tax" label="金额" width="120">
              <template #default="{ row }">
                ¥{{ row.total_amount_with_tax?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusName(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>系统状态</span>
          </template>
          <div class="system-status">
            <div class="status-item">
              <div class="status-dot"></div>
              <span>数据库连接正常</span>
            </div>
            <div class="status-item">
              <div class="status-dot"></div>
              <span>API服务正常</span>
            </div>
            <div class="status-item">
              <div class="status-dot"></div>
              <span>前端服务正常</span>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header>
            <span>初始化数据</span>
          </template>
          <el-button type="primary" size="small" @click="initUser" style="margin-bottom: 10px; width: 100%;">
            初始化用户数据
          </el-button>
          <el-button type="success" size="small" @click="initProducts" style="margin-bottom: 10px; width: 100%;">
            初始化商品数据
          </el-button>
          <el-button type="warning" size="small" @click="initBudget" style="margin-bottom: 10px; width: 100%;">
            初始化预算数据
          </el-button>
          <el-button type="info" size="small" @click="initApprovalNodes" style="width: 100%;">
            初始化审批节点
          </el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const router = useRouter()
const loading = ref(false)
const recentPurchases = ref([])

const stats = reactive({
  totalPurchases: 0,
  pendingApproval: 0,
  approved: 0,
  totalAmount: 0
})

const statusMap = {
  draft: { name: '草稿', type: 'info' },
  submitted: { name: '已提交', type: 'warning' },
  pending_approval: { name: '待审批', type: 'warning' },
  approved: { name: '已通过', type: 'success' },
  rejected: { name: '已驳回', type: 'danger' },
  pending_order: { name: '待下单', type: 'primary' },
  ordered: { name: '已下单', type: 'primary' },
  receiving: { name: '收货中', type: 'warning' },
  received: { name: '已收货', type: 'success' },
  pending_settlement: { name: '待结算', type: 'warning' },
  settled: { name: '已结算', type: 'success' },
  archived: { name: '已归档', type: 'info' },
  cancelled: { name: '已取消', type: 'info' }
}

const getStatusName = (status) => statusMap[status]?.name || status
const getStatusType = (status) => statusMap[status]?.type || 'info'

const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const loadData = async () => {
  loading.value = true
  try {
    const data = await request.get('/purchases/')
    recentPurchases.value = data.slice(0, 5)
    
    stats.totalPurchases = data.length
    stats.pendingApproval = data.filter(item => item.status === 'pending_approval').length
    stats.approved = data.filter(item => item.status === 'approved').length
    stats.totalAmount = data.reduce((sum, item) => sum + (item.total_amount_with_tax || 0), 0)
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

const initUser = async () => {
  try {
    const result = await request.post('/auth/init-data')
    ElMessage.success(result.message || '用户数据初始化成功')
  } catch (error) {
    console.error('初始化失败:', error)
  }
}

const initProducts = async () => {
  try {
    const result = await request.post('/products/init-data')
    ElMessage.success(result.message || '商品数据初始化成功')
  } catch (error) {
    console.error('初始化失败:', error)
  }
}

const initBudget = async () => {
  try {
    const result = await request.post('/purchases/init-budget')
    ElMessage.success(result.message || '预算数据初始化成功')
  } catch (error) {
    console.error('初始化失败:', error)
  }
}

const initApprovalNodes = async () => {
  try {
    const result = await request.post('/purchases/init-approval-nodes')
    ElMessage.success(result.message || '审批节点初始化成功')
  } catch (error) {
    console.error('初始化失败:', error)
  }
}

const goToCreatePurchase = () => router.push('/purchases/create')
const goToProducts = () => router.push('/products')
const goToMyPurchases = () => router.push('/purchases')
const goToPurchases = () => router.push('/purchases')

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stat-card {
  padding: 10px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 30px;
}

.stat-info {
  margin-left: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.system-status {
  padding: 10px 0;
}

.status-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.status-item:last-child {
  border-bottom: none;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #67C23A;
  margin-right: 10px;
}
</style>
