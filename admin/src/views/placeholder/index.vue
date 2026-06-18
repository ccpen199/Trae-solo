<template>
  <div class="module-page">
    <section class="module-header">
      <div>
        <p class="module-kicker">郑州市掌上办事中枢</p>
        <h1>{{ title }}</h1>
        <p class="module-summary">{{ summary }}</p>
      </div>
      <el-tag type="success" size="large">运行中</el-tag>
    </section>

    <section class="metric-grid">
      <div v-for="item in metrics" :key="item.label" class="metric-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.note }}</small>
      </div>
    </section>

    <section class="work-panel">
      <div class="panel-title">
        <h2>业务概览</h2>
        <span>{{ today }}</span>
      </div>
      <el-table :data="rows" border>
        <el-table-column prop="name" label="事项" min-width="180" />
        <el-table-column prop="owner" label="责任单位" min-width="180" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => String(route.meta.title || '功能模块'))
const summary = computed(() => {
  if (route.name === 'NotFound') return '请求的页面不存在，已返回统一业务视图。'
  return `${title.value}数据已接入统一运营台，支持事项流转、状态跟踪和部门协同。`
})

const today = new Date().toLocaleString('zh-CN', { hour12: false })

const metrics = [
  { label: '今日办理', value: '286', note: '较昨日 +12%' },
  { label: '待协同', value: '34', note: '跨部门事项' },
  { label: '按时办结率', value: '98.6%', note: '近 7 日' },
  { label: '接口健康', value: '99.9%', note: '实时监测' }
]

const rows = computed(() => [
  { name: `${title.value}日常巡检`, owner: '郑州市大数据管理局', status: '进行中', type: 'primary', updatedAt: today },
  { name: `${title.value}数据同步`, owner: '市政务服务中心', status: '正常', type: 'success', updatedAt: today },
  { name: `${title.value}工单复核`, owner: '业务协同专班', status: '待处理', type: 'warning', updatedAt: today }
])
</script>

<style scoped lang="scss">
.module-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.module-header,
.work-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 24px;
}

.module-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.module-kicker {
  margin: 0 0 8px;
  color: var(--el-color-primary);
  font-weight: 600;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 24px;
  line-height: 1.3;
}

.module-summary {
  margin-top: 10px;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  min-height: 116px;
  padding: 18px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metric-card span,
.metric-card small,
.panel-title span {
  color: var(--el-text-color-secondary);
}

.metric-card strong {
  font-size: 28px;
  line-height: 1;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 960px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .module-header,
  .panel-title {
    flex-direction: column;
    align-items: flex-start;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
