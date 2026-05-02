<template>
  <div class="kanban-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>流程看板</span>
          <el-button type="primary" @click="fetchData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <div class="kanban-container">
        <div 
          v-for="(column, status) in kanbanData" 
          :key="status" 
          class="kanban-column"
        >
          <div class="column-header">
            <span class="column-title">{{ column.status_text }}</span>
            <el-badge :value="column.count" :type="getColumnBadgeType(status)" />
          </div>
          
          <div class="column-content">
            <el-empty v-if="column.items.length === 0" description="暂无数据" :image-size="60" />
            
            <div 
              v-for="item in column.items" :key="item.id" class="kanban-card" @click="viewDetail(item.id)">
              <div class="card-title">{{ item.title }}</div>
              <div class="card-meta">
                <el-tag size="small">{{ item.order_no }}</el-tag>
              </div>
              <div class="card-footer">
                <span class="card-assignee">{{ item.assignee_name || '未分配' }}</span>
                <span class="card-time">{{ formatTime(item.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getKanbanData } from '@/utils/api'
import { Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()

const kanbanData = ref({})

const columnOrder = ['pending_code', 'pending_trigger', 'pending_build', 'pending_deploy', 'pending_monitor']

const formatTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm')
}

const getColumnBadgeType = (status) => {
  const map = {
    pending_code: 'primary',
    pending_trigger: 'warning',
    pending_build: 'success',
    pending_deploy: 'danger',
    pending_monitor: 'info'
  }
  return map[status] || 'info'
}

const viewDetail = (id) => {
  router.push(`/orders/${id}`)
}

const fetchData = async () => {
  try {
    const res = await getKanbanData()
    if (res.success) {
      kanbanData.value = res.data
    }
  } catch (e) {
    console.error('获取看板数据失败', e)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.kanban-page {
  min-height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kanban-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 20px;
}

.kanban-column {
  min-width: 260px;
  max-width: 300px;
  flex: 1;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e4e7ed;
}

.column-title {
  font-weight: bold;
  font-size: 15px;
  color: #333;
}

.column-content {
  min-height: 200px;
}

.kanban-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.kanban-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  margin-bottom: 8px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.card-assignee {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-time {
  flex-shrink: 0;
}
</style>
