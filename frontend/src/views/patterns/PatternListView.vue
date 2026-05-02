<template>
  <div class="pattern-list-container">
    <el-card class="filter-card">
      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option
              v-for="(label, value) in statusOptions"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="款号/名称">
          <el-input
            v-model="queryForm.keyword"
            placeholder="请输入关键词"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>版单列表</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="patternList"
        stripe
        @row-click="handleRowClick"
      >
        <el-table-column prop="patternNumber" label="版单号" width="150">
          <template #default="{ row }">
            <router-link :to="`/patterns/${row.id}`" class="style-link">
              {{ row.patternNumber }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="styleNumber" label="款号" width="130" />
        <el-table-column prop="styleName" label="款式名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="version" label="版本" width="80">
          <template #default="{ row }">
            <el-tag type="primary" size="small">v{{ row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sizesAvailable" label="可用尺码" width="150">
          <template #default="{ row }">
            <div class="sizes-tags">
              <el-tag v-for="size in row.sizesAvailable?.slice(0, 3)" :key="size" size="small" class="size-tag">
                {{ size }}
              </el-tag>
              <el-tag v-if="row.sizesAvailable?.length > 3" size="small" type="info">
                +{{ row.sizesAvailable.length - 3 }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sewingDifficulty" label="难度" width="100">
          <template #default="{ row }">
            <el-rate
              :model-value="row.sewingDifficulty"
              disabled
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click.stop="handleView(row)">
              查看
            </el-button>
            <el-button
              v-if="userStore.isPatternMaker && canEdit(row)"
              type="primary"
              text
              size="small"
              @click.stop="handleEdit(row)"
            >
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { Pattern } from '@/types'
import { PatternStatus } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const patternList = ref<Pattern[]>([])
const total = ref(0)

const statusOptions: Record<string, string> = {
  pending: '待开始',
  in_progress: '进行中',
  submitted: '已提交',
  confirmed: '已确认',
  rejected: '已拒绝',
  needs_revision: '需修改',
  archived: '已归档',
}

const queryForm = reactive({
  page: 1,
  pageSize: 20,
  status: '',
  keyword: '',
})

const fetchData = async () => {
  loading.value = true
  try {
    patternList.value = [
      {
        id: '1',
        patternNumber: 'PT250001',
        styleId: '1',
        status: PatternStatus.SUBMITTED,
        version: 1,
        isLatest: true,
        sewingDifficulty: 3,
        sizesAvailable: ['S', 'M', 'L', 'XL'],
        createdAt: new Date('2025-01-15T10:30:00Z'),
        updatedAt: new Date('2025-01-15T14:20:00Z'),
      },
    ]
    total.value = 1
  } catch (error) {
    console.error('获取版单列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryForm.page = 1
  fetchData()
}

const handleReset = () => {
  queryForm.page = 1
  queryForm.status = ''
  queryForm.keyword = ''
  fetchData()
}

const handleView = (row: Pattern) => {
  router.push(`/patterns/${row.id}`)
}

const handleEdit = (row: Pattern) => {
  console.log('编辑版单:', row.id)
}

const handleRowClick = (row: Pattern) => {
  router.push(`/patterns/${row.id}`)
}

const canEdit = (row: Pattern) => {
  return ['pending', 'in_progress', 'needs_revision'].includes(row.status)
}

const getStatusName = (status: string) => {
  return statusOptions[status] || status
}

const getStatusType = (status: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const typeMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending: 'info',
    in_progress: 'primary',
    submitted: 'warning',
    confirmed: 'success',
    rejected: 'danger',
    needs_revision: 'warning',
    archived: 'info',
  }
  return typeMap[status] || 'info'
}

const formatDate = (date: string | Date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.pattern-list-container {
  .filter-card {
    margin-bottom: 20px;
    
    .filter-form {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
    }
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .style-link {
      color: #409eff;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }

    .sizes-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      
      .size-tag {
        margin-right: 0;
      }
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }
}
</style>
