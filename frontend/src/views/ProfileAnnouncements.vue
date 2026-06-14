<template>
  <div class="profile-announcements-page">
    <div class="page-header">
      <h2 class="page-title">公告通知</h2>
      <div class="header-actions">
        <el-button @click="loadAnnouncements">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
    
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stat-item">
            <div class="stat-icon blue">
              <el-icon><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">全部公告</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon warning">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.unread }}</div>
              <div class="stat-label">未读</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon success">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.read }}</div>
              <div class="stat-label">已读</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="18">
        <el-card class="list-card" v-loading="loading">
          <div v-if="announcements.length === 0" class="empty-state">
            暂无公告
          </div>
          <div v-else class="announcement-list">
            <div
              v-for="item in announcements"
              :key="item.id"
              class="announcement-item"
              :class="{ unread: !item.is_read }"
              @click="handleRead(item)"
            >
              <div class="announcement-header">
                <div class="announcement-title">
                  <el-tag v-if="!item.is_read" type="danger" size="small" effect="dark">NEW</el-tag>
                  <el-tag :type="typeTag(item.type)" size="small">
                    {{ typeText(item.type) }}
                  </el-tag>
                  <span>{{ item.title }}</span>
                </div>
                <div class="announcement-time">{{ item.created_at }}</div>
              </div>
              <div class="announcement-content">{{ item.content }}</div>
              <div class="announcement-footer">
                <span>发布人：{{ item.publisher_name || '系统' }}</span>
                <span v-if="item.is_read" class="read-tag">
                  <el-icon><CircleCheck /></el-icon>
                  已读 {{ item.read_at }}
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-dialog v-model="detailDialogVisible" title="公告详情" width="600px">
      <div v-if="currentAnnouncement" class="detail-content">
        <div class="detail-header">
          <el-tag :type="typeTag(currentAnnouncement.type)" size="large">
            {{ typeText(currentAnnouncement.type) }}
          </el-tag>
          <h3>{{ currentAnnouncement.title }}</h3>
          <div class="detail-meta">
            <span>发布人：{{ currentAnnouncement.publisher_name || '系统' }}</span>
            <span>发布时间：{{ currentAnnouncement.created_at }}</span>
          </div>
        </div>
        <el-divider />
        <div class="detail-body">
          {{ currentAnnouncement.content }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '../store/user'
import { getAnnouncements, readAnnouncement } from '../api'

const userStore = useUserStore()

const loading = ref(false)
const announcements = ref([])
const detailDialogVisible = ref(false)
const currentAnnouncement = ref(null)

const stats = reactive({
  total: 0,
  unread: 0,
  read: 0
})

function typeTag(type) {
  const map = { notice: '', warning: 'danger', survey: 'info' }
  return map[type] || ''
}

function typeText(type) {
  const map = { notice: '通知', warning: '警示', survey: '调查' }
  return map[type] || '通知'
}

async function loadAnnouncements() {
  loading.value = true
  try {
    const res = await getAnnouncements({ user_id: userStore.userId })
    announcements.value = res.data
    
    stats.total = res.data.length
    stats.unread = res.data.filter(a => !a.is_read).length
    stats.read = res.data.filter(a => a.is_read).length
  } finally {
    loading.value = false
  }
}

async function handleRead(item) {
  currentAnnouncement.value = item
  detailDialogVisible.value = true
  
  if (!item.is_read) {
    try {
      await readAnnouncement(item.id, { user_id: userStore.userId })
      item.is_read = true
      stats.unread--
      stats.read++
    } catch {}
  }
}

onMounted(() => {
  loadAnnouncements()
})
</script>

<style scoped>
.profile-announcements-page {
  padding: 0;
}

.stats-card, .list-card {
  border: none;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
}

.stat-icon.blue { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-icon.warning { background: linear-gradient(135deg, #f093fb, #f5576c); }
.stat-icon.success { background: linear-gradient(135deg, #11998e, #38ef7d); }

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.announcement-item {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.announcement-item.unread {
  border-left: 4px solid #f56c6c;
  background: #fff9f9;
}

.announcement-item:hover {
  border-color: #409eff;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.announcement-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 500;
}

.announcement-time {
  font-size: 12px;
  color: #909399;
}

.announcement-content {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 10px;
}

.announcement-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.read-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #67c23a;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #909399;
}

.detail-header {
  text-align: center;
}

.detail-header h3 {
  margin: 15px 0 10px;
  font-size: 20px;
}

.detail-meta {
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 13px;
  color: #909399;
}

.detail-body {
  line-height: 1.8;
  color: #606266;
  padding: 20px 0;
}
</style>
