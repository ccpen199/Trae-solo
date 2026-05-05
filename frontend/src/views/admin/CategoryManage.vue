<template>
  <div class="category-manage">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span>大类管理</span>
              <el-button type="primary" size="small" @click="openCategoryDialog">
                <el-icon><Plus /></el-icon>
                新增大类
              </el-button>
            </div>
          </template>
          
          <el-table :data="categories" v-loading="loading" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="categoryName" label="名称" width="150" />
            <el-table-column prop="categoryCode" label="编码" width="120" />
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="small">
                  {{ scope.row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button 
                  type="primary" 
                  link 
                  size="small"
                  @click="editCategory(scope.row)"
                >
                  编辑
                </el-button>
                <el-button 
                  type="danger" 
                  link 
                  size="small"
                  @click="deleteCategory(scope.row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span>小类管理</span>
              <el-button 
                type="primary" 
                size="small" 
                :disabled="!selectedCategory"
                @click="openSubCategoryDialog"
              >
                <el-icon><Plus /></el-icon>
                新增小类
              </el-button>
            </div>
          </template>
          
          <el-empty 
            v-if="!selectedCategory" 
            description="请先选择一个大类"
          />
          
          <template v-else>
            <div class="selected-info">
              <span>当前大类：</span>
              <el-tag type="primary">{{ selectedCategory.categoryName }}</el-tag>
            </div>
            
            <el-table 
              :data="selectedCategory.subCategories" 
              v-loading="subLoading" 
              stripe
              style="margin-top: 15px;"
            >
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="subCategoryName" label="名称" width="150" />
              <el-table-column prop="subCategoryCode" label="编码" width="120" />
              <el-table-column label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="small">
                    {{ scope.row.status === 1 ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200">
                <template #default="scope">
                  <el-button 
                    type="primary" 
                    link 
                    size="small"
                    @click="editSubCategory(scope.row)"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    type="danger" 
                    link 
                    size="small"
                    @click="deleteSubCategory(scope.row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-card>
      </el-col>
    </el-row>
    
    <el-dialog 
      v-model="categoryDialogVisible" 
      :title="editingCategory ? '编辑大类' : '新增大类'"
      width="500px"
    >
      <el-form ref="categoryFormRef" :model="categoryForm" :rules="categoryRules" label-width="100px">
        <el-form-item label="名称" prop="categoryName">
          <el-input v-model="categoryForm.categoryName" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="编码" prop="categoryCode">
          <el-input v-model="categoryForm.categoryCode" placeholder="请输入编码（英文）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="categoryForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入描述（可选）"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="categoryForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCategory">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog 
      v-model="subCategoryDialogVisible" 
      :title="editingSubCategory ? '编辑小类' : '新增小类'"
      width="500px"
    >
      <el-form ref="subCategoryFormRef" :model="subCategoryForm" :rules="subCategoryRules" label-width="100px">
        <el-form-item label="大类">
          <el-tag type="info">{{ selectedCategory?.categoryName }}</el-tag>
        </el-form-item>
        <el-form-item label="名称" prop="subCategoryName">
          <el-input v-model="subCategoryForm.subCategoryName" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="编码" prop="subCategoryCode">
          <el-input v-model="subCategoryForm.subCategoryCode" placeholder="请输入编码（英文）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="subCategoryForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入描述（可选）"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="subCategoryForm.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="subCategoryForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subCategoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSubCategory">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getAllAdminCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory as deleteCategoryApi,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory as deleteSubCategoryApi
} from '@/api/category'

const loading = ref(false)
const subLoading = ref(false)
const categories = ref([])
const selectedCategoryId = ref(null)

const selectedCategory = computed(() => {
  return categories.value.find(c => c.id === selectedCategoryId.value)
})

const categoryDialogVisible = ref(false)
const editingCategory = ref(null)
const categoryFormRef = ref(null)
const categoryForm = reactive({
  id: null,
  categoryName: '',
  categoryCode: '',
  description: '',
  sort: 0,
  status: 1
})

const categoryRules = {
  categoryName: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  categoryCode: [{ required: true, message: '请输入编码', trigger: 'blur' }]
}

const subCategoryDialogVisible = ref(false)
const editingSubCategory = ref(null)
const subCategoryFormRef = ref(null)
const subCategoryForm = reactive({
  id: null,
  categoryId: null,
  subCategoryName: '',
  subCategoryCode: '',
  description: '',
  sort: 0,
  status: 1
})

const subCategoryRules = {
  subCategoryName: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  subCategoryCode: [{ required: true, message: '请输入编码', trigger: 'blur' }]
}

const loadCategories = async () => {
  loading.value = true
  try {
    const res = await getAllAdminCategories()
    categories.value = res.data
  } catch (error) {
    console.error('加载分类失败:', error)
  } finally {
    loading.value = false
  }
}

const openCategoryDialog = (category = null) => {
  editingCategory.value = category
  if (category) {
    categoryForm.id = category.id
    categoryForm.categoryName = category.categoryName
    categoryForm.categoryCode = category.categoryCode
    categoryForm.description = category.description || ''
    categoryForm.sort = category.sort || 0
    categoryForm.status = category.status
  } else {
    categoryForm.id = null
    categoryForm.categoryName = ''
    categoryForm.categoryCode = ''
    categoryForm.description = ''
    categoryForm.sort = 0
    categoryForm.status = 1
  }
  categoryDialogVisible.value = true
}

const submitCategory = async () => {
  const valid = await categoryFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  try {
    if (editingCategory.value) {
      await updateCategory(categoryForm.id, categoryForm)
      ElMessage.success('更新成功')
    } else {
      await createCategory(categoryForm)
      ElMessage.success('创建成功')
    }
    categoryDialogVisible.value = false
    loadCategories()
  } catch (error) {
    console.error('提交失败:', error)
  }
}

const editCategory = (category) => {
  openCategoryDialog(category)
}

const deleteCategory = async (category) => {
  try {
    await ElMessageBox.confirm('确定要删除这个大类吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteCategoryApi(category.id)
    ElMessage.success('删除成功')
    
    if (selectedCategoryId.value === category.id) {
      selectedCategoryId.value = null
    }
    
    loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

const openSubCategoryDialog = (subCategory = null) => {
  editingSubCategory.value = subCategory
  if (subCategory) {
    subCategoryForm.id = subCategory.id
    subCategoryForm.categoryId = subCategory.categoryId
    subCategoryForm.subCategoryName = subCategory.subCategoryName
    subCategoryForm.subCategoryCode = subCategory.subCategoryCode
    subCategoryForm.description = subCategory.description || ''
    subCategoryForm.sort = subCategory.sort || 0
    subCategoryForm.status = subCategory.status
  } else {
    subCategoryForm.id = null
    subCategoryForm.categoryId = selectedCategoryId.value
    subCategoryForm.subCategoryName = ''
    subCategoryForm.subCategoryCode = ''
    subCategoryForm.description = ''
    subCategoryForm.sort = 0
    subCategoryForm.status = 1
  }
  subCategoryDialogVisible.value = true
}

const submitSubCategory = async () => {
  const valid = await subCategoryFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  try {
    if (editingSubCategory.value) {
      await updateSubCategory(subCategoryForm.id, subCategoryForm)
      ElMessage.success('更新成功')
    } else {
      await createSubCategory(subCategoryForm)
      ElMessage.success('创建成功')
    }
    subCategoryDialogVisible.value = false
    loadCategories()
  } catch (error) {
    console.error('提交失败:', error)
  }
}

const editSubCategory = (subCategory) => {
  openSubCategoryDialog(subCategory)
}

const deleteSubCategory = async (subCategory) => {
  try {
    await ElMessageBox.confirm('确定要删除这个小类吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteSubCategoryApi(subCategory.id)
    ElMessage.success('删除成功')
    loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.category-manage {
  padding: 0;
}

.list-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
