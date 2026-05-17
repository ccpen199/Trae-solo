<template>
  <div class="planet-detail-container">
    <el-header class="planet-header">
      <div class="header-inner">
        <el-button :icon="ArrowLeft" text @click="goBack">返回</el-button>
        <h1 class="page-title" v-if="planet">{{ planet.name }}</h1>
      </div>
    </el-header>

    <el-main class="planet-main" v-loading="loading">
      <div v-if="error" class="error-wrap">
        <el-icon :size="48" color="#f56c6c"><Warning /></el-icon>
        <p class="error-text">加载失败</p>
        <el-button type="primary" class="mt-20" @click="fetchPlanet">重新加载</el-button>
      </div>

      <template v-else-if="planet">
        <el-card class="info-card">
          <div class="planet-info">
            <div class="planet-avatar">
              <span class="avatar-letter">{{ planet.name.charAt(0) }}</span>
            </div>
            <div class="planet-body">
              <div class="planet-title-row">
                <h2 class="planet-name">{{ planet.name }}</h2>
                <el-tag v-if="planet.user_role" :type="planet.user_role === 'owner' ? 'danger' : 'success'">
                  {{ planet.user_role === 'owner' ? '创建者' : '成员' }}
                </el-tag>
                <el-tag v-if="planet.join_type === 'paid'" type="warning">付费</el-tag>
              </div>
              <p class="planet-desc">{{ planet.description || '暂无介绍' }}</p>
              <div class="planet-stats">
                <span class="stat-item">
                  <el-icon><User /></el-icon>
                  {{ planet.member_count || 0 }} 成员
                </span>
                <span class="stat-item">
                  <el-icon><Document /></el-icon>
                  {{ planet.topic_count || 0 }} 主题
                </span>
                <span class="stat-item">
                  <el-icon><User /></el-icon>
                  星球主: {{ planet.owner_name }}
                </span>
              </div>
            </div>
            <div class="planet-actions">
              <template v-if="planet.user_role">
                <el-button type="primary" @click="showCreateTopic = true">
                  <el-icon><Plus /></el-icon>
                  发布主题
                </el-button>
                <el-button type="success" class="ml-10" @click="showInvite = true">
                  <el-icon><Share /></el-icon>
                  邀请成员
                </el-button>
              </template>
              <template v-else>
                <el-button
                  type="primary"
                  :loading="joining"
                  @click="handleJoin"
                >
                  {{ planet.join_type === 'paid' ? `加入 ¥${planet.price}` : '加入星球' }}
                </el-button>
              </template>
            </div>
          </div>
        </el-card>

        <div class="toolbar-row">
          <el-tabs v-model="activeTab" class="topic-tabs">
            <el-tab-pane label="全部主题" name="all" />
            <el-tab-pane label="精华主题" name="featured" />
            <el-tab-pane label="问答" name="question" />
          </el-tabs>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索主题"
            prefix-icon="Search"
            style="width: 240px"
            @keyup.enter="searchTopics"
          />
        </div>

        <div v-if="topicsLoading" class="loading-wrap">
          <el-skeleton :rows="3" animated />
        </div>

        <div v-else-if="topics.length === 0" class="empty-wrap">
          <el-icon :size="48" color="#909399"><Document /></el-icon>
          <p class="empty-text">暂无主题</p>
          <el-button
            v-if="planet.user_role"
            type="primary"
            class="mt-20"
            @click="showCreateTopic = true"
          >
            发布第一个主题
          </el-button>
        </div>

        <div v-else class="topic-list">
          <el-card
            v-for="topic in topics"
            :key="topic.id"
            class="topic-card"
            @click="goTopicDetail(topic.id)"
          >
            <div class="topic-inner">
              <el-avatar :size="40">
                {{ topic.nickname?.charAt(0) || 'U' }}
              </el-avatar>
              <div class="topic-content">
                <div class="topic-meta">
                  <span class="topic-author">{{ topic.nickname }}</span>
                  <el-tag v-if="topic.is_question" type="warning" size="small">提问</el-tag>
                </div>
                <h3 class="topic-title">{{ topic.title }}</h3>
                <p class="topic-text">{{ topic.content }}</p>
                <div class="topic-footer">
                  <span class="topic-time">{{ formatTime(topic.created_at) }}</span>
                  <span class="stat-item">
                    <el-icon><View /></el-icon>
                    {{ topic.view_count || 0 }}
                  </span>
                  <span class="stat-item">
                    <el-icon><ChatDotRound /></el-icon>
                    {{ topic.comment_count || 0 }}
                  </span>
                  <span class="stat-item">
                    <el-icon><GoodFilled /></el-icon>
                    {{ topic.like_count || 0 }}
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <div v-if="topics.length > 0" class="pagination-wrap">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next"
            @current-change="fetchTopics"
          />
        </div>
      </template>
    </el-main>

    <el-dialog v-model="showCreateTopic" title="发布主题" width="600px">
      <el-form :model="topicForm" :rules="topicRules" ref="topicFormRef" label-width="0">
        <el-form-item prop="title">
          <el-input v-model="topicForm.title" placeholder="请输入标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item prop="content">
          <el-input
            v-model="topicForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入内容"
            maxlength="5000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="topicForm.is_question">设为提问</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateTopic = false">取消</el-button>
        <el-button type="primary" @click="handleCreateTopic" :loading="topicSubmitting">发布</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showInvite" title="邀请成员" width="500px">
      <p class="invite-tip">将邀请码分享给朋友，朋友加入后您将获得邀请奖励</p>
      <el-input
        v-model="inviteCode"
        readonly
        placeholder="生成邀请码中..."
      >
        <template #append>
          <el-button @click="copyInviteCode">复制</el-button>
        </template>
      </el-input>
      <el-button type="primary" class="w-full mt-20" @click="generateInviteCode" :loading="generatingInvite">
        生成邀请码
      </el-button>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getPlanetById, joinPlanet, createInviteCode } from '@/api/planet'
import { getTopics, createTopic } from '@/api/topic'
import { ArrowLeft, User, Document, Plus, Share, Search, View, ChatDotRound, GoodFilled, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const error = ref(false)
const joining = ref(false)
const topicsLoading = ref(false)
const showCreateTopic = ref(false)
const showInvite = ref(false)
const topicSubmitting = ref(false)
const generatingInvite = ref(false)

const planet = ref(null)
const topics = ref([])
const activeTab = ref('all')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const inviteCode = ref('')
const topicFormRef = ref(null)
const topicForm = reactive({
  title: '',
  content: '',
  is_question: false
})

const topicRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' }
  ]
}

const fetchPlanet = async () => {
  loading.value = true
  error.value = false

  try {
    const res = await getPlanetById(route.params.id)
    planet.value = res.data
  } catch (err) {
    console.error('获取星球详情失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

const fetchTopics = async () => {
  if (!planet.value) return

  topicsLoading.value = true

  try {
    const params = {
      planet_id: planet.value.id,
      page: currentPage.value,
      pageSize: pageSize.value
    }

    if (activeTab.value === 'question') {
      params.type = 'question'
    }

    const res = await getTopics(params)
    topics.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('获取主题列表失败:', err)
  } finally {
    topicsLoading.value = false
  }
}

const handleJoin = async () => {
  if (!userStore.token) {
    router.push('/login')
    return
  }

  joining.value = true

  try {
    await joinPlanet({ planet_id: planet.value.id })

    ElMessage.success('加入成功')
    await fetchPlanet()
  } catch (error) {
    console.error('加入星球失败:', error)
  } finally {
    joining.value = false
  }
}

const handleCreateTopic = async () => {
  if (!topicFormRef.value) return

  try {
    await topicFormRef.value.validate()
    topicSubmitting.value = true

    await createTopic({
      planet_id: planet.value.id,
      ...topicForm
    })

    ElMessage.success('发布成功')
    showCreateTopic.value = false

    topicForm.title = ''
    topicForm.content = ''
    topicForm.is_question = false

    currentPage.value = 1
    await fetchTopics()
    await fetchPlanet()
  } catch (error) {
    console.error('发布主题失败:', error)
  } finally {
    topicSubmitting.value = false
  }
}

const generateInviteCode = async () => {
  generatingInvite.value = true

  try {
    const res = await createInviteCode({ planet_id: planet.value.id })
    inviteCode.value = res.data.invite_code
    ElMessage.success('邀请码生成成功')
  } catch (error) {
    console.error('生成邀请码失败:', error)
  } finally {
    generatingInvite.value = false
  }
}

const copyInviteCode = async () => {
  if (!inviteCode.value) {
    ElMessage.warning('请先生成邀请码')
    return
  }

  try {
    await navigator.clipboard.writeText(inviteCode.value)
    ElMessage.success('复制成功')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

const goBack = () => {
  router.back()
}

const goTopicDetail = (id) => {
  router.push(`/topic/${id}`)
}

const searchTopics = () => {
  if (searchKeyword.value.trim()) {
    router.push(`/search?keyword=${encodeURIComponent(searchKeyword.value)}&planet_id=${planet.value.id}`)
  }
}

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  fetchPlanet()
  fetchTopics()
})
</script>

<style scoped>
.planet-detail-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.planet-header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 0 24px;
  height: 64px;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
}

.page-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 0 16px;
}

.planet-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.error-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.error-text {
  color: #606266;
  margin-top: 16px;
}

.mt-20 {
  margin-top: 20px;
}

.ml-10 {
  margin-left: 10px;
}

.info-card {
  margin-bottom: 24px;
}

.planet-info {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.planet-avatar {
  width: 96px;
  height: 96px;
  background: linear-gradient(90deg, #66b1ff, #b37feb);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-letter {
  font-size: 36px;
  font-weight: bold;
  color: #fff;
}

.planet-body {
  flex: 1;
}

.planet-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.planet-name {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.planet-desc {
  color: #606266;
  margin: 0 0 16px 0;
}

.planet-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  color: #909399;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.planet-actions {
  flex-shrink: 0;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.topic-tabs {
  flex: 1;
  margin-bottom: 0;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.empty-text {
  color: #606266;
  margin-top: 16px;
}

.topic-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.topic-card {
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.topic-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.topic-inner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.topic-content {
  flex: 1;
  min-width: 0;
}

.topic-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.topic-author {
  font-weight: 500;
  color: #303133;
}

.topic-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.topic-text {
  color: #606266;
  font-size: 14px;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.topic-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.topic-time {
  color: #c0c4cc;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.invite-tip {
  color: #606266;
  margin-bottom: 16px;
}

.w-full {
  width: 100%;
}
</style>
