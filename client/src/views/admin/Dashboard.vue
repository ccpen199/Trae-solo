<template>
  <div class="admin-dashboard">
    <h2>管理面板</h2>
    
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon users">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon questions">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalQuestions }}</div>
            <div class="stat-label">总问题数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon answers">
            <el-icon><Edit /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalAnswers }}</div>
            <div class="stat-label">总回答数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon knowledge">
            <el-icon><Collection /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalKnowledge }}</div>
            <div class="stat-label">知识节点</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>待处理事项</span>
          </template>
          <el-table :data="pendingItems" size="small">
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.type === 'report' ? 'danger' : 'warning'" size="small">
                  {{ row.type === 'report' ? '举报' : '审核' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="内容" />
            <el-table-column prop="time" label="时间" width="150" />
            <el-table-column label="操作" width="100">
              <template #default>
                <el-button type="primary" link size="small">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>工作流统计</span>
          </template>
          <el-table :data="workflowStats" size="small">
            <el-table-column prop="stage" label="阶段" />
            <el-table-column prop="count" label="数量" />
            <el-table-column prop="percentage" label="占比">
              <template #default="{ row }">
                <el-progress :percentage="row.percentage" :stroke-width="10" :show-text="false" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const stats = ref({
  totalUsers: 1256,
  totalQuestions: 3428,
  totalAnswers: 8921,
  totalKnowledge: 567
})

const pendingItems = ref([
  { type: 'report', content: '用户举报：涉嫌抄袭', time: '2024-01-15 10:30' },
  { type: 'moderation', content: '问题待审核：关于XXX技术', time: '2024-01-15 09:45' },
  { type: 'report', content: '用户举报：恶意刷票', time: '2024-01-14 16:20' }
])

const workflowStats = ref([
  { stage: '业务请求', count: 45, percentage: 25 },
  { stage: '处理工单', count: 36, percentage: 20 },
  { stage: '关联凭证', count: 72, percentage: 40 },
  { stage: '结果确认', count: 18, percentage: 10 },
  { stage: '归档记录', count: 9, percentage: 5 }
])
</script>

<style lang="scss" scoped>
.admin-dashboard {
  h2 {
    margin-bottom: 20px;
    font-size: 20px;
  }
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;

  &.users {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &.questions {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &.answers {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  &.knowledge {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}
</style>
