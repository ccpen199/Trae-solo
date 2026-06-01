<template>
  <div class="alarm-desk">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="20" class="header-icon"><Phone /></el-icon>
          <span class="card-title">接警台 - 报警信息录入</span>
          <el-tag type="info" size="small">{{ currentTime }}</el-tag>
        </div>
      </template>

      <el-form
        ref="alarmFormRef"
        :model="alarmForm"
        :rules="alarmRules"
        label-width="120px"
        class="alarm-form"
      >
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="报警人" prop="caller_name">
              <el-input v-model="alarmForm.caller_name" placeholder="请输入报警人姓名" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报警电话" prop="caller_phone">
              <el-input v-model="alarmForm.caller_phone" placeholder="请输入报警电话" maxlength="20" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="灾种类型" prop="disaster_type">
              <el-select v-model="alarmForm.disaster_type" placeholder="请选择灾种类型" style="width: 100%">
                <el-option label="火灾" value="火灾" />
                <el-option label="救援" value="救援" />
                <el-option label="危化品火灾" value="危化品火灾" />
                <el-option label="社会救助" value="社会救助" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="灾种等级" prop="disaster_level">
              <el-radio-group v-model="alarmForm.disaster_level">
                <el-radio-button value="一般">
                  <span class="level-tag level-1">一般</span>
                </el-radio-button>
                <el-radio-button value="较大">
                  <span class="level-tag level-2">较大</span>
                </el-radio-button>
                <el-radio-button value="重大">
                  <span class="level-tag level-3">重大</span>
                </el-radio-button>
                <el-radio-button value="特别重大">
                  <span class="level-tag level-4">特别重大</span>
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="发生地点" prop="location">
          <el-input v-model="alarmForm.location" placeholder="请输入详细地址" maxlength="200" show-word-limit />
        </el-form-item>

        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="经度">
              <el-input v-model="alarmForm.lng" placeholder="经度" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="纬度">
              <el-input v-model="alarmForm.lat" placeholder="纬度" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="获取位置">
              <el-button type="primary" @click="getLocation">
                <el-icon><Location /></el-icon>
                定位
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="被困人数" prop="people_trapped">
              <el-input-number v-model="alarmForm.people_trapped" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="建筑类型" prop="building_type">
              <el-select v-model="alarmForm.building_type" placeholder="请选择建筑类型" style="width: 100%">
                <el-option label="高层建筑" value="高层建筑" />
                <el-option label="多层建筑" value="多层建筑" />
                <el-option label="地下空间" value="地下空间" />
                <el-option label="工业厂房" value="工业厂房" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="危险物品" prop="hazardous_materials">
              <el-input v-model="alarmForm.hazardous_materials" placeholder="危险品名称/无" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="录音索引" prop="recording_index">
              <el-input v-model="alarmForm.recording_index" placeholder="接警录音文件索引" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="接警员" prop="receiver">
              <el-input v-model="alarmForm.receiver" placeholder="请输入接警员姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注说明" prop="notes">
          <el-input
            v-model="alarmForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注说明（火灾原因、周边情况等）"
            maxlength="300"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" :loading="submitting" @click="submitAlarm">
            <el-icon><Check /></el-icon>
            确认接警
          </el-button>
          <el-button size="large" @click="resetForm">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
          <el-button type="success" size="large" @click="quickAlarm">
            <el-icon><Lightning /></el-icon>
            快速接警
          </el-button>
          <el-button type="info" size="large" @click="router.push('/dispatch')">
            <el-icon><Position /></el-icon>
            前往调度
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="recent-alarms-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span class="card-title">最近接警记录</span>
          <el-button type="primary" link @click="loadRecentAlarms">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      <el-table :data="recentAlarms" v-loading="loadingRecent" stripe max-height="350">
        <el-table-column prop="alarm_no" label="警情编号" width="140">
          <template #default="{ row }">
            <router-link :to="`/dispatch?alarmId=${row.id}`" class="alarm-link">{{ row.alarm_no }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="disaster_type" label="灾种" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.disaster_type)" size="small">{{ row.disaster_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="disaster_level" label="等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelTag(row.disaster_level)" size="small" effect="dark">{{ row.disaster_level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="发生地点" show-overflow-tooltip />
        <el-table-column prop="people_trapped" label="被困" width="70" align="center" />
        <el-table-column prop="building_type" label="建筑类型" width="100" />
        <el-table-column prop="caller_phone" label="报警电话" width="130" />
        <el-table-column prop="receiver" label="接警员" width="90" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Phone, Location, Check, RefreshLeft, Lightning, Refresh, Position } from '@element-plus/icons-vue'
import { createAlarm, getAlarmList } from '../api/index'

const router = useRouter()
const alarmFormRef = ref()
const submitting = ref(false)
const loadingRecent = ref(false)
const currentTime = ref('')
const recentAlarms = ref([])

const alarmForm = reactive({
  caller_name: '',
  caller_phone: '',
  location: '',
  lng: 116.403874,
  lat: 39.916666,
  disaster_type: '',
  disaster_level: '较大',
  people_trapped: 0,
  building_type: '',
  hazardous_materials: '',
  recording_index: '',
  receiver: '',
  notes: ''
})

const alarmRules = {
  caller_name: [{ required: true, message: '请输入报警人姓名', trigger: 'blur' }],
  caller_phone: [{ required: true, message: '请输入报警电话', trigger: 'blur' }],
  location: [{ required: true, message: '请输入发生地点', trigger: 'blur' }],
  disaster_type: [{ required: true, message: '请选择灾种类型', trigger: 'change' }],
  disaster_level: [{ required: true, message: '请选择灾种等级', trigger: 'change' }]
}

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

let timeInterval = null

const getLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        alarmForm.lng = Number(position.coords.longitude.toFixed(6))
        alarmForm.lat = Number(position.coords.latitude.toFixed(6))
        ElMessage.success('定位成功')
      },
      () => {
        ElMessage.warning('定位失败，请手动输入经纬度')
      }
    )
  } else {
    ElMessage.error('浏览器不支持定位功能')
  }
}

const submitAlarm = async () => {
  if (!alarmFormRef.value) return
  await alarmFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await ElMessageBox.confirm('确认提交该警情信息？提交后将进入调度研判。', '确认接警', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch {
        return
      }

      submitting.value = true
      try {
        const data = await createAlarm(alarmForm)
        ElMessage.success(`接警成功！警情编号：${data.alarm_no}`)
        resetForm()
        loadRecentAlarms()
      } catch (error) {
        console.error(error)
        ElMessage.error('接警失败，请重试')
      } finally {
        submitting.value = false
      }
    }
  })
}

const quickAlarm = async () => {
  alarmForm.disaster_type = '火灾'
  alarmForm.disaster_level = '较大'
  alarmForm.people_trapped = 0
  alarmForm.building_type = '其他'
  alarmForm.hazardous_materials = '无'
  alarmForm.caller_name = alarmForm.caller_name || '匿名'
  alarmForm.caller_phone = alarmForm.caller_phone || '119'
  alarmForm.location = alarmForm.location || '待确认'
  alarmForm.notes = '快速接警，请补充详情'
  submitAlarm()
}

const resetForm = () => {
  if (alarmFormRef.value) {
    alarmFormRef.value.resetFields()
  }
  alarmForm.caller_name = ''
  alarmForm.caller_phone = ''
  alarmForm.location = ''
  alarmForm.lng = 116.403874
  alarmForm.lat = 39.916666
  alarmForm.disaster_type = ''
  alarmForm.disaster_level = '较大'
  alarmForm.people_trapped = 0
  alarmForm.building_type = ''
  alarmForm.hazardous_materials = ''
  alarmForm.recording_index = ''
  alarmForm.receiver = ''
  alarmForm.notes = ''
}

const loadRecentAlarms = async () => {
  loadingRecent.value = true
  try {
    const data = await getAlarmList({ page: 1, page_size: 10 })
    recentAlarms.value = data.list || []
  } catch (error) {
    console.error('加载最近接警记录失败:', error)
    ElMessage.error('加载最近接警记录失败')
  } finally {
    loadingRecent.value = false
  }
}

const getTypeTag = (type) => {
  const map = { '火灾': 'danger', '救援': 'warning', '危化品火灾': 'danger', '社会救助': 'info', '其他': 'success' }
  return map[type] || 'info'
}

const getLevelTag = (level) => {
  const map = { '特别重大': 'danger', '重大': 'warning', '较大': '', '一般': 'info' }
  return map[level] || 'info'
}

const getStatusTag = (status) => {
  const map = { '待研判': 'warning', '处置中': 'primary', '已结束': 'success', '误报': 'info' }
  return map[status] || 'info'
}

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  loadRecentAlarms()
})

onBeforeUnmount(() => {
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<style scoped>
.alarm-desk { padding: 20px; }
.form-card, .recent-alarms-card { border-radius: 8px; }
.card-header { display: flex; align-items: center; gap: 8px; }
.header-icon { color: #409eff; }
.card-title { font-weight: 600; font-size: 18px; flex: 1; }
.alarm-form { padding: 20px 0; }
.level-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  color: white;
  font-weight: 500;
}
.level-1 { background: #67c23a; }
.level-2 { background: #909399; }
.level-3 { background: #e6a23c; }
.level-4 { background: #f56c6c; }
.alarm-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}
.alarm-link:hover { text-decoration: underline; }
</style>
