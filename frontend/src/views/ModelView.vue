<template>
  <div class="model-view">
    <h2 class="page-title">模型视图</h2>
    
    <el-row :gutter="20">
      <el-col :span="18">
        <el-card class="model-card">
          <template #header>
            <div class="card-header">
              <span>BIM 模型预览</span>
              <div class="model-controls">
                <el-button-group>
                  <el-button size="small" :type="viewMode === '3d' ? 'primary' : ''" @click="viewMode = '3d'">3D视图</el-button>
                  <el-button size="small" :type="viewMode === 'plan' ? 'primary' : ''" @click="viewMode = 'plan'">平面图</el-button>
                </el-button-group>
                <el-select v-model="selectedFloor" size="small" placeholder="选择楼层" style="width: 120px; margin-left: 12px">
                  <el-option v-for="f in floors" :key="f" :label="f" :value="f" />
                </el-select>
              </div>
            </div>
          </template>
          <div class="model-canvas">
            <div class="model-placeholder">
              <el-icon size="80" color="#dcdfe6"><Box /></el-icon>
              <p class="model-text">BIM 模型预览区域</p>
              <p class="model-subtext">当前显示: {{ selectedFloor }} - {{ viewModeText }}</p>
              <div v-if="selectedIssue" class="issue-highlight">
                <el-tag type="danger" size="large">
                  问题定位: #{{ selectedIssue.id }} {{ selectedIssue.title }}
                </el-tag>
              </div>
            </div>
            <div class="issue-markers">
              <div
                v-for="issue in floorIssues"
                :key="issue.id"
                class="marker"
                :class="['marker-' + issue.severity, { active: selectedIssue?.id === issue.id }]"
                :style="{ left: getMarkerX(issue) + '%', top: getMarkerY(issue) + '%' }"
                @click="selectIssue(issue)"
              >
                <el-tooltip :content="issue.title" placement="top">
                  <el-icon><Warning /></el-icon>
                </el-tooltip>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="filter-card">
          <template #header>
            <span>问题筛选</span>
          </template>
          <el-form label-width="80px" size="small">
            <el-form-item label="专业">
              <el-select v-model="filter.specialty" clearable placeholder="全部" style="width: 100%">
                <el-option v-for="s in specialties" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="filter.status" clearable placeholder="全部" style="width: 100%">
                <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="严重程度">
              <el-select v-model="filter.severity" clearable placeholder="全部" style="width: 100%">
                <el-option v-for="s in severityOptions" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" @click="loadIssues" style="width: 100%">筛选</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="list-card">
          <template #header>
            <span>问题列表 ({{ floorIssues.length }})</span>
          </template>
          <div class="issue-list">
            <div
              v-for="issue in floorIssues"
              :key="issue.id"
              class="issue-item"
              :class="{ active: selectedIssue?.id === issue.id }"
              @click="selectIssue(issue)"
            >
              <div class="issue-header">
                <el-tag :type="severityTypeMap[issue.severity]" size="small">#{{ issue.id }}</el-tag>
                <el-tag :type="statusTypeMap[issue.status]" size="small">{{ statusMap[issue.status] }}</el-tag>
              </div>
              <div class="issue-title">{{ issue.title }}</div>
              <div class="issue-meta">
                <span>{{ specialtyMap[issue.specialty] || '-' }}</span>
                <span>{{ issue.floor }}</span>
              </div>
            </div>
            <el-empty v-if="floorIssues.length === 0" description="该楼层暂无问题" :image-size="80" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { issuesAPI } from '../api'

const viewMode = ref('3d')
const selectedFloor = ref('3F')
const selectedIssue = ref(null)
const issues = ref([])

const filter = ref({
  specialty: '',
  status: '',
  severity: ''
})

const floors = ['B1', '1F', '2F', '3F', '4F', '5F', 'RF']

const viewModeText = computed(() => {
  return viewMode.value === '3d' ? '三维视图' : '平面视图'
})

const specialties = [
  { value: 'architecture', label: '建筑' },
  { value: 'structure', label: '结构' },
  { value: 'mep', label: '机电' },
  { value: 'civil', label: '土建' }
]

const statusOptions = [
  { value: 'pending', label: '待派发' },
  { value: 'assigned', label: '已派发' },
  { value: 'fixed', label: '待复验' },
  { value: 'verified', label: '已验收' }
]

const severityOptions = [
  { value: 'critical', label: '严重' },
  { value: 'major', label: '主要' },
  { value: 'minor', label: '次要' }
]

const statusMap = {
  pending: '待派发',
  assigned: '已派发',
  fixed: '待复验',
  verified: '已验收',
  closed: '已关闭'
}

const statusTypeMap = {
  pending: 'warning',
  assigned: 'primary',
  fixed: 'success',
  verified: 'success',
  closed: 'info'
}

const specialtyMap = {
  architecture: '建筑',
  structure: '结构',
  mep: '机电',
  civil: '土建'
}

const severityTypeMap = {
  critical: 'danger',
  major: 'warning',
  minor: 'primary',
  trivial: 'info'
}

const floorIssues = computed(() => {
  return issues.value.filter(i => {
    if (i.floor !== selectedFloor.value) return false
    if (filter.value.specialty && i.specialty !== filter.value.specialty) return false
    if (filter.value.status && i.status !== filter.value.status) return false
    if (filter.value.severity && i.severity !== filter.value.severity) return false
    return true
  })
})

const getMarkerX = (issue) => {
  return 20 + (issue.id * 17) % 60
}

const getMarkerY = (issue) => {
  return 20 + (issue.id * 23) % 60
}

const loadIssues = async () => {
  try {
    const res = await issuesAPI.list({})
    issues.value = res.data
  } catch (e) {
    console.error('加载问题失败', e)
  }
}

const selectIssue = (issue) => {
  selectedIssue.value = issue
}

onMounted(() => {
  loadIssues()
})
</script>

<style scoped>
.model-view {
  padding-bottom: 20px;
}
.page-title {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.model-controls {
  display: flex;
  align-items: center;
}
.model-card {
  height: calc(100vh - 160px);
  min-height: 500px;
}
.model-card :deep(.el-card__body) {
  height: calc(100% - 57px);
  padding: 0;
}
.model-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}
.model-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.8);
}
.model-text {
  font-size: 18px;
  margin: 16px 0 8px;
}
.model-subtext {
  font-size: 14px;
  opacity: 0.7;
}
.issue-highlight {
  margin-top: 20px;
}
.issue-markers {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.marker {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  pointer-events: auto;
  transform: translate(-50%, -50%);
  transition: all 0.3s;
}
.marker:hover {
  transform: translate(-50%, -50%) scale(1.2);
}
.marker.active {
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}
.marker-critical {
  background: #f56c6c;
}
.marker-major {
  background: #e6a23c;
}
.marker-minor {
  background: #409eff;
}
.marker-trivial {
  background: #909399;
}
.filter-card {
  margin-bottom: 20px;
}
.list-card {
  height: calc(100vh - 420px);
  min-height: 300px;
}
.list-card :deep(.el-card__body) {
  height: calc(100% - 57px);
  overflow-y: auto;
  padding: 10px;
}
.issue-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.issue-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}
.issue-item:hover {
  background: #ecf5ff;
}
.issue-item.active {
  background: #ecf5ff;
  border-color: #409eff;
}
.issue-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.issue-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 6px;
  font-weight: 500;
}
.issue-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}
</style>
