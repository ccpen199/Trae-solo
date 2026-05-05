<template>
  <div class="libraries-page page-container">
    <div class="container">
      <div class="page-header">
        <h1>图书馆</h1>
        <p>发现身边的图书馆，探索知识的海洋</p>
      </div>

      <el-card class="filter-card">
        <el-form :inline="true" :model="filters">
          <el-form-item label="城市">
            <el-select v-model="filters.city" placeholder="全部城市" clearable>
              <el-option label="全部" value="" />
              <el-option label="北京" value="北京" />
              <el-option label="上海" value="上海" />
              <el-option label="广州" value="广州" />
              <el-option label="深圳" value="深圳" />
              <el-option label="杭州" value="杭州" />
            </el-select>
          </el-form-item>
          <el-form-item label="排序">
            <el-select v-model="filters.sortBy" placeholder="默认排序">
              <el-option label="评分最高" value="rating" />
              <el-option label="藏书最多" value="books" />
              <el-option label="人气最高" value="popular" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchLibraries">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <div v-loading="loading" class="libraries-grid">
        <div
          v-for="library in libraries"
          :key="library.id"
          class="library-item"
          @click="goToLibrary(library)"
        >
          <el-card shadow="hover" class="library-card">
            <div class="library-cover-wrapper">
              <img :src="library.coverImage" :alt="library.name" class="library-cover" />
              <div class="library-overlay">
                <el-tag v-if="library.isFeatured" type="warning" size="small">推荐</el-tag>
              </div>
            </div>
            <div class="library-info">
              <h3 class="library-name text-ellipsis">{{ library.name }}</h3>
              <p class="library-city">
                <el-icon><Location /></el-icon>
                {{ library.city }}
              </p>
              <p class="library-address text-ellipsis">{{ library.address }}</p>
              <div class="library-stats">
                <div class="rating">
                  <el-rate :model-value="library.rating" disabled size="small" />
                  <span class="rating-text">{{ library.rating }}</span>
                </div>
                <div class="book-count">
                  <el-icon><Reading /></el-icon>
                  {{ library.bookCount }} 藏书
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <el-empty v-if="!loading && libraries.length === 0" description="暂无图书馆数据" />

      <el-pagination
        v-if="pagination.total > 0"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[9, 18, 36]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchLibraries"
        @current-change="fetchLibraries"
        class="pagination"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import {
  Location,
  Reading
} from '@element-plus/icons-vue';

const router = useRouter();

const loading = ref(false);
const libraries = ref([]);
const filters = ref({
  city: '',
  sortBy: 'rating'
});
const pagination = ref({
  page: 1,
  pageSize: 9,
  total: 0
});

const fetchLibraries = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      sortBy: filters.value.sortBy
    };
    if (filters.value.city) {
      params.city = filters.value.city;
    }

    const res = await api.get('/libraries', { params });
    libraries.value = res.data.libraries || [];
    pagination.value.total = res.data.total || 0;
  } catch (error) {
    console.error('Failed to fetch libraries:', error);
  } finally {
    loading.value = false;
  }
};

const searchLibraries = () => {
  pagination.value.page = 1;
  fetchLibraries();
};

const resetFilters = () => {
  filters.value = {
    city: '',
    sortBy: 'rating'
  };
  searchLibraries();
};

const goToLibrary = (library) => {
  router.push(`/libraries/${library.id}`);
};

onMounted(() => {
  fetchLibraries();
});
</script>

<style scoped>
.libraries-page {
  padding-bottom: 40px;
}

.filter-card {
  margin-bottom: 24px;
}

.libraries-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.library-item {
  cursor: pointer;
}

.library-card {
  height: 100%;
}

.library-cover-wrapper {
  position: relative;
  margin: -20px -20px 16px -20px;
}

.library-cover {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 4px 4px 0 0;
}

.library-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
}

.library-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.library-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.library-city {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #409eff;
}

.library-address {
  font-size: 13px;
  color: #909399;
}

.library-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.rating {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rating-text {
  font-size: 13px;
  color: #f7ba2a;
  font-weight: 600;
}

.book-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
