<template>
  <div class="style-detail-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>
              <router-link to="/styles">款式管理</router-link>
            </el-breadcrumb-item>
            <el-breadcrumb-item>款式详情</el-breadcrumb-item>
          </el-breadcrumb>
          <div class="header-actions">
            <el-button v-if="canEdit" type="primary" @click="handleEdit">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button v-if="canSubmitPattern" type="primary" @click="handleSubmitPattern">
              <el-icon><Upload /></el-icon>
              提交打版
            </el-button>
            <el-button v-if="canConfirmPattern" type="success" @click="handleConfirmPattern">
              <el-icon><Check /></el-icon>
              确认打版
            </el-button>
            <el-button type="primary" text @click="handleViewHistory">
              <el-icon><Clock /></el-icon>
              查看历史
            </el-button>
          </div>
        </div>
      </template>

      <el-descriptions :column="3" border class="base-info">
        <el-descriptions-item label="款号">
          <span class="highlight">{{ style?.styleNumber }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="款式名称">{{ style?.name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(style?.status)" size="small">
            {{ getStatusName(style?.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="品类">{{ style?.styleCategory }}</el-descriptions-item>
        <el-descriptions-item label="季节">{{ getSeasonName(style?.season) }}</el-descriptions-item>
        <el-descriptions-item label="年份">{{ style?.year }}</el-descriptions-item>
        <el-descriptions-item label="目标性别">{{ style?.targetGender || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="年龄群">{{ style?.ageGroup || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag v-if="style?.priority === 1" type="danger" size="small">紧急</el-tag>
          <el-tag v-else-if="style?.priority === 2" type="warning" size="small">高</el-tag>
          <el-tag v-else size="small">正常</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预估产量">{{ style?.estimatedProductionQuantity || 0 }} 件</el-descriptions-item>
        <el-descriptions-item label="目标成本">¥{{ style?.targetUnitCost || 0 }}</el-descriptions-item>
        <el-descriptions-item label="目标售价">¥{{ style?.targetRetailPrice || 0 }}</el-descriptions-item>
        <el-descriptions-item label="参考编号">{{ style?.referenceNumber || '无' }}</el-descriptions-item>
        <el-descriptions-item label="设计师">{{ style?.designer?.name || '未分配' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(style?.createdAt) }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-tabs v-model="activeTab">
        <el-tab-pane label="描述说明" name="description">
          <div class="description-content">
            <h4>款式描述</h4>
            <p>{{ style?.description || '暂无描述' }}</p>
            
            <h4>工艺要求</h4>
            <p>{{ style?.processRequirements || '暂无工艺要求' }}</p>
            
            <h4>细节说明</h4>
            <p>{{ style?.detailNotes || '暂无细节说明' }}</p>
          </div>
        </el-tab-pane>

        <el-tab-pane label="设计资料" name="materials">
          <div class="materials-content">
            <h4>效果图</h4>
            <el-image
              v-if="style?.effectImageUrls?.length"
              v-for="(url, index) in style.effectImageUrls"
              :key="index"
              :src="url"
              :preview-src-list="style.effectImageUrls"
              :initial-index="index"
              class="preview-image"
              fit="cover"
            />
            <el-empty v-else description="暂无效果图" :image-size="80" />

            <h4>细节图</h4>
            <el-image
              v-if="style?.detailImageUrls?.length"
              v-for="(url, index) in style.detailImageUrls"
              :key="index"
              :src="url"
              :preview-src-list="style.detailImageUrls"
              :initial-index="index"
              class="preview-image"
              fit="cover"
            />
            <el-empty v-else description="暂无细节图" :image-size="80" />

            <h4>尺码表</h4>
            <div v-if="style?.sizeChartUrl">
              <a :href="style.sizeChartUrl" target="_blank">下载尺码表</a>
            </div>
            <el-empty v-else description="暂无尺码表" :image-size="80" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="相关版单" name="patterns">
          <el-table :data="relatedPatterns" stripe>
            <el-table-column prop="patternNumber" label="版单号" width="150" />
            <el-table-column prop="version" label="版本" width="100">
              <template #default="{ row }">
                <el-tag type="primary" size="small">v{{ row.version }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getPatternStatusType(row.status)" size="small">
                  {{ getPatternStatusName(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sizesAvailable" label="可用尺码">
              <template #default="{ row }">
                <el-tag v-for="size in row.sizesAvailable" :key="size" size="small" class="mr-1">
                  {{ size }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" text @click="goToPattern(row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="相关BOM" name="boms">
          <el-table :data="relatedBoms" stripe>
            <el-table-column prop="bomNumber" label="BOM编号" width="150" />
            <el-table-column prop="version" label="版本" width="100">
              <template #default="{ row }">
                <el-tag type="primary" size="small">v{{ row.version }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getBomStatusType(row.status)" size="small">
                  {{ getBomStatusName(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="totalCost" label="总成本" width="120">
              <template #default="{ row }">
                ¥{{ row.totalCost }}
              </template>
            </el-table-column>
            <el-table-column prop="unitCost" label="单位成本" width="120">
              <template #default="{ row }">
                ¥{{ row.unitCost }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" text @click="goToBom(row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { Style, StyleHistory, Pattern, Bom, StyleStatus } from '@/types'
import { stylesApi } from '@/api/styles'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const styleId = computed(() => route.params.id as string)
const style = ref<Style | null>(null)
const activeTab = ref('description')
const styleHistory = ref<StyleHistory[]>([])
const historyDialogVisible = ref(false)

const relatedPatterns = ref<Pattern[]>([])
const relatedBoms = ref<Bom[]>([])

const canEdit = computed(() => {
  if (!style.value) return false
  return (userStore.isDesigner || userStore.isAdmin) && ['draft', 'pending_pattern'].includes(style.value.status)
})

const canSubmitPattern = computed(() => {
  return userStore.isDesigner && style.value?.status === 'draft'
})

const canConfirmPattern = computed(() => {
  return userStore.isDesigner && style.value?.status === 'pending_confirmation'
})

const statusOptions: Record<string, string> = {
  draft: '草稿',
  pending_pattern: '待打版',
  pattern_in_progress: '打版中',
  pending_confirmation: '待确认',
  confirmed: '已确认',
  completed: '已完成',
}

const patternStatusOptions: Record<string, string> = {
  pending: '待开始',
  in_progress: '进行中',
  submitted: '已提交',
  confirmed: '已确认',
  rejected: '已拒绝',
}

const bomStatusOptions: Record<string, string> = {
  draft: '草稿',
  generated: '已生成',
  confirmed: '已确认',
}

const fetchStyleDetail = async () => {
  try {
    const res = await stylesApi.findOne(styleId.value)
    if (res.success && res.data) {
      style.value = res.data
    }
  } catch (error) {
    console.error('获取款式详情失败:', error)
  }
}

const handleEdit = () => {
  router.push(`/styles/${styleId.value}/edit`)
}

const handleSubmitPattern = async () => {
  try {
    const res = await stylesApi.submitForPattern(styleId.value)
    if (res.success) {
      fetchStyleDetail()
    }
  } catch (error) {
    console.error('提交打版失败:', error)
  }
}

const handleConfirmPattern = async () => {
  try {
    const res = await stylesApi.confirmPattern(styleId.value)
    if (res.success) {
      fetchStyleDetail()
    }
  } catch (error) {
    console.error('确认打版失败:', error)
  }
}

const handleViewHistory = async () => {
  try {
    const res = await stylesApi.getHistory(styleId.value)
    if (res.success && res.data) {
      styleHistory.value = res.data
      historyDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
  }
}

const goToPattern = (id: string) => {
  router.push(`/patterns/${id}`)
}

const goToBom = (id: string) => {
  router.push(`/boms/${id}`)
}

const getStatusName = (status?: string) => {
  return status ? statusOptions[status] || status : '-'
}

const getStatusType = (status?: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  if (!status) return 'info'
  const typeMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    draft: 'info',
    pending_pattern: 'warning',
    pattern_in_progress: 'primary',
    pending_confirmation: 'danger',
    confirmed: 'success',
    completed: 'success',
  }
  return typeMap[status] || 'info'
}

const getPatternStatusName = (status?: string) => {
  return status ? patternStatusOptions[status] || status : '-'
}

const getPatternStatusType = (status?: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  if (!status) return 'info'
  const typeMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending: 'info',
    in_progress: 'primary',
    submitted: 'warning',
    confirmed: 'success',
    rejected: 'danger',
  }
  return typeMap[status] || 'info'
}

const getBomStatusName = (status?: string) => {
  return status ? bomStatusOptions[status] || status : '-'
}

const getBomStatusType = (status?: string): 'primary' | 'success' | 'warning' | 'info' => {
  if (!status) return 'info'
  const typeMap: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
    draft: 'info',
    generated: 'primary',
    confirmed: 'success',
  }
  return typeMap[status] || 'info'
}

const getHistoryTagType = (status: StyleStatus) => getStatusType(status)

const getSeasonName = (season?: string) => {
  const seasonMap: Record<string, string> = {
    spring: '春季',
    summer: '夏季',
    autumn: '秋季',
    winter: '冬季',
    all: '全年',
  }
  return season ? seasonMap[season] || season : '-'
}

const formatDate = (date?: string | Date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

onMounted(() => {
  fetchStyleDetail()
})
</script>

<style scoped lang="scss">
.style-detail-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-actions {
    display: flex;
    gap: 10px;
  }

  .base-info {
    .highlight {
      color: #409eff;
      font-weight: 600;
    }
  }

  .description-content {
    h4 {
      margin: 20px 0 10px;
      color: #303133;
      font-size: 15px;
    }
    
    p {
      margin: 0;
      color: #606266;
      line-height: 1.8;
    }
  }

  .materials-content {
    h4 {
      margin: 20px 0 10px;
      color: #303133;
      font-size: 15px;
    }

    .preview-image {
      width: 200px;
      height: 200px;
      margin-right: 10px;
      margin-bottom: 10px;
      border-radius: 4px;
      border: 1px solid #dcdfe6;
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

  .mr-1 {
    margin-right: 4px;
  }
}
</style>
