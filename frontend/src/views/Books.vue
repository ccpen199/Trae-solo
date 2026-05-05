<template>
  <div class="books-page page-container">
    <div class="container">
      <div class="page-header">
        <h1>书籍推荐</h1>
        <p>发现好书，开启阅读之旅</p>
      </div>

      <el-card class="filter-card">
        <el-form :inline="true" :model="filters">
          <el-form-item label="分类">
            <el-select v-model="filters.category" placeholder="全部分类" clearable>
              <el-option label="全部" value="" />
              <el-option label="文学" value="文学" />
              <el-option label="小说" value="小说" />
              <el-option label="历史" value="历史" />
              <el-option label="科技" value="科技" />
              <el-option label="哲学" value="哲学" />
            </el-select>
          </el-form-item>
          <el-form-item label="排序">
            <el-select v-model="filters.sortBy" placeholder="默认排序">
              <el-option label="最新上架" value="newest" />
              <el-option label="评分最高" value="rating" />
              <el-option label="评论最多" value="comments" />
              <el-option label="阅读最多" value="reading" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchBooks">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <div v-loading="loading" class="books-grid">
        <div
          v-for="book in books"
          :key="book.id"
          class="book-item"
          @click="goToBook(book)"
        >
          <el-card shadow="hover" class="book-card">
            <div class="book-cover-wrapper">
              <img :src="book.coverImage" :alt="book.title" class="book-cover" />
              <div class="book-badges">
                <el-tag v-if="book.rating >= 4.5" type="danger" size="small">高分</el-tag>
                <el-tag v-if="book.newest" type="primary" size="small">新书</el-tag>
              </div>
            </div>
            <div class="book-info">
              <h3 class="book-title text-ellipsis">{{ book.title }}</h3>
              <p class="book-author text-ellipsis">{{ book.author }}</p>
              <p class="book-category">
                <el-tag size="small" effect="plain">{{ book.category || '综合' }}</el-tag>
              </p>
              <div class="book-stats">
                <div class="rating">
                  <el-rate :model-value="book.rating" disabled size="small" />
                  <span class="rating-text">{{ book.rating }}</span>
                </div>
                <div class="comment-count">
                  <el-icon><ChatDotRound /></el-icon>
                  {{ book.commentCount }}
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <el-empty v-if="!loading && books.length === 0" description="暂无书籍数据" />

      <el-pagination
        v-if="pagination.total > 0"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[12, 24, 48]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchBooks"
        @current-change="fetchBooks"
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
  ChatDotRound
} from '@element-plus/icons-vue';

const router = useRouter();

const loading = ref(false);
const books = ref([]);
const filters = ref({
  category: '',
  sortBy: 'newest'
});
const pagination = ref({
  page: 1,
  pageSize: 12,
  total: 0
});

const fetchBooks = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      sortBy: filters.value.sortBy
    };
    if (filters.value.category) {
      params.category = filters.value.category;
    }

    const res = await api.get('/books', { params });
    books.value = res.data.books || [];
    pagination.value.total = res.data.total || 0;
  } catch (error) {
    console.error('Failed to fetch books:', error);
  } finally {
    loading.value = false;
  }
};

const searchBooks = () => {
  pagination.value.page = 1;
  fetchBooks();
};

const resetFilters = () => {
  filters.value = {
    category: '',
    sortBy: 'newest'
  };
  searchBooks();
};

const goToBook = (book) => {
  router.push(`/books/${book.id}`);
};

onMounted(() => {
  fetchBooks();
});
</script>

<style scoped>
.books-page {
  padding-bottom: 40px;
}

.filter-card {
  margin-bottom: 24px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.book-item {
  cursor: pointer;
}

.book-card {
  height: 100%;
}

.book-cover-wrapper {
  position: relative;
  margin: -20px -20px 16px -20px;
}

.book-cover {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px 4px 0 0;
}

.book-badges {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.book-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.book-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.book-author {
  font-size: 13px;
  color: #909399;
}

.book-category {
  margin: 4px 0;
}

.book-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
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

.comment-count {
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
