<template>
  <div class="topic-detail" v-loading="loading">
    <el-page-header @back="goBack" :content="topic?.name || '话题详情'" class="page-header" />

    <el-row :gutter="16" class="content-row">
      <el-col :span="18">
        <el-card class="info-card" shadow="never">
          <div class="topic-header">
            <div class="topic-cover" v-if="topic?.cover_url">
              <img :src="topic.cover_url" :alt="topic.name" />
            </div>
            <div class="topic-placeholder" v-else>
              <el-icon size="48" color="#909399"><Picture /></el-icon>
            </div>
            <div class="topic-main">
              <div class="topic-title">
                <h2>{{ topic?.name }}</h2>
                <el-tag v-if="topic?.is_pinned" type="warning" effect="dark" size="small">置顶</el-tag>
                <el-tag :type="topic?.status ? 'success' : 'info'" size="small">
                  {{ topic?.status ? '启用' : '停用' }}
                </el-tag>
              </div>
              <div class="topic-aliases" v-if="parseAliases(topic?.aliases).length">
                <span class="label">别名：</span>
                <el-tag v-for="a in parseAliases(topic?.aliases)" :key="a" size="small" type="info">{{ a }}</el-tag>
              </div>
              <div class="topic-desc">{{ topic?.description || '暂无简介' }}</div>
              <div class="topic-meta">
                <span>分类：{{ topic?.category || '-' }}</span>
                <span>创建人：{{ topic?.creator_name || '-' }}</span>
                <span>管理人：{{ topic?.manager_name || '-' }}</span>
              </div>
            </div>
            <div class="topic-stats">
              <div class="stat-item">
                <div class="stat-num">{{ topic?.post_count || 0 }}</div>
                <div class="stat-label">内容数</div>
              </div>
              <div class="stat-item">
                <div class="stat-num">{{ topic?.view_count || 0 }}</div>
                <div class="stat-label">浏览量</div>
              </div>
              <div class="stat-item">
                <div class="stat-num heat">{{ topic?.heat_score?.toFixed(1) }}</div>
                <div class="stat-label">热度</div>
              </div>
            </div>
          </div>
          <div class="topic-config" v-if="topic?.recommendation_reason || topic?.activity_entry">
            <div v-if="topic?.recommendation_reason">
              <span class="config-label">推荐理由：</span>{{ topic.recommendation_reason }}
            </div>
            <div v-if="topic?.activity_entry">
              <span class="config-label">活动入口：</span>
              <el-link :href="topic.activity_entry" target="_blank">{{ topic.activity_entry }}</el-link>
            </div>
          </div>
        </el-card>

        <el-card class="chart-card" shadow="never">
          <template #header>话题趋势（近7天）</template>
          <div ref="trendRef" class="trend-chart"></div>
        </el-card>

        <el-card class="posts-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>关联内容</span>
              <el-tag type="info">{{ posts.length }} 条</el-tag>
              <el-tag v-if="posts.some(p => p.tag_source === 'auto')" type="warning" size="small">含自动标记</el-tag>
            </div>
          </template>
          <div class="post-list">
            <div v-for="post in posts" :key="post.id" class="post-item">
              <div class="post-row">
                <div class="post-main" @click="$router.push(`/posts/${post.id}`)">
                  <div class="post-title">{{ post.title }}</div>
                  <div class="post-excerpt">{{ post.content }}</div>
                  <div class="post-meta">
                    <span>{{ post.author_name }}</span>
                    <span><el-icon><View /></el-icon> {{ post.view_count }}</span>
                    <span><el-icon><GoodFilled /></el-icon> {{ post.like_count }}</span>
                    <span><el-icon><ChatDotRound /></el-icon> {{ post.comment_count }}</span>
                  </div>
                </div>
                <div class="post-actions">
                  <el-tag v-if="post.tag_source === 'auto'" size="small" type="warning" effect="dark">
                    <el-icon><MagicStick /></el-icon> 自动标记
                  </el-tag>
                  <el-tag v-else size="small" type="success" effect="dark">
                    <el-icon><User /></el-icon> 人工标记
                  </el-tag>
                  <el-button size="small" type="danger" link @click.stop="reportMisclassification(post)">
                    <el-icon><Warning /></el-icon> 举报错配
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="side-card" shadow="never">
          <template #header>快速操作</template>
          <el-button type="primary" style="width: 100%; margin-bottom: 10px" @click="goBackToList">
            返回列表
          </el-button>
          <el-button type="success" style="width: 100%" @click="showTagPost = true">
            给内容打标
          </el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showTagPost" title="选择内容打标" width="700px" destroy-on-close>
      <el-input v-model="postSearch" placeholder="搜索内容标题" clearable style="margin-bottom: 16px" @input="searchPosts" />
      <el-table :data="searchResults" height="300" @selection-change="handleSelection">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="author_name" label="作者" width="100" />
      </el-table>
      <template #footer>
        <el-button @click="showTagPost = false">取消</el-button>
        <el-button type="primary" @click="confirmTagPosts">确认打标</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import { topicsApi, postsApi, moderationApi } from '../api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const topic = ref(null)
const posts = ref([])
const trendRef = ref(null)
const showTagPost = ref(false)
const postSearch = ref('')
const searchResults = ref([])
const selectedPosts = ref([])

const parseAliases = (aliases) => {
  try {
    return JSON.parse(aliases || '[]')
  } catch {
    return []
  }
}

const loadTopic = async () => {
  loading.value = true
  try {
    const res = await topicsApi.detail(route.params.id)
    topic.value = res
    posts.value = res.posts || []
    await nextTick()
    renderTrendChart()
  } finally {
    loading.value = false
  }
}

const renderTrendChart = () => {
  if (!trendRef.value || !topic.value?.trend) return
  const chart = echarts.init(trendRef.value)
  const trend = topic.value.trend || []
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增内容', '总点赞'] },
    xAxis: { type: 'category', data: trend.map(t => t.date).reverse() },
    yAxis: { type: 'value' },
    series: [
      {
        name: '新增内容',
        type: 'bar',
        data: trend.map(t => t.post_count).reverse(),
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '总点赞',
        type: 'line',
        smooth: true,
        data: trend.map(t => t.total_likes).reverse(),
        itemStyle: { color: '#67C23A' }
      }
    ]
  })
}

const searchPosts = async () => {
  if (!postSearch.value.trim()) {
    searchResults.value = []
    return
  }
  try {
    const res = await postsApi.list({ keyword: postSearch.value, pageSize: 20 })
    searchResults.value = res.list
  } catch (e) {}
}

const handleSelection = (val) => {
  selectedPosts.value = val
}

const confirmTagPosts = async () => {
  if (selectedPosts.value.length === 0) {
    ElMessage.warning('请选择要打标的内容')
    return
  }
  try {
    await Promise.all(selectedPosts.value.map(p => 
      postsApi.batchTags(p.id, {
        add_topic_ids: [route.params.id],
        operator_name: '管理员'
      })
    ))
    ElMessage.success(`已为 ${selectedPosts.value.length} 条内容打标`)
    showTagPost.value = false
    loadTopic()
  } catch (e) {}
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/topics')
  }
}

const goBackToList = () => {
  const query = {}
  if (topic.value?.name) {
    query.keyword = topic.value.name
  }
  router.push({ path: '/topics', query })
}

const reportMisclassification = async (post) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(`请输入举报「${post.title}」与话题「${topic.value.name}」错配的原因`, '举报标签错配', {
      confirmButtonText: '提交',
      cancelButtonText: '取消',
      inputPlaceholder: '请描述错误归类情况...',
      inputValidator: (val) => !!val || '请输入举报原因'
    })
    await moderationApi.create({
      post_id: post.id,
      topic_id: route.params.id,
      type: 'misclassification',
      reason: reason,
      operator_name: '管理员'
    })
    ElMessage.success('举报已提交，将进入审核队列')
  } catch (e) {}
}

onMounted(() => {
  loadTopic()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}
.content-row {
  display: flex;
}
.info-card {
  margin-bottom: 16px;
}
.topic-header {
  display: flex;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}
.topic-cover, .topic-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.topic-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.topic-main {
  flex: 1;
  min-width: 0;
}
.topic-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.topic-title h2 {
  margin: 0;
  font-size: 22px;
  color: #303133;
}
.topic-aliases {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.topic-aliases .label {
  color: #909399;
  font-size: 13px;
}
.topic-desc {
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.6;
}
.topic-meta {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 13px;
}
.topic-stats {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}
.topic-stats .stat-item {
  text-align: center;
}
.topic-stats .stat-num {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}
.topic-stats .stat-num.heat {
  color: #F56C6C;
}
.topic-stats .stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.topic-config {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #ebeef5;
  color: #606266;
  line-height: 1.8;
}
.config-label {
  color: #909399;
  margin-right: 8px;
}
.chart-card {
  margin-bottom: 16px;
}
.trend-chart {
  height: 220px;
}
.posts-card {
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.post-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  transition: all 0.2s;
}
.post-item:hover {
  border-color: #409EFF;
  background: #f5f9ff;
}
.post-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.post-main {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.post-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  flex-shrink: 0;
}
.post-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
}
.post-excerpt {
  color: #606266;
  font-size: 13px;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.post-meta {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 12px;
  align-items: center;
}
.post-meta .el-icon {
  vertical-align: -2px;
  margin-right: 3px;
}
.side-card {
  position: sticky;
  top: 0;
}
</style>
