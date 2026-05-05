<template>
  <div class="admin-categories-page">
    <div class="page-header">
      <h2>分类管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增分类
      </el-button>
    </div>

    <el-table :data="categories" v-loading="loading" stripe style="width: 100%">
      <el-table-column prop="name" label="分类名称" width="150" />
      <el-table-column prop="slug" label="标识" width="120" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
            {{ scope.row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="primary" size="small" text @click="handleEdit(scope.row)">
            编辑
          </el-button>
          <el-button 
            :type="scope.row.status === 'active' ? 'warning' : 'success'" 
            size="small"
            text
            @click="handleToggle(scope.row)"
          >
            {{ scope.row.status === 'active' ? '禁用' : '启用' }}
          </el-button>
          <el-button type="danger" size="small" text @click="handleDelete(scope.row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="showDialog"
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="标识" prop="slug">
          <el-input v-model="form.slug" placeholder="请输入唯一标识（英文）" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const saving = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const categories = ref([
  { id: '1', name: '生活', slug: 'life', description: '生活相关资源分享', sortOrder: 1, status: 'active' },
  { id: '2', name: '新闻', slug: 'news', description: '新闻资讯', sortOrder: 2, status: 'active' },
  { id: '3', name: '教育', slug: 'education', description: '教育学习资源', sortOrder: 3, status: 'active' },
  { id: '4', name: '数码', slug: 'digital', description: '数码产品评测分享', sortOrder: 4, status: 'active' },
  { id: '5', name: '娱乐', slug: 'entertainment', description: '娱乐相关内容', sortOrder: 5, status: 'active' },
  { id: '6', name: '科技', slug: 'tech', description: '科技前沿资讯', sortOrder: 6, status: 'active' },
])

const form = reactive({
  id: '',
  name: '',
  slug: '',
  description: '',
  sortOrder: 0
})

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  slug: [{ required: true, message: '请输入标识', trigger: 'blur' }]
}

const handleAdd = () => {
  isEdit.value = false
  form.id = ''
  form.name = ''
  form.slug = ''
  form.description = ''
  form.sortOrder = 0
  showDialog.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.id = row.id
  form.name = row.name
  form.slug = row.slug
  form.description = row.description
  form.sortOrder = row.sortOrder
  showDialog.value = true
}

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  setTimeout(() => {
    if (isEdit.value) {
      const item = categories.value.find(c => c.id === form.id)
      if (item) {
        item.name = form.name
        item.slug = form.slug
        item.description = form.description
        item.sortOrder = form.sortOrder
      }
      ElMessage.success('更新成功')
    } else {
      categories.value.push({
        id: Date.now().toString(),
        name: form.name,
        slug: form.slug,
        description: form.description,
        sortOrder: form.sortOrder,
        status: 'active'
      })
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    saving.value = false
  }, 500)
}

const handleToggle = (row) => {
  row.status = row.status === 'active' ? 'inactive' : 'active'
  ElMessage.success(row.status === 'active' ? '已启用' : '已禁用')
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该分类吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const index = categories.value.findIndex(c => c.id === row.id)
    if (index > -1) categories.value.splice(index, 1)
    ElMessage.success('已删除')
  } catch (e) {}
}

onMounted(() => {
})
</script>

<style scoped>
.admin-categories-page {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}
</style>
