<template>
  <div class="entry-detail-page">
    <el-skeleton v-if="loading" animated />
    
    <template v-else-if="error">
      <div class="error-page">
        <el-icon class="error-icon"><WarningFilled /></el-icon>
        <h2>加载失败</h2>
        <p>{{ error }}</p>
        <el-button type="primary" @click="fetchDetail">重试</el-button>
        <el-button @click="router.back()">返回</el-button>
      </div>
    </template>
    
    <template v-else-if="!entry">
      <div class="error-page">
        <el-empty description="词条不存在" />
        <el-button type="primary" @click="router.push('/')">返回首页</el-button>
      </div>
    </template>
    
    <template v-else>
      <div class="container">
        <div class="entry-header">
          <el-button type="text" @click="router.back()">
            <el-icon><ArrowLeft /></el-icon> 返回
          </el-button>
          
          <div class="entry-path" v-if="entry.bar_name">
            <router-link :to="`/bar/${entry.bar_id}`">{{ entry.bar_name }}</router-link>
            <el-icon><ArrowRight /></el-icon>
            <span>{{ entry.title }}</span>
          </div>
        </div>

        <article class="entry-article">
          <header class="article-header">
            <h1>{{ entry.title }}</h1>
            <div class="article-meta">
              <span>类型: {{ entry.entry_type === 'text' ? '文字' : entry.entry_type }}</span>
              <span v-if="entry.created_at">创建于 {{ formatDate(entry.created_at) }}</span>
            </div>
          </header>

          <div v-if="entry.content" class="article-intro">
            {{ entry.content }}
          </div>

          <div class="contents-section">
            <h3>内容详情</h3>
            
            <div v-if="!contents || contents.length === 0" class="empty-contents">
              <el-empty description="暂无详细内容" />
            </div>
            
            <div v-else class="contents-list">
              <div
                v-for="(content, index) in contents"
                :key="content.id"
                class="content-item"
              >
                <template v-if="content.content_type === 'text'">
                  <div class="text-content">
                    <div class="content-index">{{ index + 1 }}</div>
                    <div class="content-text">{{ content.content_data }}</div>
                  </div>
                </template>
                
                <template v-else-if="content.content_type === 'image'">
                  <div class="image-content">
                    <div class="content-index">{{ index + 1 }}</div>
                    <el-image
                      :src="parseContentData(content.content_data)?.url || content.content_data"
                      fit="contain"
                      style="max-width: 100%; max-height: 400px"
                      preview-teleported
                    />
                  </div>
                </template>
                
                <template v-else-if="content.content_type === 'link'">
                  <div class="link-content">
                    <div class="content-index">{{ index + 1 }}</div>
                    <a
                      :href="parseContentData(content.content_data)?.url || content.content_data"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <el-icon><Link /></el-icon>
                      {{ parseContentData(content.content_data)?.title || parseContentData(content.content_data)?.url || content.content_data }}
                    </a>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { entryApi } from '@/api/entry'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const entry = ref(null)
const contents = ref([])

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const parseContentData = (data) => {
  if (!data) return null
  if (typeof data === 'object') return data
  try {
    return JSON.parse(data)
  } catch {
    return { url: data, title: data }
  }
}

const fetchDetail = async () => {
  const id = route.params.id
  if (!id) {
    error.value = '词条ID无效'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const res = await entryApi.getDetail(id)
    const data = res?.data || {}
    entry.value = data
    contents.value = data.contents || []
  } catch (err) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDetail()
})

watch(
  () => route.params.id,
  () => {
    fetchDetail()
  }
)
</script>

<style scoped>
.entry-detail-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24px 0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

.error-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.error-icon {
  font-size: 64px;
  color: #f56c6c;
}

.entry-header {
  background: #fff;
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 24px;
}

.entry-path {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: #909399;
  font-size: 14px;
}

.entry-path a {
  color: #409eff;
  text-decoration: none;
}

.entry-path a:hover {
  text-decoration: underline;
}

.entry-article {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
}

.article-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #ebeef5;
}

.article-header h1 {
  margin: 0 0 16px 0;
  font-size: 28px;
  color: #333;
}

.article-meta {
  display: flex;
  gap: 24px;
  color: #909399;
  font-size: 14px;
}

.article-intro {
  padding: 16px 24px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 32px;
  line-height: 1.8;
  color: #606266;
}

.contents-section h3 {
  margin: 0 0 24px 0;
  font-size: 18px;
  color: #333;
}

.empty-contents {
  padding: 40px 0;
}

.contents-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.text-content,
.image-content,
.link-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.content-index {
  width: 28px;
  height: 28px;
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;
}

.content-text {
  flex: 1;
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
}

.link-content a {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  text-decoration: none;
}

.link-content a:hover {
  text-decoration: underline;
}
</style>
