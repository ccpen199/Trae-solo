<template>
  <div class="contents">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>内容管理</span>
          <div class="header-actions">
            <el-select v-model="query.siteId" placeholder="选择站点" @change="handleQuery" clearable style="width: 150px; margin-right: 10px">
              <el-option v-for="site in siteList" :key="site.id" :label="site.name" :value="site.id" />
            </el-select>
            <el-select v-model="query.categoryId" placeholder="选择栏目" @change="handleQuery" clearable style="width: 150px; margin-right: 10px">
              <el-option v-for="cat in categoryOptions" :key="cat.id" :label="cat.name" :value="cat.id" />
            </el-select>
            <el-select v-model="query.publishStatus" placeholder="发布状态" @change="handleQuery" clearable style="width: 120px; margin-right: 10px">
              <el-option label="草稿" value="draft" />
              <el-option label="待审核" value="pending" />
              <el-option label="已发布" value="published" />
              <el-option label="已归档" value="archived" />
            </el-select>
            <el-input
              v-model="query.keyword"
              placeholder="搜索标题"
              clearable
              @clear="handleQuery"
              @keyup.enter="handleQuery"
              style="width: 180px; margin-right: 10px"
            >
              <template #append>
                <el-button icon="Search" @click="handleQuery" />
              </template>
            </el-input>
            <el-button type="primary" @click="handleCreate" :disabled="!query.siteId">
              <el-icon><Plus /></el-icon>
              新建内容
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="contentList" v-loading="loading" row-key="id" border>
        <el-table-column prop="title" label="标题" min-width="250">
          <template #default="{ row }">
            <div class="content-title">
              <el-icon v-if="row.isTop" color="#F56C6C"><Top /></el-icon>
              <el-icon v-else><Document /></el-icon>
              <span>{{ row.title }}</span>
              <el-tag v-if="row.isTop" type="danger" size="small" style="margin-left: 5px">置顶</el-tag>
              <el-tag v-if="row.isRecommend" type="warning" size="small" style="margin-left: 5px">推荐</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="contentType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ contentTypeName(row.contentType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publishStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.publishStatus)" size="small">
              {{ statusName(row.publishStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="100">
          <template #default="{ row }">
            {{ row.author || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="浏览" width="80">
          <template #default="{ row }">
            {{ row.viewCount }}
          </template>
        </el-table-column>
        <el-table-column prop="publishedAt" label="发布时间" width="180">
          <template #default="{ row }">
            {{ row.publishedAt ? formatDate(row.publishedAt) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <template v-if="row.publishStatus !== 'published'">
              <el-button type="success" link size="small" @click="handlePublish(row)">发布</el-button>
            </template>
            <template v-else>
              <el-button type="warning" link size="small" @click="handleDraft(row)">撤回</el-button>
            </template>
            <el-button type="primary" link size="small" @click="handleCopy(row)">复制</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑内容' : '新建内容'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属站点" prop="siteId">
              <el-select v-model="form.siteId" placeholder="请选择站点" style="width: 100%" disabled>
                <el-option v-for="site in siteList" :key="site.id" :label="site.name" :value="site.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属栏目">
              <el-tree-select
                v-model="form.categoryId"
                :data="categoryOptions"
                :props="{ label: 'name', value: 'id' }"
                placeholder="请选择栏目"
                clearable
                check-strictly
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="内容类型">
              <el-select v-model="form.contentType" placeholder="请选择类型" style="width: 100%">
                <el-option label="新闻" value="news" />
                <el-option label="产品" value="product" />
                <el-option label="文档" value="document" />
                <el-option label="下载" value="download" />
                <el-option label="图片" value="image" />
                <el-option label="视频" value="video" />
                <el-option label="页面" value="page" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="发布状态">
              <el-select v-model="form.publishStatus" placeholder="请选择状态" style="width: 100%">
                <el-option label="草稿" value="draft" />
                <el-option label="待审核" value="pending" />
                <el-option label="已发布" value="published" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="作者">
              <el-input v-model="form.author" placeholder="请输入作者" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="摘要">
          <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="请输入摘要" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="8" placeholder="请输入内容" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="封面">
              <el-input v-model="form.coverUrl" placeholder="封面图片URL" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="跳转链接">
              <el-input v-model="form.redirectUrl" placeholder="外部跳转链接" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="设置">
          <el-checkbox v-model="form.isTop" style="margin-right: 15px">置顶</el-checkbox>
          <el-checkbox v-model="form.isRecommend" style="margin-right: 15px">推荐</el-checkbox>
          <el-checkbox v-model="form.isHot">热门</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button :loading="submitting" @click="handleSave(false)">保存草稿</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSave(true)">保存并发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { request } from '@/utils/request'
import { useUserStore } from '@/store/user'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const siteList = ref<any[]>([])
const categoryList = ref<any[]>([])
const contentList = ref<any[]>([])
const total = ref(0)
const formRef = ref<FormInstance>()

const query = reactive({
  siteId: '',
  categoryId: '',
  publishStatus: '',
  keyword: '',
  page: 1,
  pageSize: 20
})

const form = reactive({
  id: '',
  siteId: '',
  categoryId: '',
  title: '',
  contentType: 'news' as string,
  publishStatus: 'draft' as string,
  author: '',
  summary: '',
  content: '',
  coverUrl: '',
  redirectUrl: '',
  isTop: false,
  isRecommend: false,
  isHot: false
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  siteId: [{ required: true, message: '请选择站点', trigger: 'change' }]
}

const categoryOptions = computed(() => {
  return buildTreeOptions(categoryList.value)
})

function buildTreeOptions(items: any[]): any[] {
  return items.map(item => ({
    ...item,
    children: item.children ? buildTreeOptions(item.children) : undefined
  }))
}

function buildTree(items: any[]): any[] {
  const map = new Map<string, any>()
  const roots: any[] = []

  items.forEach(item => {
    map.set(item.id, { ...item, children: [] })
  })

  items.forEach(item => {
    const node = map.get(item.id)!
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)!
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

function contentTypeName(type: string) {
  const map: Record<string, string> = {
    news: '新闻', product: '产品', document: '文档',
    download: '下载', image: '图片', video: '视频', page: '页面'
  }
  return map[type] || type
}

function statusName(status: string) {
  const map: Record<string, string> = {
    draft: '草稿', pending: '待审核', published: '已发布',
    archived: '已归档', recycled: '已回收'
  }
  return map[status] || status
}

function statusType(status: string) {
  const map: Record<string, string> = {
    draft: 'info', pending: 'warning', published: 'success',
    archived: '', recycled: 'danger'
  }
  return map[status] || ''
}

function formatDate(date: string | Date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString()
}

async function loadSites() {
  try {
    siteList.value = await request.get('/sites')
  } catch (e) {
    console.log('加载站点失败')
  }
}

async function loadCategories() {
  if (!query.siteId) {
    categoryList.value = []
    return
  }
  try {
    const list = await request.get(`/categories?siteId=${query.siteId}`)
    categoryList.value = buildTree(list)
  } catch (e) {
    console.log('加载栏目失败')
  }
}

async function loadContents() {
  loading.value = true
  try {
    const params: any = { ...query }
    if (!params.siteId) delete params.siteId
    if (!params.categoryId) delete params.categoryId
    if (!params.publishStatus) delete params.publishStatus
    if (!params.keyword) delete params.keyword

    const result: any = await request.get('/contents', { params })
    contentList.value = result.items || []
    total.value = result.total || 0
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  query.page = 1
  loadContents()
}

function resetForm() {
  form.id = ''
  form.siteId = query.siteId
  form.categoryId = query.categoryId || ''
  form.title = ''
  form.contentType = 'news'
  form.publishStatus = 'draft'
  form.author = userStore.userInfo?.nickname || ''
  form.summary = ''
  form.content = ''
  form.coverUrl = ''
  form.redirectUrl = ''
  form.isTop = false
  form.isRecommend = false
  form.isHot = false
}

function handleCreate() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  form.id = row.id
  form.siteId = row.siteId
  form.categoryId = row.categoryId || ''
  form.title = row.title
  form.contentType = row.contentType
  form.publishStatus = row.publishStatus
  form.author = row.author || ''
  form.summary = row.summary || ''
  form.content = row.content || ''
  form.coverUrl = row.coverUrl || ''
  form.redirectUrl = row.redirectUrl || ''
  form.isTop = row.isTop
  form.isRecommend = row.isRecommend
  form.isHot = row.isHot
  dialogVisible.value = true
}

async function handlePublish(row: any) {
  await request.patch(`/contents/${row.id}/publish`)
  ElMessage.success('发布成功')
  loadContents()
}

async function handleDraft(row: any) {
  await request.patch(`/contents/${row.id}/draft`)
  ElMessage.success('已撤回')
  loadContents()
}

async function handleCopy(row: any) {
  await request.post(`/contents/${row.id}/copy`)
  ElMessage.success('复制成功')
  loadContents()
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定要删除内容"${row.title}"吗？`, '提示', {
    type: 'warning'
  })
  
  await request.delete(`/contents/${row.id}`)
  ElMessage.success('删除成功')
  loadContents()
}

async function handleSave(publish: boolean) {
  if (!formRef.value) return
  
  await formRef.value.validate()
  
  submitting.value = true
  try {
    const data: any = { ...form }
    if (publish) {
      data.publishStatus = 'published'
    }
    if (!data.categoryId) delete data.categoryId
    
    if (isEdit.value) {
      await request.put(`/contents/${form.id}`, data)
      ElMessage.success('更新成功')
    } else {
      await request.post('/contents', data)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadContents()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadSites()
})

watch(siteList, (list) => {
  const siteIdFromQuery = route.query.siteId as string
  if (siteIdFromQuery && list.some(s => s.id === siteIdFromQuery)) {
    query.siteId = siteIdFromQuery
  } else if (list.length > 0 && !query.siteId) {
    query.siteId = list[0].id
  }
  if (query.siteId) {
    loadCategories()
    loadContents()
  }
})

watch(() => query.siteId, () => {
  query.categoryId = ''
  loadCategories()
})
</script>

<style lang="scss" scoped>
.contents {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-actions {
      display: flex;
      align-items: center;
    }
  }
  
  .content-title {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}
</style>
