<template>
  <el-card>
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span>待办事项</span>
        <el-button type="primary" link @click="readAll">全部标记已读</el-button>
      </div>
    </template>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="未读" name="unread">
        <el-table :data="unreadMessages" v-loading="loading" stripe @row-click="goToDocument">
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getMessageType(row.message_type)">{{ getMessageTypeLabel(row.message_type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="消息内容" min-width="200" />
          <el-table-column prop="document_title" label="文档标题" min-width="200" />
          <el-table-column prop="document_status" label="文档状态" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ getStatusLabel(row.document_status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click.stop="markRead(row)">标记已读</el-button>
              <el-button type="primary" link size="small" @click.stop="goToDocument(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!loading && unreadMessages.length === 0" description="暂无未读消息" />
      </el-tab-pane>

      <el-tab-pane label="全部" name="all">
        <el-table :data="allMessages" v-loading="loading" stripe @row-click="goToDocument">
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.is_read" type="info" size="small">已读</el-tag>
              <el-tag v-else type="warning" size="small">未读</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getMessageType(row.message_type)">{{ getMessageTypeLabel(row.message_type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="消息内容" min-width="200" />
          <el-table-column prop="document_title" label="文档标题" min-width="150" />
          <el-table-column prop="created_at" label="时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click.stop="goToDocument(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { todoApi } from '@/api'

const router = useRouter()
const loading = ref(false)
const activeTab = ref('unread')
const unreadMessages = ref([])
const allMessages = ref([])

const getMessageType = (type) => {
  const types = {
    review: 'warning',
    approval: 'success',
    rejection: 'danger',
    update: 'primary'
  }
  return types[type] || ''
}

const getMessageTypeLabel = (type) => {
  const labels = {
    review: '待审核',
    approval: '审核通过',
    rejection: '审核驳回',
    update: '更新通知'
  }
  return labels[type] || type
}

const getStatusLabel = (status) => {
  const labels = {
    pending_creation: '待创建',
    pending_review: '待审核',
    published: '已发布',
    pending_use: '待使用',
    pending_update: '待更新'
  }
  return labels[status] || status
}

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : '-'
}

const loadMessages = async () => {
  loading.value = true
  try {
    const res = await todoApi.list()
    allMessages.value = res.data.messages || []
    unreadMessages.value = allMessages.value.filter(m => !m.is_read)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const markRead = async (row) => {
  try {
    await todoApi.markRead(row.id)
    ElMessage.success('已标记为已读')
    loadMessages()
  } catch (e) {
    console.error(e)
  }
}

const readAll = async () => {
  try {
    await todoApi.readAll()
    ElMessage.success('全部已标记为已读')
    loadMessages()
  } catch (e) {
    console.error(e)
  }
}

const goToDocument = (row) => {
  if (row.document_id) {
    router.push(`/documents/${row.document_id}`)
  }
}

onMounted(() => {
  loadMessages()
})
</script>
