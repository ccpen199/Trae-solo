<template>
  <div class="favorites-page">
    <div class="container">
    <div class="page-header">
      <h1>我的收藏</h1>
      <p class="subtitle">管理您收藏的资源</p>
    </div>

    <div class="favorites-list" v-loading="loading">
      <div
        v-for="item in favorites"
        :key="item.id"
        class="favorite-item"
      >
        <div class="item-content" @click="$router.push(`/resources/${item.resourceId}`)">
          <div class="item-cover" v-if="item.resource?.coverImage">
            <img :src="item.resource?.coverImage" alt="cover" />
          </div>
          <div class="item-info">
            <h3 class="item-title">{{ item.resource?.title }}</h3>
            <p class="item-desc">{{ item.resource?.description || '暂无描述' }}</p>
            <div class="item-meta">
              <span>{{ item.resource?.author?.nickname || item.resource?.author?.username }}</span>
              <span>{{ formatTime(item.createdAt) }}</span>
            </div>
          </div>
        </div>
        <div class="item-actions">
          <el-button type="danger" text @click="handleRemove(item.id)">
            <el-icon><Delete /></el-icon>
            取消收藏
          </el-button>
        </div>
      </div>

      <el-empty v-if="!loading && favorites.length === 0" description="暂无收藏">
        <template #description>
          还没有收藏任何资源
        </template>
      </el-empty>
    </div>

    <div class="pagination-wrap" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[12, 24, 48]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchFavorites"
        @current-change="fetchFavorites"
      />
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFavorites, removeFavorite } from '@/api'
import { Delete } from '@element-plus/icons-vue'

const loading = ref(false)
const favorites = ref([])

const pagination = reactive({
  page: 1,
  limit: 12,
  total: 0
})

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleDateString('zh-CN')
}

const fetchFavorites = async () => {
  loading.value = true
  try {
    const res = await getFavorites({
      page: pagination.page,
      limit: pagination.limit
    })
    favorites.value = res.data?.favorites || []
    pagination.total = res.data?.pagination?.total || 0
  } catch (e) {
    console.error('Fetch favorites error:', e)
  } finally {
    loading.value = false
  }
}

const handleRemove = async (id) => {
  try {
    await ElMessageBox.confirm('确定要取消收藏吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await removeFavorite(id)
    ElMessage.success('已取消收藏')
    fetchFavorites()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Remove favorite error:', e)
    }
  }
}

onMounted(() => {
  fetchFavorites()
})
</script>

<style scoped>
.favorites-page {
  min-height: calc(100vh - 64px);
  padding: 40px 0;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.page-header .subtitle {
  color: #666;
  font-size: 15px;
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.favorite-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
  border: 1px solid #e4e7ed;
}

.favorite-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.item-content {
  display: flex;
  gap: 20px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.item-cover {
  width: 120px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.item-actions {
  flex-shrink: 0;
  margin-left: 20px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}
</style>
