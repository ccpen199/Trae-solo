<template>
  <div class="stats-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card total">
          <div class="stat-icon"><Document /></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.total_entries || 0 }}</div>
            <div class="stat-label">知识条目总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card today">
          <div class="stat-icon"><Calendar /></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.entries_today || 0 }}</div>
            <div class="stat-label">今日新增</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card week">
          <div class="stat-icon"><TrendCharts /></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.entries_this_week || 0 }}</div>
            <div class="stat-label">本周新增</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card review">
          <div class="stat-icon"><Bell /></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.pending_reviews || 0 }}</div>
            <div class="stat-label">待复习</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="8">
        <el-card class="stat-card orphan">
          <div class="stat-icon"><Connection /></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.orphan_entries || 0 }}</div>
            <div class="stat-label">孤立条目</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card conflict">
          <div class="stat-icon"><Warning /></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.conflict_count || 0 }}</div>
            <div class="stat-label">冲突总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card pending">
          <div class="stat-icon"><Clock /></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.pending_conflicts || 0 }}</div>
            <div class="stat-label">待处理冲突</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <h3>高频主题标签</h3>
          </template>
          <div class="tag-cloud">
            <div
              v-for="tag in stats?.top_tags || []"
              :key="tag.name"
              class="tag-item"
              :style="{ fontSize: getTagSize(tag.count) + 'px', backgroundColor: tag.color + '20', color: tag.color }"
            >
              {{ tag.name }} ({{ tag.count }})
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <h3>最近活动</h3>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in stats?.recent_activity?.slice(0, 10) || []"
              :key="index"
              :timestamp="formatDate(activity.created_at)"
              placement="top"
            >
              <el-tag :type="getActionType(activity.action)" size="small">
                {{ getActionText(activity.action) }}
              </el-tag>
              {{ activity.target_type }} #{{ activity.target_id }}
              <span v-if="activity.details?.title" class="activity-title">
                - {{ activity.details.title }}
              </span>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="!stats?.recent_activity?.length" description="暂无活动记录" />
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <h3>待复习提醒</h3>
      </template>
      <el-table :data="pendingReviews" v-loading="loadingReviews">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="entry_id" label="条目ID" width="80" />
        <el-table-column label="计划时间" width="180">
          <template #default="{ row }">{{ formatDate(row.scheduled_for) }}</template>
        </el-table-column>
        <el-table-column prop="interval_days" label="间隔天数" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="isOverdue(row) ? 'danger' : 'warning'">
              {{ isOverdue(row) ? '已逾期' : '待复习' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="markReviewed(row)">已复习</el-button>
            <el-button size="small" @click="skipReview(row)">跳过</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Calendar, TrendCharts, Bell, Connection, Warning, Clock } from '@element-plus/icons-vue'
import { getStats, listReviews, updateReviewStatus } from '@/api'

const stats = ref(null)
const pendingReviews = ref([])
const loadingReviews = ref(false)

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

function getTagSize(count) {
  return Math.min(24, 12 + count * 2)
}

function getActionType(action) {
  const map = { create: 'success', update: 'primary', delete: 'danger', create_share: 'warning', resolve_conflict: 'success' }
  return map[action] || 'info'
}

function getActionText(action) {
  const map = { create: '创建', update: '更新', delete: '删除', create_share: '分享', resolve_conflict: '解决冲突', create_conflict: '产生冲突' }
  return map[action] || action
}

function isOverdue(row) {
  return new Date(row.scheduled_for) < new Date()
}

async function loadStats() {
  try {
    stats.value = await getStats()
  } catch (e) {
    ElMessage.error('加载统计失败')
  }
}

async function loadReviews() {
  loadingReviews.value = true
  try {
    pendingReviews.value = await listReviews({ status: 'pending' })
  } catch (e) {
    ElMessage.error('加载复习提醒失败')
  } finally {
    loadingReviews.value = false
  }
}

async function markReviewed(reminder) {
  try {
    await updateReviewStatus(reminder.id, 'reviewed')
    ElMessage.success('已标记为已复习')
    loadStats()
    loadReviews()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

async function skipReview(reminder) {
  try {
    await updateReviewStatus(reminder.id, 'skipped')
    ElMessage.success('已跳过')
    loadReviews()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadStats()
  loadReviews()
})
</script>

<style scoped>
.stats-page {
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
}
.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
}
.stat-card.total .stat-icon { background: #409eff; }
.stat-card.today .stat-icon { background: #67c23a; }
.stat-card.week .stat-icon { background: #e6a23c; }
.stat-card.review .stat-icon { background: #f56c6c; }
.stat-card.orphan .stat-icon { background: #909399; }
.stat-card.conflict .stat-icon { background: #f56c6c; }
.stat-card.pending .stat-icon { background: #e6a23c; }
.stat-content {
  flex: 1;
}
.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}
.stat-label {
  color: #909399;
  font-size: 14px;
  margin-top: 5px;
}
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 20px 0;
}
.tag-item {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
  transition: transform 0.2s;
  cursor: pointer;
}
.tag-item:hover {
  transform: scale(1.05);
}
.activity-title {
  color: #666;
}
</style>
