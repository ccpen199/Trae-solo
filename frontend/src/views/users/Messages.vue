<template>
  <div class="messages-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>待办消息</span>
          <el-select v-model="filterStatus" placeholder="消息状态" clearable @change="fetchMessages">
            <el-option label="全部" value="" />
            <el-option label="未读" value="unread" />
            <el-option label="已读" value="read" />
            <el-option label="已处理" value="handled" />
          </el-select>
        </div>
      </template>
      
      <el-table :data="messages" style="width: 100%" v-loading="loading">
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'unread'" type="danger">未读</el-tag>
            <el-tag v-else-if="row.status === 'read'" type="warning">已读</el-tag>
            <el-tag v-else type="success">已处理</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="message_type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ messageTypeMap[row.message_type] || row.message_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order_no" label="关联订单" width="200">
          <template #default="{ row }">
            <el-link 
              v-if="row.order_no" 
              type="primary" 
              @click="goToOrder(row.order_id)"
            >
              {{ row.order_no }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'unread'"
              type="primary" 
              link 
              @click="handleRead(row.id)"
            >
              标记已读
            </el-button>
            <el-button 
              v-if="row.order_id && (row.status === 'unread' || row.status === 'read')"
              type="success" 
              link 
              @click="goToOrder(row.order_id)"
            >
              查看订单
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as api from '@/api'

const router = useRouter()

const messages = ref([])
const loading = ref(false)
const filterStatus = ref(null)

const messageTypeMap = {
  todo: '待办',
  notification: '通知',
  warning: '警告',
  error: '错误'
}

const goToOrder = (orderId) => {
  router.push(`/orders/${orderId}`)
}

const handleRead = async (messageId) => {
  try {
    await api.markMessageRead(messageId)
    ElMessage.success('已标记为已读')
    fetchMessages()
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

const fetchMessages = async () => {
  loading.value = true
  try {
    messages.value = await api.getMessages(filterStatus.value)
  } catch (error) {
    console.error('获取消息失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMessages()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
