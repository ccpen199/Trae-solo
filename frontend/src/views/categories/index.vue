<template>
  <div class="categories">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>栏目管理</span>
          <div class="header-actions">
            <el-select v-model="currentSiteId" placeholder="请选择站点" @change="handleSiteChange" clearable style="width: 200px; margin-right: 10px">
              <el-option v-for="site in siteList" :key="site.id" :label="site.name" :value="site.id" />
            </el-select>
            <el-button type="primary" @click="handleCreate" :disabled="!currentSiteId">
              <el-icon><Plus /></el-icon>
              新建栏目
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="categoryList"
        v-loading="loading"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" label="栏目名称" min-width="200">
          <template #default="{ row }">
            <div class="category-name">
              <el-icon><Folder /></el-icon>
              <span>{{ row.name }}</span>
              <el-tag v-if="row.code" size="small" type="info" style="margin-left: 8px">{{ row.code }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="allowedContentTypes" label="允许内容类型" min-width="180">
          <template #default="{ row }">
            <el-tag v-for="type in row.allowedContentTypes" :key="type" size="small" style="margin-right: 5px">
              {{ contentTypeName(type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isNavigation" label="导航显示" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isNavigation ? 'success' : 'info'" size="small">
              {{ row.isNavigation ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleCreateChild(row)">添加子栏目</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑栏目' : isChild ? '新建子栏目' : '新建栏目'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="栏目名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入栏目名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="栏目代码" prop="code">
              <el-input v-model="form.code" placeholder="请输入栏目代码(英文)" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="父级栏目" prop="parentId">
              <el-tree-select
                v-model="form.parentId"
                :data="categoryOptions"
                :props="{ label: 'name', value: 'id' }"
                placeholder="请选择父级栏目"
                clearable
                check-strictly
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内容类型" prop="allowedContentTypes">
              <el-select v-model="form.allowedContentTypes" multiple placeholder="请选择允许的内容类型" style="width: 100%">
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
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="列表模板">
              <el-input v-model="form.templateList" placeholder="如: list_news.html" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="详情模板">
              <el-input v-model="form.templateDetail" placeholder="如: detail_news.html" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sortOrder" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设置">
              <el-checkbox v-model="form.isActive" style="margin-right: 15px">启用</el-checkbox>
              <el-checkbox v-model="form.isNavigation">导航显示</el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="栏目描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入栏目描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { request } from '@/utils/request'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const route = useRoute()

const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const isChild = ref(false)
const submitting = ref(false)
const siteList = ref<any[]>([])
const categoryList = ref<any[]>([])
const currentSiteId = ref<string>('')
const formRef = ref<FormInstance>()

const form = reactive({
  id: '',
  siteId: '',
  name: '',
  code: '',
  parentId: '',
  allowedContentTypes: ['news'] as string[],
  templateList: '',
  templateDetail: '',
  sortOrder: 0,
  isActive: true,
  isNavigation: true,
  description: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入栏目名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入栏目代码', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_-]*$/, message: '栏目代码必须以字母开头', trigger: 'blur' }
  ]
}

const categoryOptions = computed(() => {
  return buildTreeOptions(categoryList.value)
})

function buildTreeOptions(items: any[], excludeId?: string): any[] {
  return items
    .filter(item => item.id !== excludeId)
    .map(item => ({
      ...item,
      children: item.children ? buildTreeOptions(item.children, excludeId) : undefined
    }))
}

function contentTypeName(type: string) {
  const map: Record<string, string> = {
    news: '新闻',
    product: '产品',
    document: '文档',
    download: '下载',
    image: '图片',
    video: '视频',
    page: '页面'
  }
  return map[type] || type
}

async function loadSites() {
  try {
    siteList.value = await request.get('/sites')
  } catch (e) {
    console.log('加载站点失败')
  }
}

async function loadCategories() {
  if (!currentSiteId.value) {
    categoryList.value = []
    return
  }
  
  loading.value = true
  try {
    const list = await request.get(`/categories?siteId=${currentSiteId.value}&includeInactive=true`)
    categoryList.value = buildTree(list)
  } finally {
    loading.value = false
  }
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

function handleSiteChange() {
  categoryList.value = []
  loadCategories()
}

function resetForm() {
  form.id = ''
  form.siteId = currentSiteId.value
  form.name = ''
  form.code = ''
  form.parentId = ''
  form.allowedContentTypes = ['news']
  form.templateList = ''
  form.templateDetail = ''
  form.sortOrder = 0
  form.isActive = true
  form.isNavigation = true
  form.description = ''
}

function handleCreate() {
  isEdit.value = false
  isChild.value = false
  resetForm()
  dialogVisible.value = true
}

function handleCreateChild(row: any) {
  isEdit.value = false
  isChild.value = true
  resetForm()
  form.parentId = row.id
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  isChild.value = false
  form.id = row.id
  form.siteId = row.siteId
  form.name = row.name
  form.code = row.code
  form.parentId = row.parentId || ''
  form.allowedContentTypes = row.allowedContentTypes || ['news']
  form.templateList = row.templateList || ''
  form.templateDetail = row.templateDetail || ''
  form.sortOrder = row.sortOrder || 0
  form.isActive = row.isActive
  form.isNavigation = row.isNavigation
  form.description = row.description || ''
  dialogVisible.value = true
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定要删除栏目"${row.name}"吗？`, '提示', {
    type: 'warning'
  })
  
  await request.delete(`/categories/${row.id}`)
  ElMessage.success('删除成功')
  loadCategories()
}

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate()
  
  submitting.value = true
  try {
    const data: any = { 
      ...form, 
      siteId: currentSiteId.value 
    }
    if (!data.parentId) delete data.parentId
    
    if (isEdit.value) {
      await request.put(`/categories/${form.id}`, data)
      ElMessage.success('更新成功')
    } else {
      await request.post('/categories', data)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadCategories()
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
    currentSiteId.value = siteIdFromQuery
  } else if (list.length > 0 && !currentSiteId.value) {
    currentSiteId.value = list[0].id
  }
  if (currentSiteId.value) {
    loadCategories()
  }
})

watch(currentSiteId, () => {
  loadCategories()
})
</script>

<style lang="scss" scoped>
.categories {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-actions {
      display: flex;
      align-items: center;
    }
  }
  
  .category-name {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}
</style>
