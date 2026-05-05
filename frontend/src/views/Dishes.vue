<template>
  <div class="dishes-page">
    <el-card>
      <template #header>
        <div class="header-actions">
          <span>菜品管理</span>
          <el-button type="primary" @click="showAddDialog">添加菜品</el-button>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="菜品列表" name="list">
          <el-table :data="dishes" v-loading="loading" style="width: 100%">
            <el-table-column prop="name" label="菜品名称" />
            <el-table-column prop="category.name" label="分类" width="120">
              <template #default="{ row }">
                {{ row.category?.name || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="price" label="售价" width="100">
              <template #default="{ row }">¥{{ row.price }}</template>
            </el-table-column>
            <el-table-column prop="costPrice" label="成本价" width="100">
              <template #default="{ row }">¥{{ row.costPrice || 0 }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                  {{ row.status === 1 ? '上架' : row.status === 2 ? '售罄' : '下架' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="editDish(row)">编辑</el-button>
                <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">
                  {{ row.status === 1 ? '下架' : '上架' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            layout="total, prev, pager, next"
            @current-change="fetchDishes"
            style="margin-top: 20px; justify-content: flex-end"
          />
        </el-tab-pane>
        
        <el-tab-pane label="分类管理" name="categories">
          <el-button type="primary" @click="showAddCategory" style="margin-bottom: 15px">添加分类</el-button>
          <el-table :data="categories" style="width: 100%">
            <el-table-column prop="name" label="分类名称" />
            <el-table-column prop="sort" label="排序" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="editCategory(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteCategory(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const activeTab = ref('list')

const dishes = ref([])
const categories = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const fetchDishes = async () => {
  loading.value = true
  try {
    const res = await api.dish.getList({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    dishes.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Fetch dishes error:', error)
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const res = await api.dish.categories.getList()
    categories.value = res.data || []
  } catch (error) {
    console.error('Fetch categories error:', error)
  }
}

const showAddDialog = () => {
  ElMessage.info('添加菜品功能 - 可在此弹出对话框进行添加')
}

const editDish = (row) => {
  ElMessage.info(`编辑菜品: ${row.name}`)
}

const toggleStatus = async (row) => {
  try {
    const newStatus = row.status === 1 ? 0 : 1
    await api.dish.updateStatus(row.id, { status: newStatus })
    ElMessage.success(newStatus === 1 ? '上架成功' : '下架成功')
    fetchDishes()
  } catch (error) {
    console.error('Toggle status error:', error)
  }
}

const showAddCategory = () => {
  ElMessage.info('添加分类功能')
}

const editCategory = (row) => {
  ElMessage.info(`编辑分类: ${row.name}`)
}

const deleteCategory = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该分类吗？', '提示', {
      type: 'warning'
    })
    await api.dish.categories.delete(row.id)
    ElMessage.success('删除成功')
    fetchCategories()
  } catch {
    // 用户取消或操作失败
  }
}

onMounted(() => {
  fetchDishes()
  fetchCategories()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
