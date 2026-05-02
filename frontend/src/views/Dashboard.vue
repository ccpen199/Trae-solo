<template>
  <div>
    <div class="page-title">工作台</div>
    
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-number">{{ summary.total }}</div>
          <div class="stat-label">全部单据</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-number" style="color: #909399">{{ summary.draft }}</div>
          <div class="stat-label">草稿</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-number" style="color: #e6a23c">{{ summary.pendingTax }}</div>
          <div class="stat-label">待税额计算</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-number" style="color: #67c23a">{{ summary.completed }}</div>
          <div class="stat-label">已完成</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-number" style="color: #409eff; font-size: 24px">
            ¥{{ summary.totalTaxAmount?.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) || '0.00' }}
          </div>
          <div class="stat-label">总税额</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-number" style="color: #409eff; font-size: 24px">
            ¥{{ summary.totalAmount?.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) || '0.00' }}
          </div>
          <div class="stat-label">总金额</div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近单据</span>
              <el-button type="primary" link @click="$router.push('/orders')">查看全部</el-button>
            </div>
          </template>
          
          <el-table :data="recentOrders" v-loading="loading" style="width: 100%">
            <el-table-column prop="order_no" label="单据编号" min-width="180">
              <template #default="scope">
                <el-button type="primary" link @click="viewOrder(scope.row.id)">
                  {{ scope.row.order_no }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column prop="tax_name" label="税种" width="100" />
            <el-table-column prop="status_display" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)" size="small">
                  {{ scope.row.status_display }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="total_amount" label="金额" width="120">
              <template #default="scope">
                ¥{{ scope.row.total_amount?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="total_tax_amount" label="税额" width="120">
              <template #default="scope">
                ¥{{ scope.row.total_tax_amount?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="created_by_name" label="创建人" width="100" />
            <el-table-column prop="created_at" label="创建时间" width="170">
              <template #default="scope">
                {{ formatDate(scope.row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
          
          <el-empty v-if="!loading && recentOrders.length === 0" description="暂无数据" />
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          
          <el-menu mode="vertical" default-active="1">
            <el-menu-item index="1" @click="$router.push('/orders/create')">
              <el-icon><Plus /></el-icon>
              <span>新建申报</span>
            </el-menu-item>
            <el-menu-item index="2" @click="$router.push('/orders')">
              <el-icon><List /></el-icon>
              <span>主单台账</span>
            </el-menu-item>
          </el-menu>
          
          <el-divider />
          
          <div class="status-distribution">
            <h4 style="margin-bottom: 12px; color: #606266">状态分布</h4>
            <el-progress 
              :percentage="getPercentage(summary.draft, summary.total)" 
              :color="#909399"
              :stroke-width="18"
              :text-inside="true"
              style="margin-bottom: 10px"
            >
              <template #default="{ percentage }">
                <span style="font-size: 12px">草稿 {{ summary.draft }}</span>
              </template>
            </el-progress>
            <el-progress 
              :percentage="getPercentage(summary.pendingTax + summary.pendingDeclaration + summary.pendingReceipt + summary.pendingRisk, summary.total)" 
              :color="#e6a23c"
              :stroke-width="18"
              :text-inside="true"
              style="margin-bottom: 10px"
            >
              <template #default="{ percentage }">
                <span style="font-size: 12px">处理中 {{ summary.pendingTax + summary.pendingDeclaration + summary.pendingReceipt + summary.pendingRisk }}</span>
              </template>
            </el-progress>
            <el-progress 
              :percentage="getPercentage(summary.completed, summary.total)" 
              :color="#67c23a"
              :stroke-width="18"
              :text-inside="true"
            >
              <template #default="{ percentage }">
                <span style="font-size: 12px">已完成 {{ summary.completed }}</span>
              </template>
            </el-progress>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { getDashboardStats } from '@/api/order'

const router = useRouter()

const loading = ref(false)
const summary = reactive({
  total: 0,
  draft: 0,
  pendingTax: 0,
  pendingDeclaration: 0,
  pendingReceipt: 0,
  pendingRisk: 0,
  supplement: 0,
  completed: 0,
  rejected: 0,
  cancelled: 0,
  totalAmount: 0,
  totalTaxAmount: 0
})
const recentOrders = ref([])

const fetchStats = async () => {
  loading.value = true
  try {
    const res = await getDashboardStats()
    const data = res.data.summary
    summary.total = data.total
    summary.draft = data.draft
    summary.pendingTax = data.pendingTax
    summary.pendingDeclaration = data.pendingDeclaration
    summary.pendingReceipt = data.pendingReceipt
    summary.pendingRisk = data.pendingRisk
    summary.supplement = data.supplement
    summary.completed = data.completed
    summary.rejected = data.rejected
    summary.cancelled = data.cancelled
    summary.totalAmount = data.totalAmount
    summary.totalTaxAmount = data.totalTaxAmount
    
    recentOrders.value = res.data.recentOrders || []
  } catch (e) {
    console.error('Fetch stats error:', e)
  } finally {
    loading.value = false
  }
}

const getStatusType = (status) => {
  const map = {
    draft: 'info',
    pending_tax_calculation: 'warning',
    pending_declaration: 'warning',
    pending_receipt: 'warning',
    pending_risk_check: 'warning',
    supplement: 'danger',
    completed: 'success',
    rejected: 'danger',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const getPercentage = (value, total) => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

const viewOrder = (id) => {
  router.push(`/orders/${id}`)
}

onMounted(() => {
  fetchStats()
})
</script>
