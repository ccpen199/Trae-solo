<template>
  <div class="messages-list">
    <el-card>
      <template #header>
        <div class="card-toolbar">
          <span class="card-title">待办消息</span>
          <div class="toolbar-actions">
            <el-radio-group v-model="filterType" size="small" @change="handleFilterChange">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="unread">未读</el-radio-button>
              <el-radio-button value="read">已读</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-table :data="messages" stripe v-loading="loading">
        <el-table-column width="60" align="center">
          <template #default="{ row }">
            <el-badge v-if="!row.isRead" is-dot class="unread-dot" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="消息标题" min-width="200">
          <template #default="{ row }">
            <span :class="{ 'unread-text': !row.isRead }">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="消息内容" min-width="300">
          <template #default="{ row }">
            <span :class="{ 'unread-text': !row.isRead }">{{ row.content }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="消息类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getMessageType(row.type)">
              {{ getMessageLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="relatedNo" label="关联单号" width="160">
          <template #default="{ row }">
            <span v-if="row.relatedNo">{{ row.relatedNo }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.isRead"
              type="primary"
              link
              @click="handleMarkRead(row)"
            >
              标记已读
            </el-button>
            <el-button
              v-if="row.relatedNo && row.relatedType === 'BOOKING'"
              type="primary"
              link
              @click="goToRelated(row.relatedId)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { messageApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()

const loading = ref(false)
const messages = ref([])
const filterType = ref('all')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const messageTypes = {
  info: { label: '系统通知', type: 'info' },
  warning: { label: '警告提醒', type: 'warning' },
  error: { label: '异常通知', type: 'danger' },
  success: { label: '成功通知', type: 'success' },
}

const getMessageLabel = (type) => messageTypes[type]?.label || type || '通知'
const getMessageType = (type) => messageTypes[type]?.type || 'info'

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const goToRelated = (id) => {
  router.push(`/bookings/${id}`)
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (filterType.value === 'unread') {
      params.unread = true
    } else if (filterType.value === 'read') {
      params.read = true
    }

    const result = await messageApi.getList(params)
    if (result.success) {
      messages.value = result.data?.list || []
      pagination.total = result.data?.total || 0
    }
  } catch (error) {
    console.error('Fetch messages error:', error)
    ElMessage.error('获取消息列表失败')
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  pagination.page = 1
  fetchData()
}

const handleMarkRead = async (row) => {
  try {
    const result = await messageApi.markRead(row.id)
    if (result.success) {
      ElMessage.success('已标记为已读')
      row.isRead = true
    }
  } catch (error) {
    console.error('Mark read error:', error)
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.messages-list {
  padding: 0;
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.unread-dot {
  vertical-align: middle;
}

.unread-text {
  font-weight: 600;
  color: #303133;
}

.text-muted {
  color: #909399;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
