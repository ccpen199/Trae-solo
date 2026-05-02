<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/utils/api'

const loading = ref(false)
const categories = ref<any[]>([])
const menuItems = ref<any[]>([])
const activeCategory = ref<string | null>(null)

const searchQuery = ref('')
const filteredMenuItems = computed(() => {
  let items = menuItems.value
  if (activeCategory.value) {
    items = items.filter((item) => item.categoryId === activeCategory.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
    )
  }
  return items
})

const categoryOptions = computed(() => {
  return [
    { label: '全部分类', value: null },
    ...categories.value.map((c) => ({ label: c.name, value: c.id })),
  ]
})

const statusColors: Record<string, string> = {
  active: 'success',
  inactive: 'info',
  out_of_stock: 'danger',
}

const statusLabels: Record<string, string> = {
  active: '正常',
  inactive: '下架',
  out_of_stock: '沽清',
}

const fetchCategories = async () => {
  try {
    categories.value = await request.get('/menu/categories')
  } catch (error) {
    ElMessage.error('加载分类失败')
  }
}

const fetchMenuItems = async () => {
  loading.value = true
  try {
    menuItems.value = await request.get('/menu/items')
  } catch (error) {
    ElMessage.error('加载菜单失败')
  } finally {
    loading.value = false
  }
}

const toggleStatus = async (item: any, status: string) => {
  try {
    await request.put(`/menu/items/${item.id}`, { status })
    ElMessage.success('状态已更新')
    fetchMenuItems()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const markOutOfStock = async (item: any) => {
  try {
    await ElMessageBox.confirm(`确定要将菜品 "${item.name}" 标记为沽清吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await toggleStatus(item, 'out_of_stock')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  }
}

const markActive = async (item: any) => {
  try {
    await toggleStatus(item, 'active')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const markInactive = async (item: any) => {
  try {
    await ElMessageBox.confirm(`确定要将菜品 "${item.name}" 下架吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await toggleStatus(item, 'inactive')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  }
}

const getCategoryName = (categoryId: string) => {
  const category = categories.value.find((c) => c.id === categoryId)
  return category?.name || '未分类'
}

onMounted(() => {
  fetchCategories()
  fetchMenuItems()
})
</script>

<template>
  <div class="menu-page">
    <el-card class="header-card">
      <template #header>
        <div class="header-content">
          <span class="card-title">菜单管理</span>
          <div class="header-actions">
            <el-input
              v-model="searchQuery"
              placeholder="搜索菜品名称"
              clearable
              style="width: 200px; margin-right: 12px"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" size="small" @click="fetchMenuItems">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <div class="category-tabs">
        <el-radio-group v-model="activeCategory" size="large">
          <el-radio-button
            v-for="category in categoryOptions"
            :key="category.value || 'all'"
            :label="category.value"
          >
            {{ category.label }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </el-card>

    <el-card class="menu-card" v-loading="loading">
      <el-empty v-if="filteredMenuItems.length === 0" description="暂无菜品数据" />

      <el-row :gutter="20" v-else>
        <el-col :xs="12" :sm="8" :md="6" v-for="item in filteredMenuItems" :key="item.id">
          <el-card :class="['menu-item-card', `status-${item.status}`]" shadow="hover">
            <div class="item-image">
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.name"
                class="item-img"
              />
              <div v-else class="item-placeholder">
                <el-icon :size="48"><Food /></el-icon>
              </div>
              <el-tag
                v-if="item.status !== 'active'"
                :type="statusColors[item.status]"
                class="status-tag"
              >
                {{ statusLabels[item.status] }}
              </el-tag>
            </div>

            <div class="item-info">
              <div class="item-header">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-category">{{ getCategoryName(item.categoryId) }}</span>
              </div>
              <p class="item-desc" v-if="item.description">
                {{ item.description }}
              </p>
              <div class="item-footer">
                <span class="item-price">¥{{ item.price.toFixed(2) }}</span>
                <span v-if="item.memberPrice" class="item-member-price">
                  会员价: ¥{{ item.memberPrice.toFixed(2) }}
                </span>
              </div>
            </div>

            <div class="item-actions">
              <el-button
                v-if="item.status === 'active'"
                type="warning"
                size="small"
                @click="markOutOfStock(item)"
              >
                沽清
              </el-button>
              <el-button
                v-if="item.status === 'active'"
                type="info"
                size="small"
                @click="markInactive(item)"
              >
                下架
              </el-button>
              <el-button
                v-if="item.status === 'out_of_stock' || item.status === 'inactive'"
                type="success"
                size="small"
                @click="markActive(item)"
              >
                上架
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<style scoped>
.menu-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-card,
.menu-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.category-tabs {
  margin-top: 16px;
}

.menu-item-card {
  margin-bottom: 20px;
  border-radius: 12px;
  transition: all 0.3s;

  &.status-out_of_stock,
  &.status-inactive {
    opacity: 0.6;
  }
}

.item-image {
  position: relative;
  height: 160px;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #c0c4cc;
}

.status-tag {
  position: absolute;
  top: 8px;
  right: 8px;
}

.item-info {
  margin-bottom: 12px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.item-category {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.item-desc {
  font-size: 13px;
  color: #909399;
  margin: 8px 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-price {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}

.item-member-price {
  font-size: 12px;
  color: #67c23a;
}

.item-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
