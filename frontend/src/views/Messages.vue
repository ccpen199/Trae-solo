<template>
  <div class="messages-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>消息中心</span>
          <div class="header-actions">
            <el-select v-model="filterStatus" placeholder="筛选状态" clearable style="width: 120px" @change="fetchMessages">
              <el-option label="未读" value="unread" />
              <el-option label="已读" value="read" />
            </el-select>
            <el-button type="primary" @click="markAllAsRead" :disabled="!hasUnread">
              全部标记已读
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="messages" v-loading="loading" style="width: 100%" stripe @row-click="handleRowClick">
        <el-table-column width="50" align="center">
          <template #default="scope">
            <el-icon :size="18" :color="scope.row.status === 'unread' ? '#409EFF' : '#C0C4CC'">
              <component :is="getMessageIcon(scope.row.type)" />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="scope">
            <span :class="{ 'unread-text': scope.row.status === 'unread' }">{{ scope.row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip>
          <template #default="scope">
            <span :class="{ 'unread-text': scope.row.status === 'unread' }">{{ scope.row.content }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="getTypeTag(scope.row.type)" size="small">
              {{ getTypeLabel(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button 
              v-if="scope.row.status === 'unread'" 
              type="primary" 
              link 
              @click.stop="markAsRead(scope.row)"
            >
              标记已读
            </el-button>
            <el-button 
              v-if="scope.row.session_id" 
              type="primary" 
              link 
              @click.stop="goToSession(scope.row.session_id)"
            >
              查看会话
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchMessages"
          @current-change="fetchMessages"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { messagesApi } from '@/api'
import { Bell, WarningFilled, InfoFilled, SuccessFilled } from '@element-plus/icons-vue'

const router = useRouter()

const loading = ref(false)
const messages = ref([])
const filterStatus = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const hasUnread = computed(() => {
  return messages.value.some(m => m.status === 'unread')
})

const getMessageIcon = (type) => {
  const iconMap = {
    'system': Bell,
    'warning': WarningFilled,
    'info': InfoFilled,
    'success': SuccessFilled
  }
  return iconMap[type] || Bell
}

const getTypeLabel = (type) => {
  const labelMap = {
    'system': '系统',
    'warning': '警告',
    'info': '信息',
    'success': '成功'
  }
  return labelMap[type] || type
}

const getTypeTag = (type) => {
  const tagMap = {
    'system': 'primary',
    'warning': 'warning',
    'info': 'info',
    'success': 'success'
  }
  return tagMap[type] || 'info'
}

const fetchMessages = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    
    const res = await messagesApi.getList(params)
    messages.value = res.messages
    pagination.total = res.pagination.total
  } catch (error) {
    console.error('获取消息列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleRowClick = (row) => {
  if (row.status === 'unread') {
    markAsRead(row)
  }
}

const markAsRead = async (row) => {
  try {
    await messagesApi.markAsRead(row.id)
    row.status = 'read'
    ElMessage.success('已标记为已读')
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

const markAllAsRead = async () => {
  try {
    await messagesApi.markAllAsRead()
    messages.value.forEach(m => m.status = 'read')
    ElMessage.success('已全部标记为已读')
  } catch (error) {
    console.error('批量标记已读失败:', error)
  }
}

const goToSession = (sessionId) => {
  router.push(`/sessions/${sessionId}`)
}

onMounted(() => {
  fetchMessages()
})
</script>

<style scoped>
.messages-container {
  min-height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.unread-text {
  font-weight: bold;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
