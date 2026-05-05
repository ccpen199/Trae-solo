<template>
  <div class="page-container tests-page">
    <div class="page-header">
      <h2>在线测试</h2>
      <p>检验学习成果，查漏补缺</p>
    </div>

    <el-empty v-if="papers.length === 0 && !loading" description="暂无测试试卷" />

    <div v-else class="paper-grid">
      <el-card
        v-for="paper in papers"
        :key="paper.id"
        shadow="hover"
        class="paper-card"
      >
        <div class="paper-header">
          <el-icon :size="48" color="#409EFF"><Document /></el-icon>
        </div>
        <div class="paper-content">
          <h3 class="paper-title">{{ paper.title }}</h3>
          <p class="paper-desc">{{ paper.description }}</p>
          <div class="paper-meta">
            <div class="meta-item">
              <el-icon><Clock /></el-icon>
              <span>{{ paper.duration }} 分钟</span>
            </div>
            <div class="meta-item">
              <el-icon><Trophy /></el-icon>
              <span>总分 {{ paper.totalScore }} 分</span>
            </div>
            <div class="meta-item">
              <el-icon><Check /></el-icon>
              <span>及格 {{ paper.passScore }} 分</span>
            </div>
          </div>
          <div class="paper-actions">
            <el-button type="primary" @click="startTest(paper.id)">
              开始测试
            </el-button>
            <el-button type="primary" plain @click="viewTest(paper.id)">
              查看详情
            </el-button>
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
        @size-change="fetchPapers"
        @current-change="fetchPapers"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { api } from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()

const papers = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

const fetchPapers = async () => {
  loading.value = true
  try {
    const response = await api.get('/tests/papers', {
      params: {
        page: page.value,
        pageSize: pageSize.value
      }
    })
    if (response.data.success) {
      const data = response.data.data
      papers.value = data.list || []
      total.value = data.total || 0
    }
  } catch (error) {
    console.error('获取试卷列表失败:', error)
  } finally {
    loading.value = false
  }
}

const startTest = (id: string) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后开始测试')
    router.push({ path: '/login', query: { redirect: `/tests/${id}` } })
    return
  }
  router.push(`/tests/${id}`)
}

const viewTest = (id: string) => {
  router.push(`/tests/${id}`)
}

onMounted(() => {
  fetchPapers()
})
</script>

<style lang="scss">
.tests-page {
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

  .paper-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }

  .paper-card {
    .paper-header {
      text-align: center;
      padding: 24px 0;
      background: linear-gradient(135deg, #ecf5ff 0%, #f4f4f5 100%);
      margin: -20px -20px 0;
      border-radius: 4px 4px 0 0;
    }

    .paper-content {
      padding-top: 20px;

      .paper-title {
        font-size: 18px;
        margin: 0 0 12px;
        color: #303133;
      }

      .paper-desc {
        font-size: 14px;
        color: #909399;
        margin: 0 0 16px;
        line-height: 1.6;
      }

      .paper-meta {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
        flex-wrap: wrap;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #606266;
        }
      }

      .paper-actions {
        display: flex;
        gap: 12px;
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
