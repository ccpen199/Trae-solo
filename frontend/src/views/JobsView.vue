<template>
  <div class="page-container jobs-page">
    <div class="page-header">
      <h2>就业服务</h2>
      <p>优质职位推荐，专业就业指导</p>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="招聘信息" name="jobs">
        <div class="filter-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索职位/公司..."
            prefix-icon="Search"
            style="width: 280px"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button type="primary" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>

          <el-select v-model="jobType" placeholder="职位类型" @change="handleTypeChange" clearable>
            <el-option label="全职" value="full_time" />
            <el-option label="兼职" value="part_time" />
            <el-option label="实习" value="internship" />
            <el-option label="远程" value="remote" />
          </el-select>
        </div>

        <el-empty v-if="jobs.length === 0 && !loading" description="暂无职位" />

        <div v-else class="job-list">
          <el-card
            v-for="job in jobs"
            :key="job.id"
            shadow="hover"
            class="job-card"
            @click="goToJob(job.id)"
          >
            <div class="job-info">
              <div class="job-header">
                <h3 class="job-title">{{ job.title }}</h3>
                <span class="salary">{{ job.salaryRange }}</span>
              </div>
              <div class="job-company">
                <el-icon><OfficeBuilding /></el-icon>
                <span>{{ job.companyName }}</span>
              </div>
              <div class="job-tags">
                <el-tag size="small" effect="plain" v-if="job.location">
                  <el-icon><Location /></el-icon>
                  {{ job.location }}
                </el-tag>
                <el-tag size="small" effect="plain" v-if="job.type">
                  {{ getTypeLabel(job.type) }}
                </el-tag>
                <el-tag size="small" effect="plain" v-if="job.experienceLevel">
                  {{ job.experienceLevel }}
                </el-tag>
                <el-tag size="small" effect="plain" v-if="job.educationLevel">
                  {{ job.educationLevel }}
                </el-tag>
              </div>
            </div>
            <div class="job-meta">
              <span class="view-count">
                <el-icon><View /></el-icon>
                {{ job.viewCount }} 浏览
              </span>
            </div>
          </el-card>
        </div>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[12, 24, 48]"
            :total="totalJobs"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchJobs"
            @current-change="fetchJobs"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="就业指导" name="guides">
        <div class="guide-list">
          <el-empty v-if="guides.length === 0 && !loading" description="暂无指导文章" />

          <div v-else class="guide-grid">
            <el-card
              v-for="guide in guides"
              :key="guide.id"
              shadow="hover"
              class="guide-card"
            >
              <template #header>
                <h3 class="guide-title">{{ guide.title }}</h3>
              </template>
              <div class="guide-content">
                <p class="guide-desc">{{ guide.content?.slice(0, 120) }}...</p>
                <div class="guide-footer">
                  <span class="view-count">
                    <el-icon><View /></el-icon>
                    {{ guide.viewCount }} 阅读
                  </span>
                  <el-button type="primary" link>阅读全文</el-button>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/request'

const router = useRouter()

const activeTab = ref('jobs')
const jobs = ref<any[]>([])
const guides = ref<any[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const jobType = ref('')
const page = ref(1)
const pageSize = ref(12)
const totalJobs = ref(0)

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    full_time: '全职',
    part_time: '兼职',
    internship: '实习',
    remote: '远程'
  }
  return labels[type] || type
}

const fetchJobs = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: page.value,
      pageSize: pageSize.value
    }

    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }

    if (jobType.value) {
      params.type = jobType.value
    }

    const response = await api.get('/jobs/jobs', { params })
    if (response.data.success) {
      const data = response.data.data
      jobs.value = data.list || []
      totalJobs.value = data.total || 0
    }
  } catch (error) {
    console.error('获取职位列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchGuides = async () => {
  try {
    const response = await api.get('/jobs/guides')
    if (response.data.success) {
      const data = response.data.data
      guides.value = data.list || []
    }
  } catch (error) {
    console.error('获取指导文章失败:', error)
  }
}

const handleSearch = () => {
  page.value = 1
  fetchJobs()
}

const handleTypeChange = () => {
  page.value = 1
  fetchJobs()
}

const goToJob = (id: string) => {
  router.push(`/jobs/${id}`)
}

onMounted(() => {
  fetchJobs()
  fetchGuides()
})
</script>

<style lang="scss">
.jobs-page {
  .page-header {
    margin-bottom: 32px;
    text-align: center;

    h2 {
      margin: 0 0 8px;
      font-size: 28px;
      color: #303133;
    }

    p {
      margin: 0;
      font-size: 14px;
      color: #909399;
    }
  }

  .filter-bar {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .job-list {
    .job-card {
      margin-bottom: 16px;
      cursor: pointer;

      .job-info {
        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;

          .job-title {
            font-size: 18px;
            margin: 0;
            color: #303133;
          }

          .salary {
            font-size: 20px;
            color: #F56C6C;
            font-weight: 600;
          }
        }

        .job-company {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          color: #409EFF;
          margin-bottom: 12px;
        }

        .job-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
      }

      .job-meta {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #ebeef5;
        display: flex;
        justify-content: flex-end;

        .view-count {
          font-size: 13px;
          color: #909399;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }
  }

  .guide-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 24px;
  }

  .guide-card {
    .guide-title {
      margin: 0;
      font-size: 16px;
      color: #303133;
    }

    .guide-content {
      .guide-desc {
        font-size: 14px;
        color: #606266;
        margin: 0 0 16px;
        line-height: 1.6;
      }

      .guide-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .view-count {
          font-size: 13px;
          color: #909399;
          display: flex;
          align-items: center;
          gap: 4px;
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
