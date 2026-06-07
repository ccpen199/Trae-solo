<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">运营管理后台</h2>
      <p class="page-subtitle">数据概览与运营分析</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-content">
            <div class="stat-icon user-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total_users }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-content">
            <div class="stat-icon merchant-icon">
              <el-icon><Shop /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total_merchants }}</div>
              <div class="stat-label">入驻商家</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-content">
            <div class="stat-icon order-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total_orders }}</div>
              <div class="stat-label">总订单数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-content">
            <div class="stat-icon revenue-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatNumber(stats.total_revenue) }}</div>
              <div class="stat-label">平台GMV</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <span>商家入驻趋势</span>
          </template>
          <div ref="trendChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <span>热门婚礼风格排行</span>
          </template>
          <div class="style-ranking">
            <div class="rank-item" v-for="(item, index) in popularStyles" :key="item.style">
              <span class="rank-num" :class="getRankClass(index)">{{ index + 1 }}</span>
              <span class="style-name">{{ item.style }}</span>
              <span class="style-count">{{ item.count }} 次选择</span>
              <el-tag :type="item.trend.startsWith('+') ? 'success' : 'danger'" size="small">
                {{ item.trend }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <div class="flex-between">
              <span>待审核商家</span>
              <el-link type="primary" @click="$router.push('/dashboard/admin/merchants')">查看全部</el-link>
            </div>
          </template>
          <el-table :data="pendingMerchants" style="width: 100%;">
            <el-table-column prop="company_name" label="商家名称" />
            <el-table-column prop="category" label="类别" />
            <el-table-column prop="phone" label="联系电话" />
            <el-table-column prop="certification_status" label="状态">
              <template #default="{ row }">
                <el-tag type="warning">待审核</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <div class="flex-between">
              <span>区域热门商家分布</span>
              <el-link type="primary" @click="$router.push('/dashboard/admin/trends')">趋势分析</el-link>
            </div>
          </template>
          <div class="region-list">
            <div class="region-item" v-for="region in regions" :key="region.region">
              <span class="region-name">{{ region.region }}</span>
              <div class="region-info">
                <span>{{ region.merchant_count }} 商家</span>
                <span>评分 {{ region.avg_rating?.toFixed(1) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="card-shadow">
          <template #header>
            <div class="flex-between">
              <span>快捷入口</span>
            </div>
          </template>
          <div class="quick-actions">
            <div class="action-item" @click="$router.push('/dashboard/admin/merchants')">
              <el-icon class="action-icon"><User /></el-icon>
              <span>商家管理</span>
            </div>
            <div class="action-item" @click="$router.push('/dashboard/admin/credit')">
              <el-icon class="action-icon"><Star /></el-icon>
              <span>信用分评估</span>
            </div>
            <div class="action-item" @click="$router.push('/dashboard/admin/trends')">
              <el-icon class="action-icon"><TrendCharts /></el-icon>
              <span>婚策趋势</span>
            </div>
            <div class="action-item" @click="$router.push('/dashboard/admin/funnel')">
              <el-icon class="action-icon"><Histogram /></el-icon>
              <span>转化漏斗</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
import * as echarts from 'echarts'

const stats = ref({
  total_users: 0,
  total_merchants: 0,
  total_orders: 0,
  total_revenue: 0
})
const pendingMerchants = ref([])
const popularStyles = ref([])
const regions = ref([])
const trendChartRef = ref(null)

function formatNumber(num) {
  return (num || 0).toLocaleString()
}

function getRankClass(index) {
  if (index === 0) return 'first'
  if (index === 1) return 'second'
  if (index === 2) return 'third'
  return ''
}

async function loadStats() {
  try {
    const res = await api.get('/admin/stats')
    stats.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function loadMerchants() {
  try {
    const res = await api.get('/admin/merchants?status=pending')
    pendingMerchants.value = res.data.slice(0, 5)
  } catch (e) {
    console.error(e)
  }
}

async function loadTrends() {
  try {
    const res = await api.get('/admin/trends')
    popularStyles.value = res.data.popularStyles || []
    regions.value = res.data.regions || []
    
    initChart(res.data.trends || [])
  } catch (e) {
    console.error(e)
  }
}

function initChart(data) {
  if (!trendChartRef.value) return
  
  const chart = echarts.init(trendChartRef.value)
  const categories = [...new Set(data.map(d => d.category))]
  const dates = [...new Set(data.map(d => d.date))].sort()
  
  const series = categories.map(cat => ({
    name: cat,
    type: 'line',
    smooth: true,
    data: dates.map(date => {
      const item = data.find(d => d.date === date && d.category === cat)
      return item ? item.count : 0
    })
  }))
  
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: categories },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value' },
    series
  })
}

onMounted(() => {
  loadStats()
  loadMerchants()
  loadTrends()
})
</script>

<style scoped lang="scss">
.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: #fff;
      margin-right: 16px;
      
      &.user-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      &.merchant-icon {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
      
      &.order-icon {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
      
      &.revenue-icon {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      }
    }
    
    .stat-info {
      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }
  }
}

.style-ranking {
  .rank-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #ebeef5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .rank-num {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      margin-right: 12px;
      
      &.first {
        background: #f59e0b;
        color: #fff;
      }
      
      &.second {
        background: #9ca3af;
        color: #fff;
      }
      
      &.third {
        background: #d97706;
        color: #fff;
      }
    }
    
    .style-name {
      flex: 1;
      font-size: 14px;
      color: #303133;
    }
    
    .style-count {
      font-size: 14px;
      color: #606266;
      margin-right: 12px;
    }
  }
}

.region-list {
  .region-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #ebeef5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .region-name {
      font-size: 14px;
      color: #303133;
      font-weight: 500;
    }
    
    .region-info {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #606266;
    }
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  
  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px;
    background: #f5f7fa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background: #e4e7ed;
      transform: translateY(-2px);
    }
    
    .action-icon {
      font-size: 40px;
      color: #ff6b9d;
      margin-bottom: 12px;
    }
    
    span {
      font-size: 16px;
      color: #303133;
    }
  }
}
</style>
