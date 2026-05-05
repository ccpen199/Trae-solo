<template>
  <div class="page-container course-detail-page">
    <el-card v-loading="loading" shadow="never">
      <div class="course-header" v-if="course">
        <div class="course-cover">
          <img v-if="course.cover" :src="course.cover" :alt="course.title" />
          <div v-else class="cover-placeholder">
            <el-icon :size="80"><VideoCamera /></el-icon>
          </div>
        </div>
        <div class="course-info">
          <h1 class="course-title">{{ course.title }}</h1>
          <p class="course-desc">{{ course.description }}</p>
          <div class="course-meta">
            <span class="meta-item">
              <el-icon><User /></el-icon>
              {{ course.studentCount }} 人学习
            </span>
            <span class="meta-item">
              <el-icon><Clock /></el-icon>
              {{ course.duration }} 课时
            </span>
            <span class="meta-item">
              <el-icon><FolderOpened /></el-icon>
              {{ course.category?.name || '课程' }}
            </span>
          </div>
          <div class="course-price">
            <template v-if="course.price > 0">
              <span class="current-price">¥{{ course.price }}</span>
              <span class="original-price" v-if="course.originalPrice">原价 ¥{{ course.originalPrice }}</span>
            </template>
            <span class="free-price" v-else>免费学习</span>
          </div>
          <div class="course-actions">
            <el-button type="primary" size="large">
              {{ course.price > 0 ? '立即购买' : '开始学习' }}
            </el-button>
            <el-button size="large">
              <el-icon><Star /></el-icon>
              收藏课程
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="24" class="content-section">
      <el-col :span="18">
        <el-card shadow="never">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="课程介绍" name="intro">
              <div class="course-intro" v-if="course">
                <h3>课程简介</h3>
                <p>{{ course.description }}</p>

                <h3 class="mt-32">课程大纲</h3>
                <div class="course-outline">
                  <p v-if="course.outline">{{ course.outline }}</p>
                  <el-empty v-else description="暂无课程大纲" :image-size="80" />
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="相关课程" name="related">
              <div class="related-courses">
                <div class="card-grid">
                  <el-card
                    v-for="course in relatedCourses"
                    :key="course.id"
                    shadow="hover"
                    class="course-card"
                    @click="goToCourse(course.id)"
                  >
                    <template #header>
                      <div class="mini-cover">
                        <img v-if="course.cover" :src="course.cover" :alt="course.title" />
                        <div v-else class="mini-placeholder">
                          <el-icon :size="32"><VideoCamera /></el-icon>
                        </div>
                      </div>
                    </template>
                    <h4 class="mini-title">{{ course.title }}</h4>
                    <div class="mini-meta">
                      <span>{{ course.studentCount }} 人学习</span>
                      <span v-if="course.price > 0">¥{{ course.price }}</span>
                      <span v-else class="free">免费</span>
                    </div>
                  </el-card>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="never" class="sidebar-card">
          <template #header>
            <h3>讲师信息</h3>
          </template>
          <div class="teacher-info">
            <el-avatar :size="64">
              <el-icon :size="40"><User /></el-icon>
            </el-avatar>
            <div class="teacher-detail">
              <h4>张老师</h4>
              <p class="teacher-desc">资深前端架构师，10年开发经验</p>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="sidebar-card mt-20">
          <template #header>
            <h3>学习统计</h3>
          </template>
          <div class="stats-info">
            <div class="stat-item">
              <span class="stat-value">{{ course?.studentCount || 0 }}</span>
              <span class="stat-label">学习人数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ course?.duration || 0 }}</span>
              <span class="stat-label">课时数量</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/utils/request'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const course = ref<any>(null)
const activeTab = ref('intro')
const relatedCourses = ref<any[]>([])

const fetchCourseDetail = async () => {
  const courseId = route.params.id as string
  if (!courseId) return

  loading.value = true
  try {
    const response = await api.get(`/courses/${courseId}`)
    if (response.data.success) {
      course.value = response.data.data
    }
  } catch (error) {
    console.error('获取课程详情失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchRelatedCourses = async () => {
  try {
    const response = await api.get('/courses/featured?limit=4')
    if (response.data.success) {
      relatedCourses.value = response.data.data || []
    }
  } catch (error) {
    console.error('获取相关课程失败:', error)
  }
}

const goToCourse = (id: string) => {
  router.push(`/courses/${id}`)
}

onMounted(() => {
  fetchCourseDetail()
  fetchRelatedCourses()
})
</script>

<style lang="scss">
.course-detail-page {
  .course-header {
    display: flex;
    gap: 32px;
  }

  .course-cover {
    width: 420px;
    height: 280px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cover-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }
  }

  .course-info {
    flex: 1;

    .course-title {
      font-size: 24px;
      margin: 0 0 16px;
      color: #303133;
    }

    .course-desc {
      font-size: 14px;
      color: #606266;
      line-height: 1.8;
      margin-bottom: 20px;
    }

    .course-meta {
      display: flex;
      gap: 24px;
      margin-bottom: 20px;

      .meta-item {
        font-size: 14px;
        color: #909399;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .course-price {
      margin-bottom: 24px;

      .current-price {
        font-size: 32px;
        color: #F56C6C;
        font-weight: 600;
      }

      .original-price {
        font-size: 14px;
        color: #909399;
        text-decoration: line-through;
        margin-left: 12px;
      }

      .free-price {
        font-size: 32px;
        color: #67C23A;
        font-weight: 600;
      }
    }

    .course-actions {
      display: flex;
      gap: 16px;
    }
  }

  .content-section {
    margin-top: 24px;
  }

  .course-intro {
    padding: 16px 0;

    h3 {
      font-size: 18px;
      color: #303133;
      margin-bottom: 16px;
    }

    p {
      font-size: 14px;
      color: #606266;
      line-height: 1.8;
    }

    .course-outline {
      background: #f5f7fa;
      padding: 20px;
      border-radius: 8px;
    }

    .mt-32 {
      margin-top: 32px;
    }
  }

  .sidebar-card {
    .teacher-info {
      display: flex;
      gap: 16px;
      align-items: center;

      .teacher-detail {
        h4 {
          margin: 0 0 4px;
          font-size: 16px;
        }

        .teacher-desc {
          margin: 0;
          font-size: 13px;
          color: #909399;
        }
      }
    }

    .stats-info {
      display: flex;
      justify-content: space-around;
      text-align: center;

      .stat-item {
        .stat-value {
          display: block;
          font-size: 28px;
          font-weight: 600;
          color: #409EFF;
        }

        .stat-label {
          font-size: 13px;
          color: #909399;
        }
      }
    }

    .mt-20 {
      margin-top: 20px;
    }
  }

  .related-courses {
    .card-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .course-card {
      cursor: pointer;

      .mini-cover {
        height: 100px;
        overflow: hidden;
        border-radius: 4px;
        margin: -20px -20px 0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .mini-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
        }
      }

      .mini-title {
        font-size: 14px;
        margin: 12px 0 8px;
        color: #303133;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .mini-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #909399;

        .free {
          color: #67C23A;
        }
      }
    }
  }
}
</style>
