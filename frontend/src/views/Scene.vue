<template>
  <div class="scene">
    <el-row :gutter="20">
      <el-col :span="10">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">处置中警情</span>
              <el-button type="primary" size="small" @click="loadAlarmList">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <el-table
            :data="alarmList"
            v-loading="loadingList"
            stripe
            highlight-current-row
            @current-change="handleAlarmSelect"
            max-height="700"
          >
            <el-table-column prop="alarm_no" label="警情编号" width="140" />
            <el-table-column prop="disaster_type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="disasterTypeTag(row.disaster_type)" size="small">{{ row.disaster_type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="disaster_level" label="等级" width="70">
              <template #default="{ row }">
                <el-tag :type="disasterLevelTag(row.disaster_level)" size="small" effect="dark">{{ row.disaster_level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="地址" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag type="warning" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-if="total > 0"
            class="pagination"
            background
            layout="total, prev, pager, next"
            :total="total"
            :page-size="pageSize"
            :current-page="pageNum"
            @current-change="handlePageChange"
          />
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card class="form-card" v-loading="loadingDetail">
          <template #header>
            <div class="card-header">
              <span class="card-title">现场信息回传</span>
            </div>
          </template>

          <div v-if="selectedAlarm">
            <el-alert
              :closable="false"
              show-icon
              class="alarm-info"
            >
              <template #title>
                <span>编号: <b>{{ selectedAlarm.alarm_no }}</b></span>
                <el-divider direction="vertical" />
                <span>地址: {{ selectedAlarm.location }}</span>
                <el-divider direction="vertical" />
                <span>类型:
                  <el-tag :type="disasterTypeTag(selectedAlarm.disaster_type)" size="small">{{ selectedAlarm.disaster_type }}</el-tag>
                </span>
                <el-divider direction="vertical" />
                <span>等级:
                  <el-tag :type="disasterLevelTag(selectedAlarm.disaster_level)" size="small" effect="dark">{{ selectedAlarm.disaster_level }}</el-tag>
                </span>
              </template>
            </el-alert>

            <el-form
              ref="formRef"
              :model="form"
              :rules="formRules"
              label-width="110px"
              class="update-form"
            >
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="关联派遣" prop="dispatch_id">
                    <el-select v-model="form.dispatch_id" placeholder="请选择派遣" clearable style="width: 100%">
                      <el-option
                        v-for="d in dispatches"
                        :key="d.id"
                        :label="d.dispatch_no + (d.commander ? ' - ' + d.commander : '')"
                        :value="d.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="更新类型" prop="update_type">
                    <el-select v-model="form.update_type" placeholder="请选择更新类型" style="width: 100%">
                      <el-option label="火势报告" value="火势报告" />
                      <el-option label="救援进展" value="救援进展" />
                      <el-option label="增援请求" value="增援请求" />
                      <el-option label="伤亡报告" value="伤亡报告" />
                      <el-option label="处置结束" value="处置结束" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item v-if="form.update_type === '火势报告'" label="火势强度" prop="fire_intensity">
                <el-select v-model="form.fire_intensity" placeholder="请选择火势强度" style="width: 100%">
                  <el-option label="初起" value="初起" />
                  <el-option label="发展" value="发展" />
                  <el-option label="猛烈燃烧" value="猛烈燃烧" />
                  <el-option label="下降" value="下降" />
                  <el-option label="熄灭" value="熄灭" />
                </el-select>
              </el-form-item>

              <el-form-item v-if="form.update_type === '救援进展'" label="救援进展" prop="rescue_progress">
                <el-input
                  v-model="form.rescue_progress"
                  type="textarea"
                  :rows="3"
                  placeholder="请描述救援进展情况"
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item v-if="form.update_type === '增援请求'" label="增援请求" prop="reinforcement_request">
                <el-input
                  v-model="form.reinforcement_request"
                  type="textarea"
                  :rows="3"
                  placeholder="请描述需要增援的力量及装备"
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item v-if="form.update_type === '伤亡报告'" label="伤亡情况" prop="casualties">
                <el-input v-model="form.casualties" placeholder="请输入伤亡情况" />
              </el-form-item>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="报告人" prop="reporter">
                    <el-input v-model="form.reporter" placeholder="请输入报告人" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="报告时间">
                    <el-input :model-value="form.report_time" disabled />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="备注">
                <el-input
                  v-model="form.notes"
                  type="textarea"
                  :rows="2"
                  placeholder="补充备注信息"
                  maxlength="300"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" :loading="submitting" @click="handleSubmit">
                  <el-icon><Check /></el-icon>
                  提交回传
                </el-button>
                <el-button @click="resetForm">
                  <el-icon><RefreshLeft /></el-icon>
                  重置
                </el-button>
              </el-form-item>
            </el-form>

            <el-divider content-position="left">警情时间线</el-divider>
            <el-timeline v-if="timeline.length > 0">
              <el-timeline-item
                v-for="(evt, idx) in timeline"
                :key="idx"
                :timestamp="evt.event_time"
                :color="timelineColor(evt.event_type)"
                placement="top"
              >
                <el-tag :type="timelineTagType(evt.event_type)" size="small" class="timeline-tag">
                  {{ evt.event_type }}
                </el-tag>
                <span class="timeline-content">{{ evt.event_content }}</span>
                <span v-if="evt.operator" class="timeline-operator">（{{ evt.operator }}）</span>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无时间线记录" :image-size="80" />
          </div>

          <el-empty v-else description="请选择一条处置中的警情" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Check, RefreshLeft } from '@element-plus/icons-vue'
import { getAlarmList, getAlarmById, createSceneUpdate, getDispatchList } from '../api/index'

const loadingList = ref(false)
const loadingDetail = ref(false)
const submitting = ref(false)
const alarmList = ref([])
const selectedAlarm = ref(null)
const dispatches = ref([])
const timeline = ref([])
const formRef = ref()
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const form = reactive({
  dispatch_id: null,
  update_type: '',
  fire_intensity: null,
  rescue_progress: null,
  reinforcement_request: null,
  casualties: null,
  reporter: null,
  report_time: '',
  notes: null
})

const formRules = {
  update_type: [{ required: true, message: '请选择更新类型', trigger: 'change' }],
  fire_intensity: [{ required: true, message: '请选择火势强度', trigger: 'change' }],
  rescue_progress: [{ required: true, message: '请输入救援进展', trigger: 'blur' }],
  reinforcement_request: [{ required: true, message: '请输入增援请求', trigger: 'blur' }],
  casualties: [{ required: true, message: '请输入伤亡情况', trigger: 'blur' }]
}

const formatNow = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const loadAlarmList = async () => {
  loadingList.value = true
  try {
    const res = await getAlarmList({ status: '处置中', page: pageNum.value, page_size: pageSize.value })
    alarmList.value = res.list || []
    total.value = res.total || 0
  } catch {
    ElMessage.error('加载警情列表失败')
  } finally {
    loadingList.value = false
  }
}

const handleAlarmSelect = async (row) => {
  if (!row) return
  selectedAlarm.value = row
  loadingDetail.value = true
  try {
    const detail = await getAlarmById(row.id)
    selectedAlarm.value = detail
    dispatches.value = detail.dispatches || []
    timeline.value = detail.timeline || []
  } catch {
    ElMessage.error('加载警情详情失败')
  } finally {
    loadingDetail.value = false
  }
  resetFormFields()
}

const handlePageChange = (page) => {
  pageNum.value = page
  loadAlarmList()
}

const handleSubmit = async () => {
  if (!selectedAlarm.value) {
    ElMessage.warning('请先选择警情')
    return
  }
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  if (form.update_type === '处置结束') {
    try {
      await ElMessageBox.confirm(
        '确认该警情处置结束？提交后警情状态将变更为"已结束"。',
        '确认处置结束',
        { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      return
    }
  }

  submitting.value = true
  try {
    const payload = {
      alarm_id: selectedAlarm.value.id,
      dispatch_id: form.dispatch_id || null,
      update_type: form.update_type,
      report_time: form.report_time,
      reporter: form.reporter || null,
      notes: form.notes || null
    }
    if (form.update_type === '火势报告') {
      payload.fire_intensity = form.fire_intensity
    }
    if (form.update_type === '救援进展') {
      payload.rescue_progress = form.rescue_progress
    }
    if (form.update_type === '增援请求') {
      payload.reinforcement_request = form.reinforcement_request
    }
    if (form.update_type === '伤亡报告') {
      payload.casualties = form.casualties
    }

    await createSceneUpdate(payload)
    ElMessage.success('回传成功')

    if (form.update_type === '处置结束') {
      loadAlarmList()
      selectedAlarm.value = null
      dispatches.value = []
      timeline.value = []
      resetFormFields()
    } else {
      handleAlarmSelect(selectedAlarm.value)
      resetFormFields()
    }
  } catch {
    ElMessage.error('回传失败，请重试')
  } finally {
    submitting.value = false
  }
}

const resetFormFields = () => {
  form.dispatch_id = null
  form.update_type = ''
  form.fire_intensity = null
  form.rescue_progress = null
  form.reinforcement_request = null
  form.casualties = null
  form.reporter = null
  form.report_time = formatNow()
  form.notes = null
}

const resetForm = () => {
  resetFormFields()
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const disasterTypeTag = (type) => {
  const map = { '火灾': 'danger', '救援': 'warning', '社会救助': 'info', '其他': 'success' }
  return map[type] || 'info'
}

const disasterLevelTag = (level) => {
  const map = { '一级': 'danger', '二级': 'warning', '三级': '', '四级': 'info' }
  return map[level] || 'info'
}

const timelineColor = (eventType) => {
  const map = {
    '接警': '#f56c6c',
    '派警': '#409eff',
    '到场': '#67c23a',
    '火势报告': '#e6a23c',
    '救援进展': '#909399',
    '处置结束': '#67c23a'
  }
  return map[eventType] || '#409eff'
}

const timelineTagType = (eventType) => {
  const map = {
    '接警': 'danger',
    '派警': '',
    '到场': 'success',
    '火势报告': 'warning',
    '救援进展': 'info',
    '处置结束': 'success'
  }
  return map[eventType] || 'info'
}

onMounted(() => {
  loadAlarmList()
  form.report_time = formatNow()
})
</script>

<style scoped>
.scene {
  padding: 20px;
}
.list-card,
.form-card {
  border-radius: 8px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-weight: 600;
  font-size: 16px;
}
.alarm-info {
  margin-bottom: 20px;
}
.update-form {
  padding: 10px 0;
}
.pagination {
  margin-top: 20px;
  justify-content: center;
}
.timeline-tag {
  margin-right: 8px;
}
.timeline-content {
  color: #606266;
}
.timeline-operator {
  color: #909399;
  font-size: 13px;
  margin-left: 4px;
}
</style>
