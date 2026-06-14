<template>
  <div class="task-detail-container">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <h2>任务详情 #{{ task.id }}</h2>
          <span :class="['status-badge', `status-${task.status}`]">
            {{ getStatusText(task.status) }}
          </span>
        </div>
      </template>

      <el-descriptions :column="2" border v-if="task.id">
        <el-descriptions-item label="物品名称">{{ task.item?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="物品类别">{{ task.item?.category || '-' }}</el-descriptions-item>
        <el-descriptions-item label="安全等级">
          <span v-if="task.item?.safety_level_id">
            {{ getSafetyLevelText(task.item.safety_level_id) }}
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="物品特征码">{{ task.item?.feature_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="取货地址" :span="2">{{ task.pickup_address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="送货地址" :span="2">{{ task.delivery_address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预估距离">{{ task.distance_km ? task.distance_km + 'km' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="SLA时限">{{ task.sla_minutes ? task.sla_minutes + '分钟' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="基础费用">¥{{ task.base_price || 0 }}</el-descriptions-item>
        <el-descriptions-item label="动态价格">¥{{ task.dynamic_price || 0 }}</el-descriptions-item>
        <el-descriptions-item label="最终价格" :span="2">
          <span style="color: #409eff; font-size: 20px; font-weight: 600">¥{{ task.final_price || 0 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="取货时间">{{ task.pickup_time ? formatDate(task.pickup_time) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="最晚送达">{{ task.delivery_deadline ? formatDate(task.delivery_deadline) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDate(task.created_at) }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-row :gutter="20">
        <el-col :span="12">
          <h4>保险信息</h4>
          <el-descriptions :column="1" border size="small" v-if="task.insurance">
            <el-descriptions-item label="保单号">{{ task.insurance.policy_number }}</el-descriptions-item>
            <el-descriptions-item label="保险类型">{{ task.insurance.coverage_type }}</el-descriptions-item>
            <el-descriptions-item label="保费">¥{{ task.insurance.premium }}</el-descriptions-item>
            <el-descriptions-item label="保额">¥{{ task.insurance.coverage_amount }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="task.insurance.status === 'active' ? 'success' : 'info'" size="small">
                {{ task.insurance.status === 'active' ? '生效中' : task.insurance.status }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂无保险信息" />
        </el-col>

        <el-col :span="12">
          <h4>接单人信息</h4>
          <el-descriptions :column="1" border size="small" v-if="task.courier">
            <el-descriptions-item label="姓名">{{ task.courier.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ task.courier.phone }}</el-descriptions-item>
            <el-descriptions-item label="信用评分">{{ task.courier.credit_score }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂无接单人" />
        </el-col>
      </el-row>

      <el-divider />

      <h4>任务轨迹</h4>
      <el-timeline v-if="task.history && task.history.length > 0">
        <el-timeline-item
          v-for="(history, index) in task.history"
          :key="index"
          :timestamp="formatDate(history.created_at)"
          :color="getTimelineColor(history.status)"
        >
          <p><strong>{{ getStatusText(history.status) }}</strong></p>
          <p v-if="history.note">{{ history.note }}</p>
          <p v-if="history.gps_location" class="gps-info">
            <el-icon><Location /></el-icon> {{ history.gps_location }}
          </p>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无轨迹信息" />

      <el-divider />

      <div class="action-buttons">
        <el-button v-if="task.status === 'pending' && userStore.isClient" type="danger" @click="handleCancel">
          取消任务
        </el-button>
        <el-button v-if="task.status === 'completed' && !task.reviewed" type="success" @click="handleReview">
          评价服务
        </el-button>
        <el-button v-if="task.status === 'exception'" type="warning" @click="handleException">
          查看异常
        </el-button>
      </div>
    </el-card>

    <el-dialog v-model="reviewDialogVisible" title="服务评价" width="500px">
      <el-form :model="reviewForm" ref="reviewFormRef" label-width="80px">
        <el-form-item label="评分" prop="rating">
          <el-rate v-model="reviewForm.rating" show-text :texts="['很差', '较差', '一般', '满意', '非常满意']" />
        </el-form-item>
        <el-form-item label="评价内容" prop="comment">
          <el-input v-model="reviewForm.comment" type="textarea" :rows="4" placeholder="请输入您的评价" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitReview" :loading="reviewLoading">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { taskApi, reviewApi } from '@/api/modules'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const task = ref({})
const reviewDialogVisible = ref(false)
const reviewLoading = ref(false)
const reviewFormRef = ref()
const reviewForm = reactive({
  rating: 5,
  comment: ''
})

const getStatusText = (status) => {
  const statusMap = {
    pending: '待接单',
    accepted: '已接单',
    picked_up: '已取货',
    in_transit: '配送中',
    completed: '已完成',
    exception: '异常',
    cancelled: '已取消',
    failed: '失败'
  }
  return statusMap[status] || status
}

const getSafetyLevelText = (id) => {
  const map = {
    1: '活体',
    2: '易碎',
    3: '时效敏感',
    4: '普通'
  }
  return map[id] || '未知'
}

const getTimelineColor = (status) => {
  const colorMap = {
    pending: '#909399',
    accepted: '#409eff',
    picked_up: '#1989fa',
    in_transit: '#1989fa',
    completed: '#67c23a',
    exception: '#f56c6c',
    cancelled: '#f56c6c',
    failed: '#f56c6c'
  }
  return colorMap[status] || '#909399'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadTask = async () => {
  loading.value = true
  try {
    const res = await taskApi.detail(route.params.id)
    if (res.success) {
      task.value = res.task
    }
  } catch (error) {
    console.error('加载任务详情失败:', error)
  } finally {
    loading.value = false
  }
}

const handleCancel = async () => {
  try {
    await taskApi.updateStatus(task.value.id, { status: 'cancelled', note: '委托人取消任务' })
    ElMessage.success('任务已取消')
    loadTask()
  } catch (error) {
    console.error('取消任务失败:', error)
  }
}

const handleReview = () => {
  reviewForm.rating = 5
  reviewForm.comment = ''
  reviewDialogVisible.value = true
}

const handleSubmitReview = async () => {
  reviewLoading.value = true
  try {
    const res = await reviewApi.create({
      task_id: task.value.id,
      rating: reviewForm.rating,
      comment: reviewForm.comment
    })

    if (res.success) {
      ElMessage.success('评价成功')
      reviewDialogVisible.value = false
      loadTask()
    }
  } catch (error) {
    console.error('提交评价失败:', error)
  } finally {
    reviewLoading.value = false
  }
}

const handleException = () => {
  ElMessage.info('异常工单详情')
}

onMounted(() => {
  loadTask()
})
</script>

<style scoped>
.task-detail-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  color: #303133;
}

.gps-info {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}
</style>
