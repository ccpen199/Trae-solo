<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card order">
          <div class="stat-header">
            <span class="stat-label">今日订单</span>
            <span class="stat-icon-badge">📦</span>
          </div>
          <div class="stat-value">{{ overview.todayOrderCount || 0 }}</div>
          <div class="stat-footer">
            <span class="stat-change up">↑ 6.67%</span>
            <span class="stat-compare">较昨日 {{ overview.yesterdayOrderCount || 0 }}</span>
          </div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="stat-card amount">
          <div class="stat-header">
            <span class="stat-label">今日营业额</span>
            <span class="stat-icon-badge">💰</span>
          </div>
          <div class="stat-value">¥{{ formatAmount(overview.todayValidAmount) }}</div>
          <div class="stat-footer">
            <span class="stat-change up">↑ 7.92%</span>
            <span class="stat-compare">较昨日 ¥{{ formatAmount(overview.yesterdayValidAmount) }}</span>
          </div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="stat-card cancel">
          <div class="stat-header">
            <span class="stat-label">今日取消率</span>
            <span class="stat-icon-badge">⚠️</span>
          </div>
          <div class="stat-value">{{ overview.todayCancelRate || 0 }}%</div>
          <div class="stat-footer">
            <span class="stat-change down">↑ 2.5%</span>
            <span class="stat-compare">较昨日</span>
          </div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="stat-card receive">
          <div class="stat-header">
            <span class="stat-label">今日接单率</span>
            <span class="stat-icon-badge">✅</span>
          </div>
          <div class="stat-value">{{ overview.todayReceiveRate || 0 }}%</div>
          <div class="stat-footer">
            <span class="stat-change up">↑ 1.2%</span>
            <span class="stat-compare">较昨日</span>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="content-row">
      <el-col :span="16">
        <el-card class="card-box">
          <template #header>
            <div class="card-header">
              <span>📊 订单趋势（近7天）</span>
            </div>
          </template>
          <div class="trend-data">
            <div class="trend-item" v-for="(item, index) in trendData" :key="index">
              <div class="trend-date">{{ item.date }}</div>
              <div class="trend-bars">
                <div class="trend-bar-wrapper">
                  <div class="trend-bar orders" :style="{ height: (item.orders / 150) * 100 + '%' }"></div>
                  <span class="trend-value">{{ item.orders }}单</span>
                </div>
                <div class="trend-bar-wrapper">
                  <div class="trend-bar amount" :style="{ height: (item.amount / 10000) * 100 + '%' }"></div>
                  <span class="trend-value">¥{{ item.amount }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="trend-legend">
            <span class="legend-item"><span class="legend-dot orders"></span> 订单量</span>
            <span class="legend-item"><span class="legend-dot amount"></span> 营业额</span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="card-box">
          <template #header>
            <div class="card-header">
              <span>📋 今日订单状态</span>
              <el-button type="primary" link size="small" @click="goToOrderList">查看全部</el-button>
            </div>
          </template>
          <div class="status-list">
            <div class="status-item" v-for="item in statusDistribution" :key="item.status">
              <div class="status-info">
                <span class="status-dot" :class="item.class"></span>
                <span class="status-name">{{ item.name }}</span>
              </div>
              <span class="status-count">{{ item.count }} 单</span>
            </div>
          </div>
        </el-card>
        
        <el-card class="card-box" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>🔗 平台授权状态</span>
            </div>
          </template>
          <div class="platform-list">
            <div class="platform-item" v-for="platform in platforms" :key="platform.code">
              <div class="platform-info">
                <div class="platform-avatar" :style="{ backgroundColor: platform.color }">
                  {{ platform.icon }}
                </div>
                <div class="platform-text">
                  <span class="platform-name">{{ platform.name }}</span>
                  <span class="platform-status" :class="platform.status ? 'active' : 'inactive'">
                    {{ platform.status ? '✓ 已授权' : '○ 未授权' }}
                  </span>
                </div>
              </div>
              <el-button :type="platform.status ? 'info' : 'primary'" size="small" link>
                {{ platform.status ? '查看' : '授权' }}
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="extra-row">
      <el-col :span="8">
        <el-card class="card-box">
          <template #header>
            <span>📈 营业统计</span>
          </template>
          <div class="stat-grid">
            <div class="stat-grid-item">
              <div class="stat-grid-value">{{ overview.weekOrderCount || 0 }}</div>
              <div class="stat-grid-label">本周订单</div>
            </div>
            <div class="stat-grid-item">
              <div class="stat-grid-value">¥{{ formatAmount(overview.weekValidAmount) }}</div>
              <div class="stat-grid-label">本周营收</div>
            </div>
            <div class="stat-grid-item">
              <div class="stat-grid-value">{{ overview.monthOrderCount || 0 }}</div>
              <div class="stat-grid-label">本月订单</div>
            </div>
            <div class="stat-grid-item">
              <div class="stat-grid-value">¥{{ formatAmount(overview.monthValidAmount) }}</div>
              <div class="stat-grid-label">本月营收</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="card-box">
          <template #header>
            <span>🎯 效率指标</span>
          </template>
          <div class="efficiency-list">
            <div class="efficiency-item">
              <span class="efficiency-label">自动接单</span>
              <span class="efficiency-value">{{ overview.todayAutoReceiveCount || 0 }} 单</span>
            </div>
            <div class="efficiency-item">
              <span class="efficiency-label">手动接单</span>
              <span class="efficiency-value">{{ overview.todayManualReceiveCount || 0 }} 单</span>
            </div>
            <div class="efficiency-item">
              <span class="efficiency-label">打印次数</span>
              <span class="efficiency-value">{{ overview.todayPrintCount || 0 }} 次</span>
            </div>
            <div class="efficiency-item">
              <span class="efficiency-label">平均配送时长</span>
              <span class="efficiency-value">{{ overview.todayAvgDeliveryTime || 0 }} 分钟</span>
            </div>
            <div class="efficiency-item">
              <span class="efficiency-label">平均制作时长</span>
              <span class="efficiency-value">{{ overview.todayAvgPrepareTime || 0 }} 分钟</span>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="card-box">
          <template #header>
            <span>ℹ️ 系统信息</span>
          </template>
          <div class="system-info">
            <div class="system-item">
              <span class="system-label">运行模式</span>
              <el-tag type="success">Mock 数据模式</el-tag>
            </div>
            <div class="system-item">
              <span class="system-label">当前用户</span>
              <span class="system-value">测试商家</span>
            </div>
            <div class="system-item">
              <span class="system-label">当前店铺</span>
              <span class="system-value">美味餐厅(中关村店)</span>
            </div>
            <div class="system-item">
              <span class="system-label">测试账号</span>
              <el-tag size="small">merchant / 123456</el-tag>
            </div>
            <div class="system-item">
              <span class="system-label">前端端口</span>
              <el-tag type="info">9471</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getStatisticsOverview } from '@/api/statistics'
import type { StatisticsOverview } from '@/api/statistics'

const router = useRouter()

const overview = ref<StatisticsOverview>({
  todayOrderCount: 48,
  todayValidOrderCount: 42,
  todayTotalAmount: 3280,
  todayValidAmount: 2860,
  todayCancelCount: 3,
  todayRefundCount: 2,
  todayCancelRate: 6.25,
  todayRefundRate: 4.17,
  todayReceiveRate: 95.8,
  todayAutoReceiveCount: 35,
  todayManualReceiveCount: 7,
  todayPrintCount: 42,
  todayAvgDeliveryTime: 25.5,
  todayAvgPrepareTime: 18.3,
  yesterdayOrderCount: 45,
  yesterdayValidAmount: 2650,
  weekOrderCount: 285,
  weekValidAmount: 18650,
  weekCancelRate: 5.8,
  monthOrderCount: 1256,
  monthValidAmount: 82500,
  monthCancelRate: 6.1,
  calculationBasis: '{"source":"mock"}'
})

const platforms = ref([
  { code: 'meituan', name: '美团外卖', icon: '美', color: '#ffd100', status: true },
  { code: 'eleme', name: '饿了么', icon: '饿', color: '#0089dc', status: true },
  { code: 'self', name: '自营平台', icon: '自', color: '#67c23a', status: false }
])

const statusDistribution = ref([
  { status: 'pending', name: '待接单', count: 3, class: 'pending' },
  { status: 'preparing', name: '制作中', count: 5, class: 'preparing' },
  { status: 'delivering', name: '配送中', count: 8, class: 'delivering' },
  { status: 'completed', name: '已完成', count: 156, class: 'completed' },
  { status: 'cancelled', name: '已取消', count: 3, class: 'cancelled' }
])

const trendData = computed(() => {
  const data = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      orders: 40 + Math.floor(Math.random() * 30),
      amount: 3000 + Math.floor(Math.random() * 2000)
    })
  }
  return data
})

function formatAmount(amount: number | undefined): string {
  if (!amount) return '0.00'
  return amount.toFixed(2)
}

function goToOrderList() {
  router.push('/order/list')
}

onMounted(async () => {
  try {
    const res = await getStatisticsOverview()
    if (res.code === 200 && res.data) {
      overview.value = res.data
    }
  } catch (e) {
    console.log('使用默认统计数据')
  }
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 0;
}

.stat-row {
  margin-bottom: 20px;
  
  .stat-card {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
    
    &.order {
      border-left: 4px solid #409eff;
    }
    
    &.amount {
      border-left: 4px solid #67c23a;
    }
    
    &.cancel {
      border-left: 4px solid #f56c6c;
    }
    
    &.receive {
      border-left: 4px solid #e6a23c;
    }
    
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      .stat-label {
        font-size: 14px;
        color: #909399;
      }
      
      .stat-icon-badge {
        font-size: 24px;
      }
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
    }
    
    .stat-footer {
      display: flex;
      align-items: center;
      font-size: 12px;
      
      .stat-change {
        display: flex;
        align-items: center;
        
        &.up { color: #67c23a; }
        &.down { color: #f56c6c; }
      }
      
      .stat-compare {
        color: #909399;
        margin-left: 8px;
      }
    }
  }
}

.content-row, .extra-row {
  margin-bottom: 20px;
  
  .card-box {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
    
    .trend-data {
      display: flex;
      justify-content: space-between;
      padding: 20px 0;
      height: 200px;
      
      .trend-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .trend-date {
          font-size: 12px;
          color: #909399;
          margin-bottom: 10px;
        }
        
        .trend-bars {
          flex: 1;
          display: flex;
          align-items: flex-end;
          gap: 10px;
          
          .trend-bar-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            height: 150px;
            width: 24px;
            
            .trend-bar {
              width: 20px;
              border-radius: 4px 4px 0 0;
              transition: all 0.3s;
              
              &.orders { background: linear-gradient(180deg, #409eff 0%, #66b1ff 100%); }
              &.amount { background: linear-gradient(180deg, #67c23a 0%, #85ce61 100%); }
              
              &:hover {
                opacity: 0.8;
              }
            }
            
            .trend-value {
              font-size: 11px;
              color: #909399;
              margin-top: 6px;
            }
          }
        }
      }
    }
    
    .trend-legend {
      display: flex;
      justify-content: center;
      gap: 24px;
      padding-top: 10px;
      border-top: 1px solid #f0f0f0;
      
      .legend-item {
        display: flex;
        align-items: center;
        font-size: 13px;
        color: #606266;
        
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 6px;
          
          &.orders { background: #409eff; }
          &.amount { background: #67c23a; }
        }
      }
    }
    
    .status-list {
      .status-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .status-info {
          display: flex;
          align-items: center;
          
          .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 12px;
            
            &.pending { background: #e6a23c; }
            &.preparing { background: #409eff; }
            &.delivering { background: #909399; }
            &.completed { background: #67c23a; }
            &.cancelled { background: #f56c6c; }
          }
          
          .status-name {
            font-size: 14px;
            color: #606266;
          }
        }
        
        .status-count {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
        }
      }
    }
    
    .platform-list {
      .platform-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        
        .platform-info {
          display: flex;
          align-items: center;
          
          .platform-avatar {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 600;
            color: #fff;
          }
          
          .platform-text {
            margin-left: 12px;
            display: flex;
            flex-direction: column;
            
            .platform-name {
              font-size: 14px;
              font-weight: 500;
              color: #303133;
            }
            
            .platform-status {
              font-size: 12px;
              margin-top: 2px;
              
              &.active { color: #67c23a; }
              &.inactive { color: #909399; }
            }
          }
        }
      }
    }
    
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      
      .stat-grid-item {
        text-align: center;
        padding: 12px;
        background: #f5f7fa;
        border-radius: 8px;
        
        .stat-grid-value {
          font-size: 20px;
          font-weight: 600;
          color: #303133;
        }
        
        .stat-grid-label {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }
    
    .efficiency-list {
      .efficiency-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .efficiency-label {
          font-size: 14px;
          color: #606266;
        }
        
        .efficiency-value {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
        }
      }
    }
    
    .system-info {
      .system-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .system-label {
          font-size: 14px;
          color: #606266;
        }
        
        .system-value {
          font-size: 14px;
          color: #303133;
        }
      }
    }
  }
}
</style>
