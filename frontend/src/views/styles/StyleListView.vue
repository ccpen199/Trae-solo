<template>
  <div class="style-list-container">
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
        <el-form-item label="季节">
          <el-select v-model="queryForm.season" placeholder="全部季节" clearable style="width: 120px">
            <el-option label="春季" value="spring" />
            <el-option label="夏季" value="summer" />
            <el-option label="秋季" value="autumn" />
            <el-option label="冬季" value="winter" />
          </el-select>
        </el-form-item>
        <el-form-item label="年份">
          <el-select v-model="queryForm.year" placeholder="全部年份" clearable style="width: 100px">
            <el-option v-for="year in years" :key="year" :label="String(year)" :value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryForm.keyword"
            placeholder="款号/名称"
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
          <span>款式列表</span>
          <el-button v-if="userStore.isDesigner || userStore.isAdmin" type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建款式
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="styleList"
        stripe
        @row-click="handleRowClick"
        :row-class-name="(row) => (row.row.isArchived ? 'archived-row' : '')"
      >
        <el-table-column prop="styleNumber" label="款号" width="130" fixed>
          <template #default="{ row }">
            <router-link :to="`/styles/${row.id}`" class="style-link">
              {{ row.styleNumber }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="款式名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="styleCategory" label="品类" width="100" />
        <el-table-column prop="season" label="季节" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ getSeasonName(row.season) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="year" label="年份" width="80" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.priority === 1" type="danger" size="small">紧急</el-tag>
            <el-tag v-else-if="row.priority === 2" type="warning" size="small">高</el-tag>
            <el-tag v-else size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click.stop="handleView(row)">
              查看
            </el-button>
            <el-button
              v-if="(userStore.isDesigner || userStore.isAdmin) && canEdit(row)"
              type="primary"
              text
              size="small"
              @click.stop="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)">
              <el-button type="primary" text size="small">
                更多
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-if="userStore.isDesigner && row.status === 'draft'"
                    command="submitForPattern"
                  >
                    提交打版
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="userStore.isDesigner && row.status === 'pending_confirmation'"
                    command="confirmPattern"
                  >
                    确认打版
                  </el-dropdown-item>
                  <el-dropdown-item command="viewHistory">
                    查看历史
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="userStore.isDesigner || userStore.isAdmin"
                    command="markReusable"
                  >
                    标记可复用
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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

    <el-dialog
      v-model="historyDialogVisible"
      title="款式历史记录"
      width="800px"
    >
      <el-timeline>
        <el-timeline-item
          v-for="(item, index) in styleHistory"
          :key="index"
          :timestamp="formatDate(item.createdAt)"
          placement="top"
        >
          <el-card shadow="hover" class="history-card">
            <div class="history-header">
              <el-tag :type="getHistoryTagType(item.newStatus)" size="small">
                {{ getStatusName(item.newStatus) }}
              </el-tag>
              <span class="history-operator">
                {{ item.operator?.name || '系统' }}
              </span>
            </div>
            <p class="history-description">{{ item.actionDescription }}</p>
            <p v-if="item.remarks" class="history-remarks">备注: {{ item.remarks }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { Style, StyleHistory, StyleStatus } from '@/types'
import { stylesApi } from '@/api/styles'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const styleList = ref<Style[]>([])
const total = ref(0)
const styleHistory = ref<StyleHistory[]>([])
const historyDialogVisible = ref(false)
const currentStyle = ref<Style | null>(null)

const currentYear = new Date().getFullYear()
const years = computed(() => [currentYear, currentYear - 1, currentYear - 2, currentYear - 3])

const statusOptions: Record<string, string> = {
  draft: '草稿',
  pending_pattern: '待打版',
  pattern_in_progress: '打版中',
  pattern_submitted: '打版已提交',
  pending_confirmation: '待确认',
  confirmed: '已确认',
  bom_generated: 'BOM已生成',
  pending_purchase: '待采购',
  purchase_in_progress: '采购中',
  material_ready: '物料已就绪',
  pending_production: '待生产',
  production_in_progress: '生产中',
  production_completed: '生产已完成',
  shipped: '已出货',
  completed: '已完成',
  cancelled: '已取消',
  on_hold: '暂停',
}

const queryForm = reactive({
  page: 1,
  pageSize: 20,
  status: '',
  season: '',
  year: undefined as number | undefined,
  keyword: '',
})

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: queryForm.page,
      pageSize: queryForm.pageSize,
    }
    if (queryForm.status) params.status = queryForm.status
    if (queryForm.season) params.season = queryForm.season
    if (queryForm.year) params.year = queryForm.year
    if (queryForm.keyword) params.keyword = queryForm.keyword

    const res = await stylesApi.findAll(params)
    if (res.success && res.data) {
      styleList.value = res.data.data
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取款式列表失败:', error)
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
  queryForm.season = ''
  queryForm.year = undefined
  queryForm.keyword = ''
  fetchData()
}

const handleCreate = () => {
  router.push('/styles/create')
}

const handleView = (row: Style) => {
  router.push(`/styles/${row.id}`)
}

const handleEdit = (row: Style) => {
  router.push(`/styles/${row.id}/edit`)
}

const handleRowClick = (row: Style) => {
  router.push(`/styles/${row.id}`)
}

const canEdit = (row: Style) => {
  return ['draft', 'pending_pattern'].includes(row.status)
}

const handleCommand = async (command: string, row: Style) => {
  switch (command) {
    case 'submitForPattern':
      try {
        const res = await stylesApi.submitForPattern(row.id)
        if (res.success) {
          fetchData()
        }
      } catch (error) {
        console.error('提交打版失败:', error)
      }
      break
    case 'confirmPattern':
      try {
        const res = await stylesApi.confirmPattern(row.id)
        if (res.success) {
          fetchData()
        }
      } catch (error) {
        console.error('确认打版失败:', error)
      }
      break
    case 'viewHistory':
      currentStyle.value = row
      try {
        const res = await stylesApi.getHistory(row.id)
        if (res.success && res.data) {
          styleHistory.value = res.data
          historyDialogVisible.value = true
        }
      } catch (error) {
        console.error('获取历史记录失败:', error)
      }
      break
    case 'markReusable':
      try {
        const res = await stylesApi.markAsReusable(row.id)
        if (res.success) {
          fetchData()
        }
      } catch (error) {
        console.error('标记可复用失败:', error)
      }
      break
  }
}

const getStatusName = (status: string) => {
  return statusOptions[status] || status
}

const getStatusType = (status: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const typeMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    draft: 'info',
    pending_pattern: 'warning',
    pattern_in_progress: 'primary',
    pattern_submitted: 'primary',
    pending_confirmation: 'danger',
    confirmed: 'success',
    bom_generated: 'primary',
    pending_purchase: 'warning',
    purchase_in_progress: 'primary',
    material_ready: 'success',
    pending_production: 'warning',
    production_in_progress: 'primary',
    production_completed: 'success',
    shipped: 'success',
    completed: 'success',
    cancelled: 'danger',
    on_hold: 'warning',
  }
  return typeMap[status] || 'info'
}

const getHistoryTagType = (status: StyleStatus): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  return getStatusType(status)
}

const getSeasonName = (season: string) => {
  const seasonMap: Record<string, string> = {
    spring: '春季',
    summer: '夏季',
    autumn: '秋季',
    winter: '冬季',
  }
  return seasonMap[season] || season
}

const formatDate = (date: string | Date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.style-list-container {
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

    .archived-row {
      background-color: #f5f7fa;
      opacity: 0.6;
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }

  .history-card {
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .history-operator {
        font-size: 12px;
        color: #909399;
      }
    }
    
    .history-description {
      margin: 0 0 4px 0;
      font-size: 14px;
      color: #606266;
    }
    
    .history-remarks {
      margin: 0;
      font-size: 13px;
      color: #909399;
    }
  }
}
</style>
