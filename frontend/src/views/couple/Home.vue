<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">欢迎回来，{{ userStore.user?.name }}</h2>
      <p class="page-subtitle">开启您的完美婚礼筹备之旅</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="countdown-card card-shadow" v-if="coupleProfile && coupleProfile.wedding_date">
          <div class="countdown-header">
            <el-icon class="heart-icon"><Heart /></el-icon>
            <span class="countdown-title">距离婚礼还有</span>
          </div>
          <div class="countdown-main">
            <div class="countdown-number">{{ daysLeft }}</div>
            <div class="countdown-unit">天</div>
          </div>
          <div class="countdown-date">{{ coupleProfile.wedding_date }}</div>
          <div class="countdown-sub">
            <span>{{ partnerText }}</span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <div class="flex-between">
              <span>预算概览</span>
              <el-link type="primary" @click="$router.push('/dashboard/budget')">查看详情</el-link>
            </div>
          </template>
          <div class="budget-overview">
            <div class="budget-item">
              <div class="budget-label">总预算</div>
              <div class="budget-value">¥{{ formatNumber(coupleProfile?.budget_total || 0) }}</div>
            </div>
            <div class="budget-progress">
              <el-progress :percentage="budgetUsedPercent" :stroke-width="12" />
            </div>
            <div class="budget-footer">
              <span>已使用 ¥{{ formatNumber(budgetUsed) }}</span>
              <span class="text-muted">剩余 ¥{{ formatNumber((coupleProfile?.budget_total || 0) - budgetUsed) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card class="card-shadow">
          <template #header>
            <div class="flex-between">
              <span>婚礼筹备时间轴</span>
              <el-button type="primary" link @click="showAddTimeline = true">添加事项</el-button>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="item in timelineEvents"
              :key="item.id"
              :timestamp="item.event_date"
              :type="item.is_completed ? 'success' : 'primary'"
              :hollow="item.is_completed"
            >
              <div class="timeline-item-content">
                <span class="timeline-title">{{ item.title }}</span>
                <el-tag size="small" :type="item.is_completed ? 'success' : 'info'" style="margin-left: 10px;">
                  {{ item.is_completed ? '已完成' : '待完成' }}
                </el-tag>
                <el-button
                  v-if="!item.is_completed"
                  type="success"
                  size="small"
                  link
                  @click="completeEvent(item.id)"
                  style="margin-left: auto;"
                >
                  标记完成
                </el-button>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="card-shadow">
          <template #header>
            <span>快捷入口</span>
          </template>
          <div class="quick-actions">
            <div class="action-item" @click="$router.push('/dashboard/services')">
              <el-icon class="action-icon"><Shop /></el-icon>
              <span>找服务</span>
            </div>
            <div class="action-item" @click="$router.push('/dashboard/guides')">
              <el-icon class="action-icon"><Reading /></el-icon>
              <span>备婚攻略</span>
            </div>
            <div class="action-item" @click="$router.push('/dashboard/orders')">
              <el-icon class="action-icon"><Document /></el-icon>
              <span>我的订单</span>
            </div>
            <div class="action-item" @click="$router.push('/dashboard/preferences')">
              <el-icon class="action-icon"><Brush /></el-icon>
              <span>风格偏好</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showAddTimeline" title="添加筹备事项" width="500px">
      <el-form :model="timelineForm" label-width="100px">
        <el-form-item label="事项标题">
          <el-input v-model="timelineForm.title" placeholder="请输入事项标题" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="timelineForm.event_date" type="date" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="timelineForm.category" style="width: 100%;">
            <el-option label="酒店" value="酒店" />
            <el-option label="摄影" value="摄影" />
            <el-option label="礼服" value="礼服" />
            <el-option label="婚庆" value="婚庆" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="timelineForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTimeline = false">取消</el-button>
        <el-button type="primary" @click="addTimeline">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const userStore = useUserStore()
const coupleProfile = ref(null)
const timelineEvents = ref([])
const showAddTimeline = ref(false)
const timelineForm = ref({
  title: '',
  event_date: '',
  category: '其他',
  description: ''
})

const daysLeft = computed(() => {
  if (!coupleProfile.value?.wedding_date) return 0
  return dayjs(coupleProfile.value.wedding_date).diff(dayjs(), 'day')
})

const partnerText = computed(() => {
  if (coupleProfile.value?.partner_name) {
    return `${userStore.user?.name} & ${coupleProfile.value.partner_name}`
  }
  return ''
})

const budgetUsed = computed(() => {
  return 0
})

const budgetUsedPercent = computed(() => {
  if (!coupleProfile.value?.budget_total) return 0
  return Math.round((budgetUsed.value / coupleProfile.value.budget_total) * 100)
})

function formatNumber(num) {
  return num.toLocaleString()
}

async function loadProfile() {
  try {
    const res = await api.get('/couple/profile')
    coupleProfile.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function loadTimeline() {
  try {
    const res = await api.get('/couple/timeline')
    timelineEvents.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function addTimeline() {
  try {
    await api.post('/couple/timeline', timelineForm.value)
    ElMessage.success('添加成功')
    showAddTimeline.value = false
    timelineForm.value = { title: '', event_date: '', category: '其他', description: '' }
    loadTimeline()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '添加失败')
  }
}

async function completeEvent(id) {
  try {
    await api.put(`/couple/timeline/${id}`, { is_completed: 1 })
    ElMessage.success('已标记完成')
    loadTimeline()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadProfile()
  loadTimeline()
})
</script>

<style scoped lang="scss">
.countdown-card {
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
  color: #fff;
  border: none;
  
  :deep(.el-card__body) {
    padding: 30px;
  }
  
  .countdown-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    
    .heart-icon {
      font-size: 24px;
      margin-right: 10px;
    }
    
    .countdown-title {
      font-size: 16px;
      opacity: 0.9;
    }
  }
  
  .countdown-main {
    display: flex;
    align-items: baseline;
    margin-bottom: 10px;
    
    .countdown-number {
      font-size: 72px;
      font-weight: 700;
      line-height: 1;
    }
    
    .countdown-unit {
      font-size: 24px;
      margin-left: 10px;
    }
  }
  
  .countdown-date {
    font-size: 18px;
    margin-bottom: 10px;
    opacity: 0.9;
  }
  
  .countdown-sub {
    font-size: 16px;
    opacity: 0.85;
  }
}

.budget-overview {
  .budget-item {
    margin-bottom: 20px;
    
    .budget-label {
      font-size: 14px;
      color: #909399;
      margin-bottom: 5px;
    }
    
    .budget-value {
      font-size: 32px;
      font-weight: 600;
      color: #303133;
    }
  }
  
  .budget-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 14px;
    color: #606266;
    
    .text-muted {
      color: #909399;
    }
  }
}

.timeline-item-content {
  display: flex;
  align-items: center;
  
  .timeline-title {
    font-size: 14px;
    color: #303133;
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  
  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background: #e4e7ed;
      transform: translateY(-2px);
    }
    
    .action-icon {
      font-size: 32px;
      color: #ff6b9d;
      margin-bottom: 10px;
    }
    
    span {
      font-size: 14px;
      color: #303133;
    }
  }
}
</style>
