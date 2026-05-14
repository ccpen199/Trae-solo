<template>
  <div class="categories-page">
    <div class="page-header">
      <h2 class="page-title">分类管理</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>分类列表</span>
              <el-button type="primary" size="small" @click="openCategoryDialog">
                <el-icon><Plus /></el-icon>
                新建
              </el-button>
            </div>
          </template>
          
          <el-skeleton v-if="categoryLoading" animated :count="3" />
          
          <template v-else-if="categories.length === 0">
            <el-empty description="暂无分类" />
          </template>
          
          <template v-else>
            <el-table :data="categories" stripe>
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="name" label="名称" />
              <el-table-column prop="level" label="层级" width="100">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.level === 1 ? '一级' : '二级' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="sort" label="排序" width="100" />
            </el-table>
          </template>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>叶子节点</span>
              <el-button type="primary" size="small" @click="openLeafDialog">
                <el-icon><Plus /></el-icon>
                新建
              </el-button>
            </div>
          </template>
          
          <el-skeleton v-if="leafLoading" animated :count="3" />
          
          <template v-else-if="leafNodes.length === 0">
            <el-empty description="暂无叶子节点" />
          </template>
          
          <template v-else>
            <el-table :data="leafNodes" stripe>
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="name" label="名称" />
              <el-table-column prop="category_id" label="分类ID" width="100" />
              <el-table-column prop="external_id" label="外部ID" />
            </el-table>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="categoryDialogVisible"
      title="新建分类"
      width="400px"
    >
      <el-form :model="categoryForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="父级">
          <el-select v-model="categoryForm.parent_id" placeholder="无（一级分类）" clearable style="width: 100%">
            <el-option
              v-for="cat in categories.filter(c => c.level === 1)"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCategorySubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="leafDialogVisible"
      title="新建叶子节点"
      width="400px"
    >
      <el-form :model="leafForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="leafForm.name" placeholder="请输入节点名称" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="leafForm.category_id" placeholder="请选择分类" clearable style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="外部ID">
          <el-input v-model="leafForm.external_id" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="leafDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleLeafSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { categoryApi } from '@/api/category'

const categoryLoading = ref(false)
const leafLoading = ref(false)
const categoryDialogVisible = ref(false)
const leafDialogVisible = ref(false)
const submitting = ref(false)

const categories = ref([])
const leafNodes = ref([])

const categoryForm = reactive({
  name: '',
  parent_id: null,
  sort: 0
})

const leafForm = reactive({
  name: '',
  category_id: null,
  external_id: ''
})

const fetchCategories = async () => {
  categoryLoading.value = true
  try {
    const res = await categoryApi.getList()
    categories.value = res?.data || []
  } catch (err) {
    console.error('获取分类失败:', err)
  } finally {
    categoryLoading.value = false
  }
}

const fetchLeafNodes = async () => {
  leafLoading.value = true
  try {
    const res = await categoryApi.getLeafNodes()
    leafNodes.value = res?.data || []
  } catch (err) {
    console.error('获取叶子节点失败:', err)
  } finally {
    leafLoading.value = false
  }
}

const openCategoryDialog = () => {
  categoryForm.name = ''
  categoryForm.parent_id = null
  categoryForm.sort = 0
  categoryDialogVisible.value = true
}

const openLeafDialog = () => {
  leafForm.name = ''
  leafForm.category_id = categories.value[0]?.id || null
  leafForm.external_id = ''
  leafDialogVisible.value = true
}

const handleCategorySubmit = async () => {
  if (!categoryForm.name.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }

  submitting.value = true
  try {
    await categoryApi.create(categoryForm)
    ElMessage.success('创建成功')
    categoryDialogVisible.value = false
    fetchCategories()
  } catch (err) {
    console.error('创建失败:', err)
  } finally {
    submitting.value = false
  }
}

const handleLeafSubmit = async () => {
  if (!leafForm.name.trim()) {
    ElMessage.warning('请输入节点名称')
    return
  }

  submitting.value = true
  try {
    await categoryApi.createLeafNode(leafForm)
    ElMessage.success('创建成功')
    leafDialogVisible.value = false
    fetchLeafNodes()
  } catch (err) {
    console.error('创建失败:', err)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchCategories()
  fetchLeafNodes()
})
</script>

<style scoped>
.page-title {
  margin: 0 0 24px 0;
  font-size: 22px;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
