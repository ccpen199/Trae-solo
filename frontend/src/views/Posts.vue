<template>
  <div class="posts">
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters">
        <el-form-item label="搜索">
          <el-input v-model="filters.keyword" placeholder="内容标题" clearable style="width: 200px" @keyup.enter="loadPosts" />
        </el-form-item>
        <el-form-item label="话题">
          <el-select v-model="filters.topic_id" placeholder="全部话题" clearable filterable style="width: 160px">
            <el-option v-for="t in topicOptions" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadPosts">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="showCreate = true">
            <el-icon><Plus /></el-icon>新建内容
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="$router.push(`/posts/${row.id}`)">{{ row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="author_name" label="作者" width="100" />
        <el-table-column label="标签" min-width="280">
          <template #default="{ row }">
            <div class="tags">
              <el-tag
                v-for="t in row.topics || []"
                :key="t.id"
                size="small"
                :type="t.tag_source === 'auto' ? 'warning' : 'success'"
                class="tag"
                :title="t.tag_source === 'auto' ? '自动标记' : '人工标记'"
              >
                {{ t.name }}
                <el-icon class="tag-source-icon" v-if="t.tag_source === 'auto'"><MagicStick /></el-icon>
                <el-icon class="tag-source-icon" v-else><User /></el-icon>
              </el-tag>
              <el-tag v-if="!row.topics || row.topics.length === 0" size="small" type="danger" effect="plain" class="tag">
                <el-icon><Warning /></el-icon>
                无标签
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="view_count" label="浏览" width="70" align="center" />
        <el-table-column prop="like_count" label="点赞" width="70" align="center" />
        <el-table-column prop="comment_count" label="评论" width="70" align="center" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="$router.push(`/posts/${row.id}`)">编辑标签</el-button>
            <el-button size="small" type="danger" link v-if="row.topics && row.topics.length > 0" @click="reportMisclassification(row)">举报错配</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :current-page="filters.page"
        :page-size="filters.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="pageChange"
        @size-change="sizeChange"
      />
    </el-card>

    <el-dialog v-model="showCreate" title="新建内容" width="600px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入内容标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="内容正文" />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="form.author_name" placeholder="作者名称" />
        </el-form-item>
        <el-form-item label="话题标签">
          <el-select v-model="form.topic_ids" multiple filterable placeholder="选择话题" style="width: 100%">
            <el-option v-for="t in topicOptions" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="savePost">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { postsApi, topicsApi, moderationApi } from '../api'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const topicOptions = ref([])
const showCreate = ref(false)
const formRef = ref(null)

const filters = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  topic_id: ''
})

const form = reactive({
  title: '',
  content: '',
  author_name: '',
  topic_ids: []
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

const loadPosts = async () => {
  loading.value = true
  try {
    const params = { ...filters }
    if (!params.topic_id) delete params.topic_id
    const res = await postsApi.list(params)
    
    const postsWithTopics = await Promise.all(
      res.list.map(async (post) => {
        try {
          const detail = await postsApi.detail(post.id)
          return { ...post, topics: detail.topics || [] }
        } catch {
          return { ...post, topics: [] }
        }
      })
    )
    
    list.value = postsWithTopics
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const loadTopics = async () => {
  try {
    const res = await topicsApi.list({ pageSize: 100, status: 1 })
    topicOptions.value = res.list
  } catch (e) {}
}

const resetFilters = () => {
  filters.page = 1
  filters.keyword = ''
  filters.topic_id = ''
  loadPosts()
}

const pageChange = (p) => {
  filters.page = p
  loadPosts()
}

const sizeChange = (s) => {
  filters.pageSize = s
  filters.page = 1
  loadPosts()
}

const savePost = async () => {
  await formRef.value.validate()
  try {
    await postsApi.create(form)
    ElMessage.success('创建成功')
    showCreate.value = false
    loadPosts()
  } catch (e) {}
}

const reportMisclassification = async (row) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(`请输入举报「${row.title}」标签错配的原因`, '举报标签错配', {
      confirmButtonText: '提交',
      cancelButtonText: '取消',
      inputPlaceholder: '请描述错误归类情况...',
      inputValidator: (val) => !!val || '请输入举报原因'
    })
    await moderationApi.create({
      post_id: row.id,
      type: 'misclassification',
      reason: reason,
      operator_name: '管理员'
    })
    ElMessage.success('举报已提交，将进入审核队列')
  } catch (e) {}
}

onMounted(() => {
  loadPosts()
  loadTopics()
})
</script>

<style scoped>
.filter-card {
  margin-bottom: 16px;
  border: none;
}
.table-card {
  border: none;
}
.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tag {
  margin: 0;
}
.tag-source-icon {
  margin-left: 2px;
  font-size: 10px;
}
</style>
