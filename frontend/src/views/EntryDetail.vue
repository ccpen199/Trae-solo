<template>
  <div class="detail-page" v-loading="loading">
    <el-card v-if="entry">
      <template #header>
        <div class="card-header">
          <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
          <h2>{{ entry.title || '无标题' }}</h2>
          <div class="header-actions">
            <el-tag :type="entry.is_private ? 'warning' : 'success'">{{ entry.is_private ? '私密' : '公开' }}</el-tag>
            <el-tag>v{{ entry.version }}</el-tag>
          </div>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="ID">{{ entry.id }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ getTypeName(entry.entry_type) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(entry.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="修改时间">{{ formatDate(entry.last_modified_at) }}</el-descriptions-item>
        <el-descriptions-item label="标签" :span="2">
          <el-tag v-for="tag in entry.tags" :key="tag.id" :color="tag.color" class="mr-1">{{ tag.name }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="来源链接" v-if="entry.source_url" :span="2">
          <a :href="entry.source_url" target="_blank">{{ entry.source_url }}</a>
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">内容</el-divider>
      <div class="content" v-if="entry.html_content" v-html="entry.html_content"></div>
      <div class="content" v-else>{{ entry.content }}</div>

      <el-divider content-position="left" v-if="entry.sources && entry.sources.length > 0">来源</el-divider>
      <div v-if="entry.sources && entry.sources.length > 0">
        <div v-for="src in entry.sources" :key="src.id" class="source-item">
          <a :href="src.url" target="_blank">{{ src.title || src.url }}</a>
          <p v-if="src.note">{{ src.note }}</p>
        </div>
      </div>

      <el-divider content-position="left" v-if="relatedEntries.length > 0">双向关联</el-divider>
      <div v-if="relatedEntries.length > 0" class="related-entries">
        <div v-for="rel in relatedEntries" :key="rel.id" class="related-item" @click="viewEntry(rel.id)">
          <el-icon><Link /></el-icon>
          <span>{{ rel.title || '无标题' }}</span>
          <el-tag size="small" :type="getTypeTagType(rel.entry_type)">{{ getTypeName(rel.entry_type) }}</el-tag>
        </div>
      </div>

      <el-divider content-position="left">版本历史</el-divider>
      <el-timeline>
        <el-timeline-item
          v-for="ver in versions"
          :key="ver.id"
          :timestamp="formatDate(ver.synced_at)"
          placement="top"
        >
          <el-card shadow="hover">
            <h4>版本 {{ ver.version }}</h4>
            <p v-if="ver.snapshot.title">标题: {{ ver.snapshot.title }}</p>
            <p v-if="ver.snapshot.content">内容预览: {{ truncate(ver.snapshot.content, 100) }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <el-divider content-position="left">操作</el-divider>
      <div class="actions">
        <el-button type="primary" @click="syncNow">立即同步</el-button>
        <el-button @click="createShare">生成分享链接</el-button>
        <el-button type="success" @click="createReview">设置复习提醒</el-button>
        <el-button type="warning" @click="viewRelated">查看关联网络</el-button>
      </div>
    </el-card>

    <el-dialog v-model="showShareDialog" title="创建分享" width="500px">
      <el-form :model="shareForm" label-width="80px">
        <el-form-item label="权限">
          <el-select v-model="shareForm.permission">
            <el-option label="只读" value="read" />
            <el-option label="可评论" value="comment" />
            <el-option label="可编辑" value="edit" />
          </el-select>
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker v-model="shareForm.expires_at" type="datetime" placeholder="选择过期时间" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showShareDialog = false">取消</el-button>
        <el-button type="primary" @click="submitShare">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReviewDialog" title="设置复习提醒" width="500px">
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="复习时间">
          <el-date-picker v-model="reviewForm.scheduled_for" type="datetime" placeholder="选择复习时间" />
        </el-form-item>
        <el-form-item label="间隔天数">
          <el-input-number v-model="reviewForm.interval_days" :min="1" :max="365" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReviewDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReview">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Link } from '@element-plus/icons-vue'
import { getEntry, getRelatedEntries, getEntryVersions, createShare, createReview, syncData } from '@/api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const entry = ref(null)
const relatedEntries = ref([])
const versions = ref([])
const showShareDialog = ref(false)
const showReviewDialog = ref(false)
const shareForm = ref({ entry_id: 0, permission: 'read', expires_at: null })
const reviewForm = ref({ entry_id: 0, scheduled_for: null, interval_days: 1 })

function getTypeName(type) {
  const map = { note: '笔记', web_clipping: '网页剪藏', handwritten: '手写摘录', file: '文件' }
  return map[type] || type
}

function getTypeTagType(type) {
  const map = { note: '', web_clipping: 'primary', handwritten: 'success', file: 'info' }
  return map[type] || ''
}

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

function truncate(str, len) {
  if (!str) return ''
  return str.length > len ? str.substring(0, len) + '...' : str
}

function goBack() {
  router.back()
}

function viewEntry(id) {
  router.push(`/entries/${id}`)
}

async function loadEntry() {
  loading.value = true
  try {
    const id = parseInt(route.params.id)
    entry.value = await getEntry(id)
    shareForm.value.entry_id = id
    reviewForm.value.entry_id = id
    await loadRelated(id)
    await loadVersions(id)
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function loadRelated(id) {
  try {
    relatedEntries.value = await getRelatedEntries(id)
  } catch (e) {
    console.error('Load related failed:', e)
  }
}

async function loadVersions(id) {
  try {
    versions.value = await getEntryVersions(id)
  } catch (e) {
    console.error('Load versions failed:', e)
  }
}

function createShare() {
  showShareDialog.value = true
}

async function submitShare() {
  try {
    const share = await createShare(shareForm.value)
    ElMessage.success('分享创建成功')
    showShareDialog.value = false
    const link = `${window.location.origin}/#/share/${share.share_token}`
    ElMessage.success(`分享链接: ${link}`)
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

function createReview() {
  showReviewDialog.value = true
}

async function submitReview() {
  try {
    await createReview(reviewForm.value)
    ElMessage.success('复习提醒创建成功')
    showReviewDialog.value = false
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

async function syncNow() {
  try {
    const result = await syncData({
      device_fingerprint: 'web-browser-' + Date.now(),
      device_name: navigator.userAgent.substring(0, 50),
      entries: []
    })
    ElMessage.success(`同步完成: ${result.status}`)
  } catch (e) {
    ElMessage.error('同步失败')
  }
}

function viewRelated() {
  ElMessage.info('关联网络视图开发中...')
}

onMounted(() => {
  loadEntry()
})
</script>

<style scoped>
.detail-page {
  max-width: 900px;
  margin: 0 auto;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 15px;
}
.card-header h2 {
  flex: 1;
  margin: 0;
}
.header-actions {
  display: flex;
  gap: 10px;
}
.content {
  min-height: 200px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  line-height: 1.8;
  white-space: pre-wrap;
}
.source-item {
  padding: 10px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 10px;
}
.source-item p {
  margin: 5px 0 0 0;
  color: #666;
}
.related-entries {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.related-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: #ecf5ff;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.2s;
}
.related-item:hover {
  background: #d9ecff;
}
.actions {
  display: flex;
  gap: 10px;
}
.mr-1 {
  margin-right: 4px;
}
</style>
