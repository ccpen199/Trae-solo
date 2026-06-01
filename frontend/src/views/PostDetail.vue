<template>
  <div class="post-detail" v-loading="loading">
    <el-page-header @back="$router.back()" content="内容详情" class="page-header" />

    <el-row :gutter="16">
      <el-col :span="18">
        <el-card class="post-card" shadow="never">
          <h1 class="post-title">{{ post?.title }}</h1>
          <div class="post-meta">
            <span>作者：{{ post?.author_name || '匿名' }}</span>
            <span><el-icon><View /></el-icon> {{ post?.view_count || 0 }}</span>
            <span><el-icon><GoodFilled /></el-icon> {{ post?.like_count || 0 }}</span>
            <span><el-icon><ChatDotRound /></el-icon> {{ post?.comment_count || 0 }}</span>
            <span><el-icon><Share /></el-icon> {{ post?.share_count || 0 }}</span>
          </div>
          <div class="post-content">{{ post?.content }}</div>
        </el-card>

        <el-card class="tags-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>话题标签</span>
              <el-button type="primary" size="small" @click="openEditTags">
                <el-icon><Edit /></el-icon>编辑标签
              </el-button>
            </div>
          </template>
          <div class="current-tags" v-if="post?.topics?.length">
            <div v-for="t in post.topics" :key="t.id" class="tag-item">
              <el-tag :type="t.tag_source === 'auto' ? 'warning' : 'success'" size="large">
                {{ t.name }}
              </el-tag>
              <div class="tag-meta">
                <span>来源：{{ t.tag_source === 'auto' ? '自动建议' : '人工添加' }}</span>
                <span>置信度：{{ (t.confidence * 100).toFixed(0) }}%</span>
                <span>操作人：{{ t.operator_name || '-' }}</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无标签" />
        </el-card>

        <el-card class="suggest-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>推荐标签</span>
              <el-button type="success" size="small" @click="loadSuggestions">
                <el-icon><Refresh /></el-icon>刷新建议
              </el-button>
            </div>
          </template>
          <div class="suggestions" v-if="suggestions.length">
            <div v-for="s in suggestions" :key="s.id" class="suggest-item">
              <span class="suggest-name">{{ s.name }}</span>
              <el-tag size="small" type="info">匹配度 {{ (s.confidence * 100).toFixed(0) }}%</el-tag>
              <el-button type="primary" link size="small" @click="addSuggestion(s)">添加</el-button>
            </div>
          </div>
          <el-empty v-else description="暂无推荐标签" />
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="side-card" shadow="never">
          <template #header>快速操作</template>
          <el-button type="primary" style="width: 100%; margin-bottom: 10px" @click="showEditTags = true">
            编辑标签
          </el-button>
          <el-button type="success" style="width: 100%; margin-bottom: 10px" @click="loadSuggestions">
            获取推荐
          </el-button>
          <el-button type="info" style="width: 100%" @click="$router.push('/tag-changes')">
            查看变更日志
          </el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showEditTags" title="编辑话题标签" width="600px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="已有标签">
          <div class="selected-tags">
            <el-tag
              v-for="t in editingTags"
              :key="t.id"
              closable
              @close="removeTag(t.id)"
              style="margin-right: 8px; margin-bottom: 8px"
            >
              {{ t.name }}
            </el-tag>
            <span v-if="editingTags.length === 0" class="empty-tip">暂无标签</span>
          </div>
        </el-form-item>
        <el-form-item label="添加标签">
          <el-select v-model="selectedTagId" filterable placeholder="搜索并选择话题" style="width: 100%">
            <el-option v-for="t in allTopics" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
          <el-button type="primary" size="small" style="margin-top: 8px" @click="addTag">添加</el-button>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="operatorName" placeholder="您的姓名" />
        </el-form-item>
        <el-form-item label="操作来源">
          <el-radio-group v-model="tagSource">
            <el-radio value="manual">人工添加</el-radio>
            <el-radio value="batch">批量迁移</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditTags = false">取消</el-button>
        <el-button type="primary" @click="saveTags">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { postsApi, topicsApi } from '../api'

const route = useRoute()
const loading = ref(false)
const post = ref(null)
const suggestions = ref([])
const showEditTags = ref(false)
const editingTags = ref([])
const allTopics = ref([])
const selectedTagId = ref(null)
const operatorName = ref('管理员')
const tagSource = ref('manual')

const loadPost = async () => {
  loading.value = true
  try {
    const res = await postsApi.detail(route.params.id)
    post.value = res
  } finally {
    loading.value = false
  }
}

const loadSuggestions = async () => {
  try {
    const res = await postsApi.suggestions(route.params.id)
    suggestions.value = res.suggestions || []
  } catch (e) {}
}

const loadAllTopics = async () => {
  try {
    const res = await topicsApi.list({ pageSize: 200, status: 1 })
    allTopics.value = res.list
  } catch (e) {}
}

const addSuggestion = async (s) => {
  try {
    await postsApi.batchTags(route.params.id, {
      add_topic_ids: [s.id],
      operator_name: '管理员',
      source: 'auto'
    })
    ElMessage.success(`已添加标签「${s.name}」`)
    loadPost()
    loadSuggestions()
  } catch (e) {}
}

const openEditTags = () => {
  editingTags.value = [...(post.value?.topics || [])]
  loadAllTopics()
  showEditTags.value = true
}

const addTag = () => {
  if (!selectedTagId.value) return
  const exists = editingTags.value.find(t => t.id === selectedTagId.value)
  if (exists) {
    ElMessage.warning('该标签已存在')
    return
  }
  const topic = allTopics.value.find(t => t.id === selectedTagId.value)
  if (topic) {
    editingTags.value.push(topic)
  }
  selectedTagId.value = null
}

const removeTag = (id) => {
  editingTags.value = editingTags.value.filter(t => t.id !== id)
}

const saveTags = async () => {
  try {
    await postsApi.updateTags(route.params.id, {
      topic_ids: editingTags.value.map(t => t.id),
      source: tagSource.value,
      operator_name: operatorName.value
    })
    ElMessage.success('标签更新成功')
    showEditTags.value = false
    loadPost()
  } catch (e) {}
}

onMounted(() => {
  loadPost()
  loadSuggestions()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}
.post-card {
  margin-bottom: 16px;
}
.post-title {
  margin: 0 0 16px 0;
  font-size: 24px;
  color: #303133;
}
.post-meta {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 13px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}
.post-meta .el-icon {
  vertical-align: -2px;
  margin-right: 4px;
}
.post-content {
  color: #606266;
  line-height: 1.8;
  font-size: 14px;
}
.tags-card, .suggest-card {
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.current-tags {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tag-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}
.tag-meta {
  display: flex;
  gap: 20px;
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}
.suggestions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.suggest-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f0f9eb;
  border-radius: 6px;
}
.suggest-name {
  font-weight: 500;
  color: #67c23a;
}
.selected-tags {
  min-height: 40px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}
.empty-tip {
  color: #909399;
  font-size: 13px;
}
.side-card {
  position: sticky;
  top: 0;
}
</style>
