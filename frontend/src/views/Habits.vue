<template>
  <div class="page-container">
    <div class="flex-between mb-20">
      <h2 class="page-title">习惯打卡</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        新增习惯
      </el-button>
    </div>

    <el-row :gutter="20" v-loading="loading">
      <el-col :span="24" v-if="habits.length === 0 && !loading">
        <el-empty description="暂无习惯，点击上方按钮添加第一个习惯吧" />
      </el-col>

      <el-col :xs="24" :sm="12" :lg="8" v-for="habit in habits" :key="habit.id">
        <el-card class="habit-card card-shadow mb-20" :class="{ 'checkin-animation': checkinAnimationId === habit.id }">
          <template #header>
            <div class="flex-between">
              <span class="habit-name">{{ habit.name }}</span>
              <el-tag :type="getFrequencyType(habit.frequency)" size="small">
                {{ habit.frequency === 'daily' ? '每日' : habit.frequency === 'weekly' ? '每周' : '每月' }}
              </el-tag>
            </div>
          </template>

          <div class="habit-stats mb-10">
            <div class="stat-item">
              <span class="stat-value text-success">{{ habit.streak }}</span>
              <span class="stat-label">连续打卡</span>
            </div>
            <div class="stat-item">
              <span class="stat-value text-primary">{{ habit.month_count }}</span>
              <span class="stat-label">本月打卡</span>
            </div>
            <div class="stat-item">
              <span class="stat-value text-warning">{{ habit.target_count }}</span>
              <span class="stat-label">目标次数</span>
            </div>
          </div>

          <div class="habit-desc mb-10" v-if="habit.description">
            {{ habit.description }}
          </div>

          <div class="calendar-heatmap mb-10">
            <div class="heatmap-week">
              <div
                v-for="day in 30"
                :key="day"
                class="heatmap-day"
                :class="getHeatmapClass(habit, day)"
                :title="getHeatmapTitle(habit, day)"
              ></div>
            </div>
            <div class="heatmap-legend">
              <span>30天前</span>
              <div class="legend-days">
                <div class="heatmap-day level-0"></div>
                <div class="heatmap-day level-1"></div>
                <div class="heatmap-day level-2"></div>
                <div class="heatmap-day level-3"></div>
              </div>
              <span>今天</span>
            </div>
          </div>

          <div class="flex-between">
            <el-button type="primary" :loading="checkingId === habit.id" @click="handleCheckin(habit)">
              <el-icon><Check /></el-icon>
              一键打卡
            </el-button>
            <el-button type="info" @click="toggleExpand(habit.id)">
              <el-icon><ArrowDown v-if="expandedId !== habit.id" /><ArrowUp v-else /></el-icon>
              详情
            </el-button>
          </div>

          <el-collapse-transition>
            <div v-show="expandedId === habit.id" class="checkin-records mt-20">
              <el-divider content-position="left">最近打卡记录</el-divider>
              <el-timeline>
                <el-timeline-item
                  v-for="record in habit.recent_checkins.slice(0, 10)"
                  :key="record.id"
                  :timestamp="record.checkin_date"
                  placement="top"
                >
                  <el-card shadow="never" class="record-card">
                    <div class="flex-between">
                      <span>打卡 {{ record.count || 1 }} {{ habit.unit || '次' }}</span>
                      <el-tag size="small" type="success">已完成</el-tag>
                    </div>
                    <div v-if="record.note" class="record-note mt-10">
                      {{ record.note }}
                    </div>
                  </el-card>
                </el-timeline-item>
                <el-empty v-if="habit.recent_checkins.length === 0" description="暂无打卡记录" :image-size="60" />
              </el-timeline>
            </div>
          </el-collapse-transition>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showAddDialog" title="新增习惯" width="500px">
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="100px">
        <el-form-item label="习惯名称" prop="name">
          <el-input v-model="addForm.name" placeholder="请输入习惯名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="addForm.description" type="textarea" :rows="2" placeholder="请输入习惯描述" />
        </el-form-item>
        <el-form-item label="频率" prop="frequency">
          <el-select v-model="addForm.frequency" placeholder="请选择频率" style="width: 100%">
            <el-option label="每日" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标次数" prop="target_count">
          <el-input-number v-model="addForm.target_count" :min="1" :max="365" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="addForm.unit" placeholder="如：次、分钟、公里" />
        </el-form-item>
        <el-form-item label="关联关键结果" prop="key_result_id">
          <el-select v-model="addForm.key_result_id" placeholder="可选，关联到关键结果" clearable style="width: 100%">
            <el-option
              v-for="kr in keyResults"
              :key="kr.id"
              :label="`${kr.title} (${kr.goal_title || ''})`"
              :value="kr.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddHabit" :loading="adding">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElForm } from 'element-plus'
import { executionApi, goalApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const adding = ref(false)
const checkingId = ref(null)
const checkinAnimationId = ref(null)
const expandedId = ref(null)
const showAddDialog = ref(false)
const addFormRef = ref()
const habits = ref([])
const keyResults = ref([])

const addForm = reactive({
  name: '',
  description: '',
  frequency: 'daily',
  target_count: 1,
  unit: '次',
  key_result_id: null
})

const addRules = {
  name: [{ required: true, message: '请输入习惯名称', trigger: 'blur' }],
  frequency: [{ required: true, message: '请选择频率', trigger: 'change' }],
  target_count: [{ required: true, message: '请输入目标次数', trigger: 'blur' }]
}

function getFrequencyType(frequency) {
  const map = { daily: 'success', weekly: 'primary', monthly: 'warning' }
  return map[frequency] || 'info'
}

function getHeatmapClass(habit, dayOffset) {
  const date = dayjs().subtract(30 - dayOffset, 'day').format('YYYY-MM-DD')
  const hasCheckin = habit.recent_checkins?.some(c => c.checkin_date === date)
  if (hasCheckin) {
    if (dayOffset >= 28) return 'level-3'
    if (dayOffset >= 20) return 'level-2'
    return 'level-1'
  }
  return 'level-0'
}

function getHeatmapTitle(habit, dayOffset) {
  const date = dayjs().subtract(30 - dayOffset, 'day').format('YYYY-MM-DD')
  const hasCheckin = habit.recent_checkins?.some(c => c.checkin_date === date)
  return `${date}: ${hasCheckin ? '已打卡' : '未打卡'}`
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

async function fetchHabits() {
  try {
    loading.value = true
    habits.value = await executionApi.getHabits()
  } catch (err) {
    ElMessage.error(err.message || '获取习惯列表失败')
  } finally {
    loading.value = false
  }
}

async function fetchKeyResults() {
  try {
    const goals = await goalApi.getGoals()
    const krs = []
    goals.forEach(goal => {
      if (goal.key_results) {
        goal.key_results.forEach(kr => {
          krs.push({ ...kr, goal_title: goal.title })
        })
      }
    })
    keyResults.value = krs
  } catch (err) {
    console.error('获取关键结果失败', err)
  }
}

async function handleAddHabit() {
  try {
    await addFormRef.value.validate()
    adding.value = true
    await executionApi.createHabit(addForm)
    ElMessage.success('习惯创建成功')
    showAddDialog.value = false
    Object.assign(addForm, {
      name: '',
      description: '',
      frequency: 'daily',
      target_count: 1,
      unit: '次',
      key_result_id: null
    })
    await fetchHabits()
  } catch (err) {
    if (err.message) ElMessage.error(err.message)
  } finally {
    adding.value = false
  }
}

async function handleCheckin(habit) {
  try {
    checkingId.value = habit.id
    const today = dayjs().format('YYYY-MM-DD')
    await executionApi.checkinHabit(habit.id, { checkin_date: today })
    checkinAnimationId.value = habit.id
    setTimeout(() => {
      checkinAnimationId.value = null
    }, 1000)
    ElMessage.success('打卡成功')
    await fetchHabits()
  } catch (err) {
    ElMessage.error(err.message || '打卡失败')
  } finally {
    checkingId.value = null
  }
}

onMounted(() => {
  fetchHabits()
  fetchKeyResults()
})
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.habit-card {
  transition: all 0.3s ease;
}

.habit-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.checkin-animation {
  animation: checkinPulse 1s ease;
}

@keyframes checkinPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); box-shadow: 0 0 20px rgba(103, 194, 58, 0.4); }
  100% { transform: scale(1); }
}

.habit-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.habit-stats {
  display: flex;
  justify-content: space-around;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.habit-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  min-height: 40px;
}

.calendar-heatmap {
  padding: 10px 0;
}

.heatmap-week {
  display: flex;
  gap: 3px;
  margin-bottom: 8px;
}

.heatmap-day {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background-color: #ebedf0;
  transition: all 0.2s;
}

.heatmap-day.level-0 { background-color: #ebedf0; }
.heatmap-day.level-1 { background-color: #c6e48b; }
.heatmap-day.level-2 { background-color: #7bc96f; }
.heatmap-day.level-3 { background-color: #239a3b; }

.heatmap-day:hover {
  transform: scale(1.5);
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  font-size: 11px;
  color: #909399;
}

.legend-days {
  display: flex;
  gap: 2px;
}

.record-card {
  border: none;
  background: #f5f7fa;
  padding: 8px 12px;
}

.record-note {
  font-size: 12px;
  color: #909399;
}

.text-primary {
  color: #409eff;
}
</style>
