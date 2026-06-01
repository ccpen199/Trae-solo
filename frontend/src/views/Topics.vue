<template>
  <div class="topics">
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters">
        <el-form-item label="搜索">
          <el-input v-model="filters.keyword" placeholder="话题名称/别名" clearable style="width: 200px" @keyup.enter="loadTopics" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="filters.category" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="c in categories" :key="c.name" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="filters.sort" style="width: 120px">
            <el-option label="热度优先" value="heat" />
            <el-option label="最新创建" value="newest" />
            <el-option label="内容最多" value="posts" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadTopics">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="showCreate = true">
            <el-icon><Plus /></el-icon>新建话题
          </el-button>
          <el-button type="danger" @click="batchSubmitAudit" :disabled="zeroContentTopics.length === 0">
            <el-icon><Warning /></el-icon>批量提交零内容话题审核 ({{ zeroContentTopics.length }})
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="list" v-loading="loading" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="话题名称" width="140">
          <template #default="{ row }">
            <div class="name-cell">
              <el-link type="primary" @click="$router.push(`/topics/${row.id}`)">{{ row.name }}</el-link>
              <el-tag v-if="row.post_count === 0" type="danger" size="small" effect="plain" class="zero-tag">零内容</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="别名" min-width="160">
          <template #default="{ row }">
            <div class="aliases">
              <el-tag v-for="a in parseAliases(row.aliases)" :key="a" size="small" type="info" class="alias-tag">{{ a }}</el-tag>
              <span v-if="parseAliases(row.aliases).length === 0" class="empty-text">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="post_count" label="内容数" width="90" align="center" />
        <el-table-column prop="view_count" label="浏览量" width="90" align="center" />
        <el-table-column prop="heat_score" label="热度" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.heat_score > 90 ? 'danger' : row.heat_score > 70 ? 'warning' : 'success'" size="small">
              {{ row.heat_score?.toFixed(1) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建来源" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getSourceType(row.source)">
              {{ getSourceLabel(row.source) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="治理状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.post_count === 0" type="danger" size="small">待清理</el-tag>
            <el-tag v-else size="small" type="success">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="置顶" width="70" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.is_pinned" color="#E6A23C"><Top /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'" size="small">
              {{ row.status ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column prop="manager_name" label="管理人" width="100">
          <template #default="{ row }">
            <span v-if="row.manager_name">{{ row.manager_name }}</span>
            <span class="empty-text" v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="editTopic(row)">编辑</el-button>
            <el-button size="small" type="warning" link @click="showMerge(row)">合并</el-button>
            <el-button size="small" type="danger" link v-if="row.post_count === 0" @click="submitToAudit(row)">提交审核</el-button>
            <el-button size="small" type="primary" link @click="$router.push(`/topics/${row.id}`)">详情</el-button>
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

    <el-dialog v-model="showCreate" :title="editingTopic ? '编辑话题' : '新建话题'" width="600px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="话题名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入话题名称" @blur="checkSimilarTopics" />
        </el-form-item>
        <el-form-item v-if="similarTopics.length > 0" label="相似话题">
          <el-alert type="warning" :closable="false" show-icon>
            <template #title>
              检测到 {{ similarTopics.length }} 个相似话题，请注意避免重复创建
            </template>
            <div class="similar-list">
              <div v-for="s in similarTopics" :key="s.id" class="similar-item">
                <el-link type="primary" @click="$router.push(`/topics/${s.id}`)">{{ s.name }}</el-link>
                <el-tag size="small" type="info">{{ s.category || '未分类' }}</el-tag>
                <span class="match-score">匹配度: {{ s.match_score }}%</span>
              </div>
            </div>
          </el-alert>
        </el-form-item>
        <el-form-item label="创建来源" v-if="!editingTopic">
          <el-select v-model="form.source" style="width: 100%">
            <el-option label="人工创建" value="manual" />
            <el-option label="系统自动" value="auto" />
            <el-option label="运营导入" value="import" />
            <el-option label="用户推荐" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建人" v-if="!editingTopic">
          <el-input v-model="form.creator_name" placeholder="创建人姓名" />
        </el-form-item>
        <el-form-item label="别名">
          <el-select v-model="form.aliases" multiple filterable allow-create placeholder="输入后回车添加别名" style="width: 100%" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" placeholder="选择或输入分类" filterable allow-create style="width: 100%">
            <el-option v-for="c in categories" :key="c.name" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="话题简介" />
        </el-form-item>
        <el-form-item label="封面URL">
          <el-input v-model="form.cover_url" placeholder="可选" />
        </el-form-item>
        <el-form-item label="管理人">
          <el-input v-model="form.manager_name" placeholder="负责人姓名" />
        </el-form-item>
        <el-form-item label="推荐理由">
          <el-input v-model="form.recommendation_reason" type="textarea" :rows="2" placeholder="用于推荐展示" />
        </el-form-item>
        <el-form-item label="活动入口">
          <el-input v-model="form.activity_entry" placeholder="活动链接" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="置顶">
          <el-switch v-model="form.is_pinned" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="saveTopic">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showMergeDialog" title="合并话题" width="500px" destroy-on-close>
      <el-alert type="warning" :closable="false" class="merge-alert">
        将话题「{{ mergeSource?.name }}」下的所有内容迁移到目标话题，原话题将被删除
      </el-alert>
      <el-form label-width="90px" style="margin-top: 20px">
        <el-form-item label="目标话题">
          <el-select v-model="mergeTargetId" filterable placeholder="选择目标话题" style="width: 100%">
            <el-option v-for="t in mergeTargets" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="mergeOperator" placeholder="您的姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMergeDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmMerge">确认合并</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { topicsApi, categoriesApi } from '../api'

const route = useRoute()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const categories = ref([])
const showCreate = ref(false)
const showMergeDialog = ref(false)
const mergeSource = ref(null)
const mergeTargetId = ref(null)
const mergeOperator = ref('')
const mergeTargets = ref([])
const editingTopic = ref(null)
const formRef = ref(null)
const similarTopics = ref([])
const selectedRows = ref([])

const filters = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  category: '',
  status: undefined,
  sort: 'heat'
})

const form = reactive({
  name: '',
  aliases: [],
  category: '',
  description: '',
  cover_url: '',
  manager_name: '',
  recommendation_reason: '',
  activity_entry: '',
  status: 1,
  is_pinned: 0,
  source: 'manual',
  creator_name: '管理员'
})

const rules = {
  name: [{ required: true, message: '请输入话题名称', trigger: 'blur' }]
}

const parseAliases = (aliases) => {
  try {
    return JSON.parse(aliases || '[]')
  } catch {
    return []
  }
}

const loadTopics = async () => {
  loading.value = true
  try {
    const params = { ...filters }
    if (params.status === '' || params.status === undefined) delete params.status
    const res = await topicsApi.list(params)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const res = await categoriesApi.list()
    categories.value = res.categories
  } catch (e) {}
}

const resetFilters = () => {
  filters.page = 1
  filters.keyword = ''
  filters.category = ''
  filters.status = undefined
  filters.sort = 'heat'
  loadTopics()
}

const getSourceType = (source) => {
  const map = { manual: 'primary', auto: 'info', import: 'warning', user: 'success' }
  return map[source] || 'info'
}

const getSourceLabel = (source) => {
  const map = { manual: '人工创建', auto: '系统自动', import: '运营导入', user: '用户推荐' }
  return map[source] || '未知'
}

const submitToAudit = async (row) => {
  try {
    await ElMessageBox.confirm(`确定将话题「${row.name}」提交审核？该话题为零内容话题，审核后可能被合并或停用。`, '提示', { type: 'warning' })
    await topicsApi.submitAudit(row.id, { reason: '零内容话题待清理', operator_name: '管理员' })
    ElMessage.success('已提交审核')
    loadTopics()
  } catch (e) {}
}

const zeroContentTopics = computed(() => {
  return list.value.filter(t => t.post_count === 0)
})

const handleSelectionChange = (val) => {
  selectedRows.value = val
}

const batchSubmitAudit = async () => {
  if (zeroContentTopics.value.length === 0) {
    ElMessage.warning('没有零内容话题需要处理')
    return
  }
  try {
    await ElMessageBox.confirm(`确定将 ${zeroContentTopics.value.length} 个零内容话题提交审核？审核后可能被合并或停用。`, '批量提交审核', { type: 'warning' })
    await Promise.all(zeroContentTopics.value.map(t => topicsApi.submitAudit(t.id, { reason: '零内容话题待清理', operator_name: '管理员' })))
    ElMessage.success(`已提交 ${zeroContentTopics.value.length} 个话题审核`)
    loadTopics()
  } catch (e) {}
}

const pageChange = (p) => {
  filters.page = p
  loadTopics()
}

const sizeChange = (s) => {
  filters.pageSize = s
  filters.page = 1
  loadTopics()
}

const editTopic = (row) => {
  editingTopic.value = row
  form.name = row.name
  form.aliases = parseAliases(row.aliases)
  form.category = row.category || ''
  form.description = row.description || ''
  form.cover_url = row.cover_url || ''
  form.manager_name = row.manager_name || ''
  form.recommendation_reason = row.recommendation_reason || ''
  form.activity_entry = row.activity_entry || ''
  form.status = row.status
  form.is_pinned = row.is_pinned
  similarTopics.value = []
  showCreate.value = true
}

const checkSimilarTopics = async () => {
  if (!form.name || form.name.length < 2) {
    similarTopics.value = []
    return
  }
  try {
    const res = await topicsApi.checkSimilar({ name: form.name })
    similarTopics.value = res.similar.filter(s => s.id !== editingTopic.value?.id).slice(0, 5)
  } catch (e) {
    similarTopics.value = []
  }
}

const saveTopic = async () => {
  await formRef.value.validate()
  try {
    if (editingTopic.value) {
      await topicsApi.update(editingTopic.value.id, form)
      ElMessage.success('更新成功')
    } else {
      await topicsApi.create(form)
      ElMessage.success('创建成功')
    }
    showCreate.value = false
    loadTopics()
  } catch (e) {}
}

const showMerge = async (row) => {
  mergeSource.value = row
  mergeTargetId.value = null
  mergeOperator.value = ''
  try {
    const res = await topicsApi.list({ pageSize: 100, status: 1 })
    mergeTargets.value = res.list.filter(t => t.id !== row.id)
  } catch (e) {}
  showMergeDialog.value = true
}

const confirmMerge = async () => {
  if (!mergeTargetId.value) {
    ElMessage.warning('请选择目标话题')
    return
  }
  try {
    await ElMessageBox.confirm(`确认将「${mergeSource.value.name}」合并到目标话题？此操作不可撤销`, '确认合并', { type: 'warning' })
    await topicsApi.merge(mergeSource.value.id, {
      target_topic_id: mergeTargetId.value,
      operator_name: mergeOperator.value || '系统'
    })
    ElMessage.success('合并成功')
    showMergeDialog.value = false
    loadTopics()
  } catch (e) {}
}

const initFromRoute = () => {
  if (route.query.keyword && route.query.keyword !== 'undefined') {
    filters.keyword = String(route.query.keyword)
  }
  if (route.query.category) {
    filters.category = String(route.query.category)
  }
  if (route.query.status !== undefined) {
    filters.status = Number(route.query.status)
  }
}

onMounted(() => {
  initFromRoute()
  loadTopics()
  loadCategories()
})

watch(() => route.query, () => {
  initFromRoute()
  loadTopics()
}, { immediate: false })

watch(() => showCreate.value, (val) => {
  if (!val) {
    similarTopics.value = []
    editingTopic.value = null
  }
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
.aliases {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.alias-tag {
  margin: 0;
}
.merge-alert {
  margin-bottom: 0;
}
.similar-list {
  max-height: 150px;
  overflow-y: auto;
}
.similar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.match-score {
  color: #909399;
  font-size: 12px;
}
.name-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}
.zero-tag {
  margin: 0;
}
.empty-text {
  color: #c0c4cc;
  font-size: 12px;
}
</style>
