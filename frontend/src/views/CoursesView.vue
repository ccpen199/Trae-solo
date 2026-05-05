<template>
  <div class="page-container courses-page">
    <el-row :gutter="24">
      <el-col :span="6">
        <el-card shadow="hover" class="category-card">
          <template #header>
            <h3>课程分类</h3>
          </template>
          <el-menu
            :default-active="activeCategory"
            class="category-menu"
            @select="handleCategorySelect"
          >
            <el-menu-item index="all">
              <el-icon><Grid /></el-icon>
              <span>全部课程</span>
            </el-menu-item>
            <el-sub-menu
              v-for="category in categories"
              :key="category.id"
              :index="category.id"
            >
              <template #title>
                <el-icon><FolderOpened /></el-icon>
                <span>{{ category.name }}</span>
              </template>
              <el-menu-item
                v-for="child in category.children"
                :key="child.id"
                :index="child.id"
              >
                {{ child.name }}
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
        </el-card>
      </el-col>

      <el-col :span="18">
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索课程..."
            prefix-icon="Search"
            class="search-input"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button type="primary" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>

          <el-select v-model="sortBy" placeholder="排序方式" @change="handleSort">
            <el-option label="最新发布" value="newest" />
            <el-option label="最受欢迎" value="popular" />
            <el-option label="价格从低到高" value="price_asc" />
            <el-option label="价格从高到低" value="price_desc" />
          </el-select>
        </div>

        <div class="section-header">
          <h2>{{ currentCategoryName || '全部课程' }}</h2>
          <span class="total-count">共 {{ total }} 门课程</span>
        </div>

        <el-empty v-if="courses.length === 0 && !loading" description="暂无课程" />

        <div v-else class="card-grid">
          <el-card
            v-for="course in courses"
            :key="course.id"
            shadow="hover"
            class="course-card"
            @click="goToCourse(course.id)"
          >
            <template #header>
              <div class="course-cover">
                <img v-if="course.cover" :src="course.cover" :alt="course.title" />
                <div v-else class="course-cover-placeholder">
                  <el-icon :size="48"><VideoCamera /></el-icon>
                </div>
                <div class="course-badge" v-if="course.isFeatured">精选</div>
              </div>
            </template>
            <div class="course-info">
              <h3 class="course-title">{{ course.title }}</h3>
              <p class="course-desc">{{ course.description?.slice(0, 50) }}...</p>
              <div class="course-meta">
                <span class="category">{{ course.category?.name }}</span>
                <span class="students">
                  <el-icon><User /></el-icon>
                  {{ course.studentCount }} 人学习
                </span>
              </div>
              <div class="course-footer">
                <span class="price">
                  <template v-if="course.price > 0">
                    <span class="current">¥{{ course.price }}</span>
                    <span class="original" v-if="course.originalPrice">¥{{ course.originalPrice }}</span>
                  </template>
                  <span class="free" v-else>免费</span>
                </span>
                <span class="duration">{{ course.duration }} 课时</span>
              </div>
            </div>
          </el-card>
        </div>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[12, 24, 48]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchCourses"
            @current-change="fetchCourses"
          />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/request'

const router = useRouter()

const categories = ref<any[]>([])
const courses = ref<any[]>([])
const loading = ref(false)
const activeCategory = ref('all')
const searchKeyword = ref('')
const sortBy = ref('newest')
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

const currentCategoryName = computed(() => {
  if (activeCategory.value === 'all') return ''
  const findCategory = (list: any[], id: string): string => {
    for (const item of list) {
      if (item.id === id) return item.name
      if (item.children) {
        const found = findCategory(item.children, id)
        if (found) return found
      }
    }
    return ''
  }
  return findCategory(categories.value, activeCategory.value)
})

const fetchCategories = async () => {
  try {
    const response = await api.get('/courses/categories/all')
    if (response.data.success) {
      categories.value = response.data.data || []
    }
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

const fetchCourses = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: page.value,
      pageSize: pageSize.value,
      sort: sortBy.value
    }

    if (activeCategory.value !== 'all') {
      params.categoryId = activeCategory.value
    }

    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }

    const response = await api.get('/courses/list', { params })
    if (response.data.success) {
      const data = response.data.data
      courses.value = data.list || []
      total.value = data.total || 0
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleCategorySelect = (index: string) => {
  activeCategory.value = index
  page.value = 1
  fetchCourses()
}

const handleSearch = () => {
  page.value = 1
  fetchCourses()
}

const handleSort = () => {
  page.value = 1
  fetchCourses()
}

const goToCourse = (id: string) => {
  router.push(`/courses/${id}`)
}

onMounted(() => {
  fetchCategories()
  fetchCourses()
})
</script>

<style lang="scss">
.courses-page {
  .category-card {
    h3 {
      margin: 0;
      font-size: 16px;
    }

    .category-menu {
      border-right: none;

      .el-menu-item,
      .el-sub-menu__title {
        height: 44px;
        line-height: 44px;
      }
    }
  }

  .search-bar {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;

    .search-input {
      flex: 1;
    }
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      font-size: 20px;
      margin: 0;
    }

    .total-count {
      color: #909399;
      font-size: 14px;
    }
  }

  .course-card {
    cursor: pointer;

    .course-cover {
      height: 160px;
      overflow: hidden;
      border-radius: 4px;
      margin: -20px -20px 0;
      position: relative;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .course-cover-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
      }

      .course-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        background: #F56C6C;
        color: #fff;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
    }

    .course-info {
      .course-title {
        font-size: 16px;
        margin: 12px 0 8px;
        color: #303133;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .course-desc {
        font-size: 13px;
        color: #909399;
        margin-bottom: 12px;
        line-height: 1.5;
      }

      .course-meta {
        display: flex;
        gap: 16px;
        margin-bottom: 12px;

        span {
          font-size: 12px;
          color: #909399;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      .course-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .price {
          .current {
            font-size: 18px;
            color: #F56C6C;
            font-weight: 600;
          }

          .original {
            font-size: 12px;
            color: #909399;
            text-decoration: line-through;
            margin-left: 6px;
          }

          .free {
            font-size: 18px;
            color: #67C23A;
            font-weight: 600;
          }
        }

        .duration {
          font-size: 13px;
          color: #909399;
        }
      }
    }
  }

  .pagination-container {
    margin-top: 32px;
    display: flex;
    justify-content: center;
  }
}
</style>
