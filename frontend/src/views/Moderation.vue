<template>
  <div class="moderation">
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="待处理" :value="0" />
            <el-option label="已处理" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="全部类型" clearable style="width: 160px">
            <el-option label="敏感话题" value="sensitive_topic" />
            <el-option label="恶意蹭标签" value="malicious_tag" />
            <el-option label="重复话题" value="duplicate_topic" />
            <el-option label="错误归类" value="wrong_category" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">{{ getTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column prop="reason" label="原因" min-width="160" show-overflow-tooltip />
        <el-table-column prop="reporter_name" label="举报人" width="100" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'warning'" size="small">
              {{ row.status ? '已处理' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handler_name" label="处理人" width="100" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button size="small" type="primary" link @click="handleItem(row)">处理</el-button>
            </template>
            <template v-else>
              <el-button size="small" type="info" link @click="viewDetail(row)">查看</el-button>
            </template>
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

    <el-dialog v-model="showHandle" title="处理审核" width="600px" destroy-on-close>
      <div class="handle-content" v-if="currentItem">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="类型">{{ getTypeName(currentItem.type) }}</el-descriptions-item>
          <el-descriptions-item label="标题">{{ currentItem.title }}</el-descriptions-item>
          <el-descriptions-item label="内容">{{ currentItem.content }}</el-descriptions-item>
          <el-descriptions-item label="举报原因">{{ currentItem.reason }}</el-descriptions-item>
          <el-descriptions-item label="举报人">{{ currentItem.reporter_name }}</el-descriptions-item>
        </el-descriptions>

        <el-form label-width="90px" style="margin-top: 20px">
          <el-form-item label="处理动作">
            <el-select v-model="handleAction" style="width: 100%">
              <el-option v-for="a in getActions(currentItem.type)" :key="a.value" :label="a.label" :value="a.value" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="handleAction === 'merge_topics'" label="目标话题">
            <el-select v-model="targetTopicId" filterable placeholder="选择目标话题" style="width: 100%">
              <el-option v-for="t in topicOptions" :key="t.id" :label="t.name" :value="t.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="处理结果">
            <el-input v-model="handleResult" type="textarea" :rows="3" placeholder="请输入处理说明" />
          </el-form-item>
          <el-form-item label="处理人">
            <el-input v-model="handlerName" placeholder="您的姓名" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showHandle = false">取消</el-button>
        <el-button type="primary" @click="confirmHandle">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { moderationApi, topicsApi } from '../api'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const showHandle = ref(false)
const currentItem = ref(null)
const handleAction = ref('')
const handleResult = ref('')
const handlerName = ref('管理员')
const targetTopicId = ref(null)
const topicOptions = ref([])

const filters = reactive({
  page: 1,
  pageSize: 20,
  status: undefined,
  type: ''
})

const typeMap = {
  sensitive_topic: { name: '敏感话题', tag: 'danger' },
  malicious_tag: { name: '恶意蹭标签', tag: 'warning' },
  duplicate_topic: { name: '重复话题', tag: 'info' },
  wrong_category: { name: '错误归类', tag: 'primary' }
}

const getTypeName = (type) => typeMap[type]?.name || type
const getTypeTag = (type) => typeMap[type]?.tag || 'info'

const getActions = (type) => {
  const actions = {
    sensitive_topic: [
      { label: '封禁话题', value: 'ban_topic' },
      { label: '降权处理', value: 'downgrade' },
      { label: '忽略', value: 'ignore' }
    ],
    malicious_tag: [
      { label: '移除标签', value: 'remove_tag' },
      { label: '忽略', value: 'ignore' }
    ],
    duplicate_topic: [
      { label: '合并话题', value: 'merge_topics' },
      { label: '忽略', value: 'ignore' }
    ],
    wrong_category: [
      { label: '移除标签', value: 'remove_tag' },
      { label: '忽略', value: 'ignore' }
    ]
  }
  return actions[type] || [{ label: '忽略', value: 'ignore' }]
}

const loadList = async () => {
  loading.value = true
  try {
    const params = { ...filters }
    if (params.status === undefined || params.status === '') delete params.status
    if (!params.type) delete params.type
    const res = await moderationApi.list(params)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const loadTopics = async () => {
  try {
    const res = await topicsApi.list({ pageSize: 200, status: 1 })
    topicOptions.value = res.list
  } catch (e) {}
}

const resetFilters = () => {
  filters.page = 1
  filters.status = undefined
  filters.type = ''
  loadList()
}

const pageChange = (p) => {
  filters.page = p
  loadList()
}

const sizeChange = (s) => {
  filters.pageSize = s
  filters.page = 1
  loadList()
}

const handleItem = (row) => {
  currentItem.value = row
  handleAction.value = ''
  handleResult.value = ''
  targetTopicId.value = null
  loadTopics()
  showHandle.value = true
}

const viewDetail = (row) => {
  currentItem.value = row
  showHandle.value = true
}

const confirmHandle = async () => {
  try {
    await ElMessageBox.confirm('确认提交处理结果？', '确认处理', { type: 'warning' })
    await moderationApi.handle(currentItem.value.id, {
      action: handleAction.value,
      result: handleResult.value,
      handler_name: handlerName.value,
      target_topic_id: targetTopicId.value
    })
    ElMessage.success('处理成功')
    showHandle.value = false
    loadList()
  } catch (e) {}
}

onMounted(() => {
  loadList()
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
.handle-content {
  padding: 10px 0;
}
</style>
