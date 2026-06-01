<template>
  <div class="page-container">
    <div class="flex-between mb-20">
      <h2 class="page-title">年度复盘</h2>
      <div class="flex gap-10 items-center">
        <el-date-picker
          v-model="selectedYear"
          type="year"
          placeholder="选择年份"
          format="YYYY 年"
          value-format="YYYY"
          :clearable="false"
          @change="handleYearChange"
        />
        <el-tag v-if="reviewData?.review?.is_completed" type="success" size="large">
          <el-icon><Check /></el-icon>
          已完成
        </el-tag>
        <el-tag v-else type="warning" size="large">
          <el-icon><Edit /></el-icon>
          编辑中
        </el-tag>
      </div>
    </div>

    <div v-loading="loading">
      <el-row :gutter="20" class="mb-20">
        <el-col :xs="12" :sm="6">
          <el-card class="overview-card card-shadow">
            <div class="flex gap-10 items-center">
              <div class="icon-wrapper bg-primary">
                <el-icon :size="24"><DataAnalysis /></el-icon>
              </div>
              <div>
                <div class="overview-value">
                  {{ reviewData?.summary?.total_goals || 0 }} / {{ reviewData?.summary?.completed_goals || 0 }}
                </div>
                <div class="overview-label">目标完成</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="overview-card card-shadow">
            <div class="flex gap-10 items-center">
              <div class="icon-wrapper bg-success">
                <el-icon :size="24"><Trophy /></el-icon>
              </div>
              <div>
                <div class="overview-value">
                  {{ reviewData?.summary?.total_krs || 0 }} / {{ reviewData?.summary?.completed_krs || 0 }}
                </div>
                <div class="overview-label">关键结果</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="overview-card card-shadow">
            <div class="flex gap-10 items-center">
              <div class="icon-wrapper bg-warning">
                <el-icon :size="24"><Warning /></el-icon>
              </div>
              <div>
                <div class="overview-value">{{ reviewData?.summary?.total_deviations || 0 }}</div>
                <div class="overview-label">偏差记录</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="overview-card card-shadow">
            <div class="flex gap-10 items-center">
              <div class="icon-wrapper bg-info">
                <el-icon :size="24"><Clock /></el-icon>
              </div>
              <div>
                <div class="overview-value">{{ formatHours(reviewData?.summary?.total_time || 0) }}</div>
                <div class="overview-label">总投入时间</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="card-shadow mb-20">
        <template #header>
          <div class="flex-between">
            <span class="card-header-title">目标完成情况</span>
            <el-tag size="small">按维度分组</el-tag>
          </div>
        </template>
        <el-table :data="groupedGoals" stripe style="width: 100%">
          <el-table-column prop="dimension" label="维度" width="100">
            <template #default="{ row }">
              <span :class="`dimension-tag dimension-${row.dimension}`">{{ row.dimension }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="目标" min-width="180" />
          <el-table-column label="关键结果" min-width="200">
            <template #default="{ row }">
              <div class="kr-list">
                <div v-for="kr in row.key_results" :key="kr.id" class="kr-item flex-between mb-5">
                  <span class="kr-title">{{ kr.title }}</span>
                  <div class="flex gap-10 items-center">
                    <el-progress :percentage="kr.progress || 0" :stroke-width="8" style="width: 100px" />
                    <el-tag :type="kr.status === 'completed' ? 'success' : kr.status === 'cancelled' ? 'info' : 'warning'" size="small">
                      {{ kr.status === 'completed' ? '已完成' : kr.status === 'cancelled' ? '已取消' : '进行中' }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="整体进度" width="150">
            <template #default="{ row }">
              <el-progress :percentage="row.progress || 0" :status="row.progress >= 100 ? 'success' : ''" />
            </template>
          </el-table-column>
          <el-table-column prop="weight" label="权重" width="80" align="center" />
        </el-table>
        <el-empty v-if="!reviewData?.goals?.length" description="该年度暂无目标数据" />
      </el-card>

      <el-card class="card-shadow">
        <template #header>
          <div class="flex-between">
            <span class="card-header-title">复盘编辑器</span>
            <div class="flex gap-10 items-center">
              <el-tag v-if="autoSaveStatus === 'saved'" type="success" size="small">
                <el-icon><Check /></el-icon>
                已自动保存
              </el-tag>
              <el-tag v-else-if="autoSaveStatus === 'saving'" type="warning" size="small">
                <el-icon class="is-loading"><Loading /></el-icon>
                保存中...
              </el-tag>
              <el-tag v-else type="info" size="small">
                <el-icon><Edit /></el-icon>
                编辑中
              </el-tag>
              <el-switch
                v-model="reviewForm.is_completed"
                active-text="标记完成"
                @change="handleMarkComplete"
              />
            </div>
          </div>
        </template>

        <el-form :model="reviewForm" label-width="100px">
          <el-form-item label="年度总结">
            <el-input
              v-model="reviewForm.summary"
              type="textarea"
              :rows="4"
              placeholder="请总结这一年的整体情况..."
              @input="debouncedSave"
            />
          </el-form-item>
          <el-row :gutter="20">
            <el-col :sm="12">
              <el-form-item label="主要成就">
                <el-input
                  v-model="reviewForm.achievements"
                  type="textarea"
                  :rows="4"
                  placeholder="列出今年取得的主要成就..."
                  @input="debouncedSave"
                />
              </el-form-item>
            </el-col>
            <el-col :sm="12">
              <el-form-item label="关键事件">
                <el-input
                  v-model="reviewForm.key_events"
                  type="textarea"
                  :rows="4"
                  placeholder="记录今年发生的关键事件..."
                  @input="debouncedSave"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :sm="12">
              <el-form-item label="收获与成长">
                <el-input
                  v-model="reviewForm.harvest"
                  type="textarea"
                  :rows="4"
                  placeholder="今年收获了什么，获得了哪些成长..."
                  @input="debouncedSave"
                />
              </el-form-item>
            </el-col>
            <el-col :sm="12">
              <el-form-item label="遗憾与不足">
                <el-input
                  v-model="reviewForm.regrets"
                  type="textarea"
                  :rows="4"
                  placeholder="今年有哪些遗憾和不足..."
                  @input="debouncedSave"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :sm="12">
              <el-form-item label="经验教训">
                <el-input
                  v-model="reviewForm.lessons"
                  type="textarea"
                  :rows="4"
                  placeholder="从今年的经历中得到哪些经验教训..."
                  @input="debouncedSave"
                />
              </el-form-item>
            </el-col>
            <el-col :sm="12">
              <el-form-item label="下一年建议">
                <el-input
                  v-model="reviewForm.next_year_suggestions"
                  type="textarea"
                  :rows="4"
                  placeholder="对明年有什么建议和规划..."
                  @input="debouncedSave"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item>
            <el-button type="primary" @click="handleManualSave" :loading="saving">
              <el-icon><Save /></el-icon>
              手动保存
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deviationApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const saving = ref(false)
const selectedYear = ref(dayjs().format('YYYY'))
const reviewData = ref(null)
const autoSaveStatus = ref('idle')
let autoSaveTimer = null
let debounceTimer = null

const reviewForm = reactive({
  year: selectedYear.value,
  summary: '',
  achievements: '',
  key_events: '',
  harvest: '',
  regrets: '',
  lessons: '',
  next_year_suggestions: '',
  is_completed: false
})

const groupedGoals = computed(() => {
  if (!reviewData.value?.goals) return []
  return reviewData.value.goals
})

function formatHours(minutes) {
  if (!minutes) return '0h'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h${mins > 0 ? mins + 'm' : ''}` : `${mins}m`
}

async function fetchAnnualReview() {
  try {
    loading.value = true
    reviewData.value = await deviationApi.getAnnualReview(selectedYear.value)
    
    if (reviewData.value?.review) {
      Object.assign(reviewForm, {
        year: selectedYear.value,
        summary: reviewData.value.review.summary || '',
        achievements: reviewData.value.review.achievements || '',
        key_events: reviewData.value.review.key_events || '',
        harvest: reviewData.value.review.harvest || '',
        regrets: reviewData.value.review.regrets || '',
        lessons: reviewData.value.review.lessons || '',
        next_year_suggestions: reviewData.value.review.next_year_suggestions || '',
        is_completed: reviewData.value.review.is_completed === 1 || reviewData.value.review.is_completed === true
      })
    } else {
      Object.assign(reviewForm, {
        year: selectedYear.value,
        summary: '',
        achievements: '',
        key_events: '',
        harvest: '',
        regrets: '',
        lessons: '',
        next_year_suggestions: '',
        is_completed: false
      })
    }
  } catch (err) {
    ElMessage.error(err.message || '获取年度复盘数据失败')
  } finally {
    loading.value = false
  }
}

async function saveReview() {
  try {
    autoSaveStatus.value = 'saving'
    saving.value = true
    await deviationApi.saveAnnualReview({ ...reviewForm, year: selectedYear.value })
    autoSaveStatus.value = 'saved'
    setTimeout(() => {
      autoSaveStatus.value = 'idle'
    }, 2000)
    return true
  } catch (err) {
    autoSaveStatus.value = 'error'
    ElMessage.error(err.message || '保存失败')
    return false
  } finally {
    saving.value = false
  }
}

function debouncedSave() {
  if (debounceTimer) clearTimeout(debounceTimer)
  autoSaveStatus.value = 'idle'
  debounceTimer = setTimeout(() => {
    saveReview()
  }, 2000)
}

async function handleManualSave() {
  const success = await saveReview()
  if (success) {
    ElMessage.success('保存成功')
    await fetchAnnualReview()
  }
}

async function handleMarkComplete(val) {
  try {
    if (val) {
      await ElMessageBox.confirm(
        '标记完成后将锁定复盘内容，确定要标记为已完成吗？',
        '提示',
        { type: 'warning' }
      )
    }
    await saveReview()
    if (val) {
      ElMessage.success('已标记为完成')
    }
    await fetchAnnualReview()
  } catch (err) {
    reviewForm.is_completed = !val
  }
}

function handleYearChange() {
  reviewForm.year = selectedYear.value
  fetchAnnualReview()
}

onMounted(() => {
  fetchAnnualReview()
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
})
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.card-header-title {
  font-weight: 600;
  font-size: 16px;
}

.overview-card {
  transition: all 0.3s;
}

.overview-card:hover {
  transform: translateY(-2px);
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.bg-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.bg-success { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.bg-warning { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.bg-info { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }

.overview-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.overview-label {
  font-size: 13px;
  color: #909399;
}

.kr-list {
  max-height: 200px;
  overflow-y: auto;
}

.kr-item {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.kr-title {
  font-size: 13px;
  color: #606266;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mb-5 {
  margin-bottom: 5px;
}
</style>
