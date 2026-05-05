<template>
  <div class="home-page">
    <section class="hero-section">
      <div class="hero-content">
        <h1>开启您的学习之旅</h1>
        <p class="subtitle">智汇教育为您提供丰富的课程资源、专业的学习指导和便捷的就业服务</p>
        <div class="hero-features">
          <div class="feature-item">
            <el-icon :size="40" color="#409EFF"><VideoCamera /></el-icon>
            <h3>课程学习</h3>
            <p>海量精品课程，从入门到精通</p>
          </div>
          <div class="feature-item">
            <el-icon :size="40" color="#67C23A"><Download /></el-icon>
            <h3>资料下载</h3>
            <p>文档、视频、软件一键获取</p>
          </div>
          <div class="feature-item">
            <el-icon :size="40" color="#E6A23C"><ChatDotRound /></el-icon>
            <h3>问答交流</h3>
            <p>与讲师和学员互动交流</p>
          </div>
          <div class="feature-item">
            <el-icon :size="40" color="#F56C6C"><Document /></el-icon>
            <h3>在线测试</h3>
            <p>检验学习成果，查漏补缺</p>
          </div>
        </div>
        <div class="hero-buttons">
          <el-button type="primary" size="large" @click="goToCourses">
            开始学习 <el-icon class="ml-2"><ArrowRight /></el-icon>
          </el-button>
          <el-button size="large" @click="goToJobs">
            就业服务
          </el-button>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>精选课程</h2>
        <router-link to="/courses" class="more-link">查看更多 →</router-link>
      </div>
      <div class="card-grid">
        <el-card v-for="course in featuredCourses" :key="course.id" shadow="hover" @click="goToCourse(course.id)">
          <template #header>
            <div class="course-cover">
              <img v-if="course.cover" :src="course.cover" :alt="course.title" />
              <div v-else class="course-cover-placeholder">
                <el-icon :size="48"><VideoCamera /></el-icon>
              </div>
            </div>
          </template>
          <div class="course-info">
            <h3 class="course-title">{{ course.title }}</h3>
            <p class="course-desc">{{ course.description?.slice(0, 60) }}...</p>
            <div class="course-meta">
              <span class="students">
                <el-icon><User /></el-icon>
                {{ course.studentCount }} 人学习
              </span>
              <span class="price">
                <template v-if="course.price > 0">
                  <span class="current-price">¥{{ course.price }}</span>
                  <span class="original-price" v-if="course.originalPrice">¥{{ course.originalPrice }}</span>
                </template>
                <span class="free" v-else>免费</span>
              </span>
            </div>
          </div>
        </el-card>
      </div>
    </section>

    <section class="section bg-white">
      <div class="section-header">
        <h2>最近更新课程</h2>
        <router-link to="/courses" class="more-link">查看更多 →</router-link>
      </div>
      <div class="card-grid">
        <el-card v-for="course in recentCourses" :key="course.id" shadow="hover" @click="goToCourse(course.id)">
          <template #header>
            <div class="course-cover">
              <img v-if="course.cover" :src="course.cover" :alt="course.title" />
              <div v-else class="course-cover-placeholder">
                <el-icon :size="48"><VideoCamera /></el-icon>
              </div>
            </div>
          </template>
          <div class="course-info">
            <h3 class="course-title">{{ course.title }}</h3>
            <div class="course-meta">
              <span class="category">{{ course.category?.name || '课程' }}</span>
              <span class="duration">{{ course.duration }} 课时</span>
              <span class="price">
                <template v-if="course.price > 0">¥{{ course.price }}</template>
                <template v-else>免费</template>
              </span>
            </div>
          </div>
        </el-card>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>学习资源</h2>
        <router-link to="/resources" class="more-link">查看更多 →</router-link>
      </div>
      <div class="resource-types">
        <div class="resource-type-item" @click="goToResources('video')">
          <el-icon :size="50" color="#409EFF"><VideoCamera /></el-icon>
          <h3>精彩视频</h3>
          <p>优质教学视频，随时观看</p>
        </div>
        <div class="resource-type-item" @click="goToResources('document')">
          <el-icon :size="50" color="#67C23A"><Document /></el-icon>
          <h3>文档课件</h3>
          <p>PPT、PDF等学习资料</p>
        </div>
        <div class="resource-type-item" @click="goToResources('software')">
          <el-icon :size="50" color="#E6A23C"><Box /></el-icon>
          <h3>常用软件</h3>
          <p>开发工具、设计软件下载</p>
        </div>
      </div>
    </section>

    <section class="section bg-white">
      <div class="section-header">
        <h2>热门问答</h2>
        <router-link to="/questions" class="more-link">查看更多 →</router-link>
      </div>
      <el-row :gutter="20">
        <el-col :span="12" v-for="question in hotQuestions" :key="question.id">
          <div class="question-item" @click="goToQuestion(question.id)">
            <h3>{{ question.title }}</h3>
            <div class="question-meta">
              <span><el-icon><View /></el-icon> {{ question.viewCount }} 浏览</span>
              <span><el-icon><ChatDotRound /></el-icon> {{ question.answerCount }} 回答</span>
              <span class="solved" v-if="question.isSolved">已解决</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </section>

    <section class="section jobs-section">
      <div class="section-header">
        <h2>热门职位</h2>
        <router-link to="/jobs" class="more-link">查看更多 →</router-link>
      </div>
      <div class="job-list">
        <div class="job-item" v-for="job in hotJobs" :key="job.id" @click="goToJob(job.id)">
          <div class="job-header">
            <h3>{{ job.title }}</h3>
            <span class="salary">{{ job.salaryRange }}</span>
          </div>
          <div class="job-company">{{ job.companyName }}</div>
          <div class="job-meta">
            <span><el-icon><Location /></el-icon> {{ job.location }}</span>
            <span><el-icon><Clock /></el-icon> {{ job.type === 'full_time' ? '全职' : job.type === 'part_time' ? '兼职' : job.type === 'internship' ? '实习' : '远程' }}</span>
            <span>{{ job.experienceLevel }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/request'

const router = useRouter()

const featuredCourses = ref<any[]>([])
const recentCourses = ref<any[]>([])
const hotQuestions = ref<any[]>([])
const hotJobs = ref<any[]>([])

const fetchData = async () => {
  try {
    const [coursesRes, recentRes, questionsRes, jobsRes] = await Promise.all([
      api.get('/courses/featured?limit=8'),
      api.get('/courses/recent?limit=4'),
      api.get('/questions?pageSize=6&sort=hot'),
      api.get('/jobs/jobs?pageSize=4')
    ])

    if (coursesRes.data.success) {
      featuredCourses.value = coursesRes.data.data || []
    }
    if (recentRes.data.success) {
      recentCourses.value = recentRes.data.data || []
    }
    if (questionsRes.data.success) {
      hotQuestions.value = questionsRes.data.data.list || []
    }
    if (jobsRes.data.success) {
      hotJobs.value = jobsRes.data.data.list || []
    }
  } catch (error) {
    console.error('获取首页数据失败:', error)
  }
}

onMounted(() => {
  fetchData()
})

const goToCourses = () => router.push('/courses')
const goToJobs = () => router.push('/jobs')
const goToCourse = (id: string) => router.push(`/courses/${id}`)
const goToResources = (type: string) => router.push({ path: '/resources', query: { type } })
const goToQuestion = (id: string) => router.push(`/questions/${id}`)
const goToJob = (id: string) => router.push(`/jobs/${id}`)
</script>

<style lang="scss">
.home-page {
  .hero-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 80px 0;
    color: #fff;

    .hero-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
      text-align: center;

      h1 {
        font-size: 42px;
        margin-bottom: 16px;
      }

      .subtitle {
        font-size: 18px;
        margin-bottom: 48px;
        opacity: 0.9;
      }
    }

    .hero-features {
      display: flex;
      justify-content: center;
      gap: 60px;
      margin-bottom: 48px;
      flex-wrap: wrap;

      .feature-item {
        text-align: center;
        max-width: 180px;

        h3 {
          margin: 12px 0 8px;
          font-size: 18px;
        }

        p {
          font-size: 14px;
          opacity: 0.8;
        }
      }
    }

    .hero-buttons {
      display: flex;
      justify-content: center;
      gap: 20px;

      .el-button {
        font-size: 16px;
        padding: 16px 40px;
        height: auto;
      }
    }
  }

  .section {
    padding: 60px 0;

    &.bg-white {
      background: #fff;
    }

    .section-header {
      max-width: 1400px;
      margin: 0 auto 32px;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        font-size: 28px;
        color: #303133;
      }

      .more-link {
        color: #409EFF;
        text-decoration: none;
        font-size: 14px;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .card-grid {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
    }
  }

  .course-cover {
    height: 160px;
    overflow: hidden;
    border-radius: 4px;
    margin: -20px -20px 0;

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
  }

  .course-info {
    .course-title {
      font-size: 16px;
      margin-bottom: 8px;
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
      justify-content: space-between;
      align-items: center;

      .students {
        font-size: 12px;
        color: #909399;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .price {
        .current-price {
          font-size: 16px;
          color: #F56C6C;
          font-weight: 600;
        }

        .original-price {
          font-size: 12px;
          color: #909399;
          text-decoration: line-through;
          margin-left: 6px;
        }

        .free {
          font-size: 16px;
          color: #67C23A;
          font-weight: 600;
        }
      }
    }
  }

  .resource-types {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;

    .resource-type-item {
      background: #fff;
      padding: 40px 20px;
      border-radius: 8px;
      text-align: center;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      }

      h3 {
        margin: 16px 0 8px;
        font-size: 20px;
        color: #303133;
      }

      p {
        font-size: 14px;
        color: #909399;
      }
    }
  }

  .question-item {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 16px;
    transition: box-shadow 0.3s;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    h3 {
      font-size: 16px;
      color: #303133;
      margin-bottom: 12px;
      line-height: 1.4;

      &:hover {
        color: #409EFF;
      }
    }

    .question-meta {
      display: flex;
      gap: 20px;
      font-size: 13px;
      color: #909399;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .solved {
        color: #67C23A;
        background: #f0f9eb;
        padding: 2px 8px;
        border-radius: 4px;
      }
    }
  }

  .jobs-section {
    .job-list {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;

      .job-item {
        background: #fff;
        padding: 24px;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.3s, box-shadow 0.3s;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;

          h3 {
            font-size: 18px;
            color: #303133;
          }

          .salary {
            font-size: 18px;
            color: #F56C6C;
            font-weight: 600;
          }
        }

        .job-company {
          font-size: 15px;
          color: #409EFF;
          margin-bottom: 12px;
        }

        .job-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #909399;
          flex-wrap: wrap;

          span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
    }
  }
}
</style>
