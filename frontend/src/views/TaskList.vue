<template>
  <div class="task-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>我的任务</h2>
          <el-tabs v-model="activeStatus" @tab-change="handleTabChange">
            <el-tab-pane label="全部" name="all" />
            <el-tab-pane label="待接单" name="pending" />
            <el-tab-pane label="进行中" name="active" />
            <el-tab-pane label="已完成" name="completed" />
            <el-tab-pane label="异常" name="exception" />
          </el-tabs>
        </div>
      </template>

      <el-table :data="filteredTasks" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="任务ID" width="80" />
        <el-table-column prop="item.name" label="物品" width="150" :show-overflow-tooltip="true" />
        <el-table-column prop="pickup_address" label="取货地址" :show-overflow-tooltip="true">
          <template #default="{ row }">
            {{ row.pickup_address || '未填写' }}
          </template>
        </el-table-column>
        <el-table-column prop="delivery_address" label="送货地址" :show-overflow-tooltip="true">
          <template #default="{ row }">
            {{ row.delivery_address || '未填写' }}
          </template>
        </el-table-column>
        <el-table-column prop="distance_km" label="距离" width="100">
          <template #default="{ row }">
            {{ row.distance_km ? row.distance_km + 'km' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="final_price" label="价格" width="100">
          <template #default="{ row }">
            <span style="color: #409eff; font-weight: 600">¥{{ row.final_price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <span :class="['status-badge', `status-${row.status}`]">
              {{ getStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.status === 'completed' && !row.reviewed" link type="success" @click="handleReview(row)">
              评价
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px"
      />
    </el-card>

    <el-dialog v-model="reviewDialogVisible" title="服务评价" width="500px">
      <el-form :model="reviewForm" :rules="reviewRules" ref="reviewFormRef" label-width="80px">
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { taskApi, reviewApi } from '@/api/modules'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const tasks = ref([])
const activeStatus = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const reviewDialogVisible = ref(false)
const reviewLoading = ref(false)
const reviewFormRef = ref()
const currentReviewTask = ref(null)

const reviewForm = reactive({
  rating: 5,
  comment: ''
})

const reviewRules = {
  rating: [
    { required: true, message: '请选择评分', trigger: 'change' }
  ]
}

const filteredTasks = computed(() => {
  if (activeStatus.value === 'all') {
    return tasks.value
  } else if (activeStatus.value === 'active') {
    return tasks.value.filter(t => ['accepted', 'picked_up', 'in_transit'].includes(t.status))
  } else {
    return tasks.value.filter(t => t.status === activeStatus.value)
  }
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

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadTasks = async () => {
  loading.value = true
  try {
    const res = await taskApi.list()
    if (res.success) {
      tasks.value = res.tasks.map(task => ({
        ...task,
        reviewed: false
      }))

      for (const task of tasks.value) {
        if (task.id) {
          try {
            const reviewRes = await reviewApi.byTask(task.id)
            if (reviewRes.success && reviewRes.reviews.length > 0) {
              task.reviewed = true
            }
          } catch (e) {
            console.error('检查评价失败:', e)
          }
        }
      }

      total.value = tasks.value.length
    }
  } catch (error) {
    console.error('加载任务失败:', error)
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  currentPage.value = 1
}

const handleView = (task) => {
  router.push(`/tasks/${task.id}`)
}

const handleReview = (task) => {
  currentReviewTask.value = task
  reviewForm.rating = 5
  reviewForm.comment = ''
  reviewDialogVisible.value = true
}

const handleSubmitReview = async () => {
  await reviewFormRef.value.validate(async (valid) => {
    if (valid) {
      reviewLoading.value = true
      try {
        const res = await reviewApi.create({
          task_id: currentReviewTask.value.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        })

        if (res.success) {
          ElMessage.success('评价成功')
          reviewDialogVisible.value = false
          loadTasks()
        }
      } catch (error) {
        console.error('提交评价失败:', error)
      } finally {
        reviewLoading.value = false
      }
    }
  })
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

import { reactive } from 'vue'

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.task-list-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0 0 20px;
  color: #303133;
}
</style>
