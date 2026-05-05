<template>
  <div class="page-container job-detail-page">
    <el-card v-loading="loading" shadow="never" class="job-card">
      <div class="job-header" v-if="job">
        <div class="job-main">
          <h1 class="job-title">{{ job.title }}</h1>
          <div class="job-salary">{{ job.salaryRange }}</div>
        </div>
        <div class="job-tags">
          <el-tag v-if="job.type" :type="getJobTypeTag(job.type)" effect="plain">
            {{ getJobTypeLabel(job.type) }}
          </el-tag>
          <el-tag v-if="job.experienceLevel" effect="plain">
            {{ job.experienceLevel }}
          </el-tag>
          <el-tag v-if="job.educationLevel" effect="plain">
            {{ job.educationLevel }}
          </el-tag>
        </div>
      </div>

      <el-divider />

      <div class="job-company" v-if="job">
        <div class="company-info">
          <el-icon :size="48"><OfficeBuilding /></el-icon>
          <div class="company-detail">
            <h3 class="company-name">{{ job.companyName }}</h3>
            <div class="company-meta" v-if="job.location">
              <el-icon><Location /></el-icon>
              <span>{{ job.location }}</span>
            </div>
          </div>
        </div>
        <div class="view-count">
          <el-icon><View /></el-icon>
          <span>{{ job.viewCount }} 人浏览</span>
        </div>
      </div>

      <el-divider />

      <div class="job-section" v-if="job?.description">
        <h3 class="section-title">职位描述</h3>
        <div class="section-content" v-html="job?.description"></div>
      </div>

      <el-divider v-if="job?.requirements" />

      <div class="job-section" v-if="job?.requirements">
        <h3 class="section-title">任职要求</h3>
        <div class="section-content" v-html="job?.requirements"></div>
      </div>

      <el-divider v-if="job?.benefits" />

      <div class="job-section" v-if="job?.benefits">
        <h3 class="section-title">福利待遇</h3>
        <div class="section-content" v-html="job?.benefits"></div>
      </div>

      <el-divider />

      <div class="job-actions">
        <el-button type="primary" size="large">
          <el-icon><Briefcase /></el-icon>
          立即投递
        </el-button>
        <el-button size="large">
          <el-icon><Star /></el-icon>
          收藏职位
        </el-button>
        <el-button size="large" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="contact-card" v-if="job?.contactEmail || job?.contactPhone">
      <template #header>
        <h3 class="section-title">联系方式</h3>
      </template>
      <div class="contact-info">
        <div class="contact-item" v-if="job?.contactEmail">
          <el-icon><Message /></el-icon>
          <span class="label">邮箱：</span>
          <span class="value">{{ job?.contactEmail }}</span>
        </div>
        <div class="contact-item" v-if="job?.contactPhone">
          <el-icon><Phone /></el-icon>
          <span class="label">电话：</span>
          <span class="value">{{ job?.contactPhone }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const job = ref<any>(null)

const getJobTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    full_time: '全职',
    part_time: '兼职',
    internship: '实习',
    remote: '远程'
  }
  return labels[type] || type
}

const getJobTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    full_time: 'primary',
    part_time: 'warning',
    internship: 'success',
    remote: 'info'
  }
  return tags[type] || 'info'
}

const fetchJobDetail = async () => {
  const jobId = route.params.id as string
  if (!jobId) return

  loading.value = true
  try {
    const response = await api.get(`/jobs/jobs/${jobId}`)
    if (response.data.success) {
      job.value = response.data.data
    }
  } catch (error) {
    console.error('获取职位详情失败:', error)
    ElMessage.error('获取职位详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/jobs')
}

onMounted(() => {
  fetchJobDetail()
})
</script>

<style lang="scss">
.job-detail-page {
  .job-card {
    margin-bottom: 24px;

    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;

      .job-main {
        display: flex;
        align-items: center;
        gap: 24px;

        .job-title {
          font-size: 24px;
          margin: 0;
          color: #303133;
        }

        .job-salary {
          font-size: 28px;
          color: #F56C6C;
          font-weight: 700;
        }
      }

      .job-tags {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
    }

    .job-company {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .company-info {
        display: flex;
        align-items: center;
        gap: 16px;

        .company-detail {
          .company-name {
            font-size: 18px;
            margin: 0 0 8px;
            color: #409EFF;
          }

          .company-meta {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            color: #909399;
          }
        }
      }

      .view-count {
        font-size: 14px;
        color: #909399;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .job-section {
      .section-title {
        font-size: 16px;
        margin: 0 0 16px;
        color: #303133;
        font-weight: 600;
      }

      .section-content {
        font-size: 14px;
        line-height: 2;
        color: #606266;
        white-space: pre-wrap;
      }
    }

    .job-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
  }

  .contact-card {
    .contact-info {
      .contact-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 0;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        .label {
          font-size: 14px;
          color: #909399;
        }

        .value {
          font-size: 14px;
          color: #303133;
        }
      }
    }
  }
}
</style>
