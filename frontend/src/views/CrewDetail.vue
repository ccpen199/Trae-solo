<template>
  <div>
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h2>乘务人员详情</h2>
      </div>
    </div>

    <el-card v-if="crew" class="card-container" style="margin-bottom: 20px;">
      <el-descriptions title="基本信息" :column="4" border>
        <el-descriptions-item label="工号">{{ crew.employee_no }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ crew.name }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ crew.gender }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ crew.phone }}</el-descriptions-item>
        <el-descriptions-item label="岗位">
          <el-tag>{{ crew.position }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所属车队">{{ crew.fleet_name }}</el-descriptions-item>
        <el-descriptions-item label="可排班范围">
          <el-tag type="info" size="small">{{ crew.schedule_scope || '未设置' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="健康状态">
          <el-tag :type="crew.health_status === 'normal' ? 'success' : 'warning'">
            {{ crew.health_status === 'normal' ? '正常' : '异常' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="crew.status === 'active' ? 'success' : 'info'">
            {{ crew.status === 'active' ? '在职' : '离职' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="入职日期">{{ crew.hire_date }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="20" style="margin-bottom: 20px;" v-if="schedulingInfo">
      <el-col :span="6">
        <el-card class="stat-card-small">
          <div class="stat-content-small">
            <div class="stat-icon-small blue">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info-small">
              <div class="stat-value-small" :class="{ 'text-red': schedulingInfo.monthly_hours > 160 }">
                {{ schedulingInfo.monthly_hours?.toFixed(1) }}h
              </div>
              <div class="stat-label-small">本月工时 (上限{{ schedulingInfo.max_monthly_hours }}h)</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card-small">
          <div class="stat-content-small">
            <div class="stat-icon-small" :class="schedulingInfo.consecutive_days >= schedulingInfo.max_consecutive_days ? 'red' : 'orange'">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info-small">
              <div class="stat-value-small" :class="{ 'text-red': schedulingInfo.consecutive_days >= schedulingInfo.max_consecutive_days }">
                {{ schedulingInfo.consecutive_days }} 天
              </div>
              <div class="stat-label-small">连续值乘 (上限{{ schedulingInfo.max_consecutive_days }}天)</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card-small">
          <div class="stat-content-small">
            <div class="stat-icon-small" :class="schedulingInfo.rest_hours_since_last < schedulingInfo.min_rest_hours ? 'red' : 'green'">
              <el-icon><Moon /></el-icon>
            </div>
            <div class="stat-info-small">
              <div class="stat-value-small" :class="{ 'text-red': schedulingInfo.rest_hours_since_last < schedulingInfo.min_rest_hours }">
                {{ schedulingInfo.rest_hours_since_last }}h
              </div>
              <div class="stat-label-small">距上次休息 (需≥{{ schedulingInfo.min_rest_hours }}h)</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card-small">
          <div class="stat-content-small">
            <div class="stat-icon-small" :class="schedulingInfo.upcoming_vacations?.length > 0 ? 'purple' : 'gray'">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="stat-info-small">
              <div class="stat-value-small">{{ schedulingInfo.upcoming_vacations?.length || 0 }} 次</div>
              <div class="stat-label-small">近期请假计划</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-bottom: 20px;" v-if="schedulingInfo">
      <el-col :span="12">
        <el-card class="card-container">
          <template #header>
            <span class="card-title">排班校验状态</span>
          </template>
          <div class="check-list">
            <div class="check-item">
              <div class="check-label">工时校验</div>
              <div class="check-result">
                <el-tag v-if="schedulingInfo.monthly_hours >= schedulingInfo.max_monthly_hours" type="danger">
                  已超限 {{ schedulingInfo.monthly_hours?.toFixed(1) }}h
                </el-tag>
                <el-tag v-else-if="schedulingInfo.monthly_hours >= 140" type="warning">
                  接近上限 {{ schedulingInfo.monthly_hours?.toFixed(1) }}h
                </el-tag>
                <el-tag v-else type="success">正常 {{ schedulingInfo.monthly_hours?.toFixed(1) }}h</el-tag>
              </div>
            </div>
            <div class="check-item">
              <div class="check-label">连续值乘</div>
              <div class="check-result">
                <el-tag v-if="schedulingInfo.consecutive_days >= schedulingInfo.max_consecutive_days" type="danger">
                  已超限 {{ schedulingInfo.consecutive_days }}天
                </el-tag>
                <el-tag v-else-if="schedulingInfo.consecutive_days >= 4" type="warning">
                  接近上限 {{ schedulingInfo.consecutive_days }}天
                </el-tag>
                <el-tag v-else type="success">正常 {{ schedulingInfo.consecutive_days }}天</el-tag>
              </div>
            </div>
            <div class="check-item">
              <div class="check-label">休息间隔</div>
              <div class="check-result">
                <el-tag v-if="schedulingInfo.rest_hours_since_last < schedulingInfo.min_rest_hours" type="danger">
                  休息不足 {{ schedulingInfo.rest_hours_since_last }}h
                </el-tag>
                <el-tag v-else type="success">休息充足 {{ schedulingInfo.rest_hours_since_last }}h</el-tag>
              </div>
            </div>
            <div class="check-item">
              <div class="check-label">请假冲突</div>
              <div class="check-result">
                <el-tag v-if="schedulingInfo.upcoming_vacations?.length > 0" type="warning">
                  有{{ schedulingInfo.upcoming_vacations.length }}次请假
                </el-tag>
                <el-tag v-else type="success">无请假冲突</el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-container">
          <template #header>
            <span class="card-title">近期值乘记录</span>
          </template>
          <el-table :data="schedulingInfo.recent_assignments?.slice(0, 8) || []" size="small">
            <el-table-column prop="schedule_date" label="日期" width="100" />
            <el-table-column prop="train_no" label="车次" width="80" />
            <el-table-column prop="departure_station" label="始发" width="80" />
            <el-table-column prop="arrival_station" label="终到" width="80" />
            <el-table-column prop="position" label="岗位" width="80" />
            <el-table-column prop="work_hours" label="工时" width="70" align="center" />
          </el-table>
          <el-empty v-if="!schedulingInfo.recent_assignments?.length" description="暂无值乘记录" />
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="资质证书" name="qualifications">
        <el-card class="card-container">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>资质列表</span>
              <el-button type="primary" size="small" @click="showQualDialog = true">
                <el-icon><Plus /></el-icon>
                添加资质
              </el-button>
            </div>
          </template>
          <el-table :data="crew?.qualifications || []" size="small">
            <el-table-column prop="type" label="资质类型" />
            <el-table-column prop="certificate_no" label="证书编号" />
            <el-table-column prop="issue_date" label="颁发日期" width="120" />
            <el-table-column prop="expiry_date" label="有效期至" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'valid' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'valid' ? '有效' : '失效' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="danger" link size="small" @click="deleteQualification(row.id)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!crew?.qualifications?.length" description="暂无资质证书" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="休假记录" name="vacations">
        <el-card class="card-container">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>休假记录</span>
              <el-button type="primary" size="small" @click="showVacDialog = true">
                <el-icon><Plus /></el-icon>
                添加休假
              </el-button>
            </div>
          </template>
          <el-table :data="crew?.vacations || []" size="small">
            <el-table-column prop="type" label="休假类型" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="start_date" label="开始日期" width="120" />
            <el-table-column prop="end_date" label="结束日期" width="120" />
            <el-table-column prop="reason" label="原因" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag type="success" size="small">已批准</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="danger" link size="small" @click="deleteVacation(row.id)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!crew?.vacations?.length" description="暂无休假记录" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="培训记录" name="trainings">
        <el-card class="card-container">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>培训记录</span>
              <el-button type="primary" size="small" @click="showTrainDialog = true">
                <el-icon><Plus /></el-icon>
                添加培训
              </el-button>
            </div>
          </template>
          <el-table :data="crew?.trainings || []" size="small">
            <el-table-column prop="course_name" label="课程名称" />
            <el-table-column prop="training_date" label="培训日期" width="120" />
            <el-table-column prop="result" label="结果" width="100">
              <template #default="{ row }">
                <el-tag :type="row.result === '优秀' ? 'success' : row.result === '合格' ? 'primary' : 'danger'" size="small">
                  {{ row.result }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="score" label="分数" width="100" align="center" />
          </el-table>
          <el-empty v-if="!crew?.trainings?.length" description="暂无培训记录" />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showQualDialog" title="添加资质" width="500px">
      <el-form :model="qualForm" label-width="100px">
        <el-form-item label="资质类型">
          <el-input v-model="qualForm.type" />
        </el-form-item>
        <el-form-item label="证书编号">
          <el-input v-model="qualForm.certificate_no" />
        </el-form-item>
        <el-form-item label="颁发日期">
          <el-date-picker v-model="qualForm.issue_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="有效期至">
          <el-date-picker v-model="qualForm.expiry_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showQualDialog = false">取消</el-button>
        <el-button type="primary" @click="addQualification">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showVacDialog" title="添加休假" width="500px">
      <el-form :model="vacForm" label-width="100px">
        <el-form-item label="休假类型">
          <el-select v-model="vacForm.type" style="width: 100%">
            <el-option label="年假" value="年假" />
            <el-option label="病假" value="病假" />
            <el-option label="事假" value="事假" />
            <el-option label="婚假" value="婚假" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="vacForm.start_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="vacForm.end_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="vacForm.reason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showVacDialog = false">取消</el-button>
        <el-button type="primary" @click="addVacation">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showTrainDialog" title="添加培训" width="500px">
      <el-form :model="trainForm" label-width="100px">
        <el-form-item label="课程名称">
          <el-input v-model="trainForm.course_name" />
        </el-form-item>
        <el-form-item label="培训日期">
          <el-date-picker v-model="trainForm.training_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结果">
          <el-select v-model="trainForm.result" style="width: 100%">
            <el-option label="合格" value="合格" />
            <el-option label="优秀" value="优秀" />
            <el-option label="不合格" value="不合格" />
          </el-select>
        </el-form-item>
        <el-form-item label="分数">
          <el-input-number v-model="trainForm.score" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTrainDialog = false">取消</el-button>
        <el-button type="primary" @click="addTraining">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { crewAPI } from '@/api'

const route = useRoute()
const router = useRouter()
const crewId = route.params.id

const crew = ref(null)
const schedulingInfo = ref(null)
const activeTab = ref('qualifications')
const showQualDialog = ref(false)
const showVacDialog = ref(false)
const showTrainDialog = ref(false)

const qualForm = ref({ type: '', certificate_no: '', issue_date: '', expiry_date: '' })
const vacForm = ref({ type: '', start_date: '', end_date: '', reason: '' })
const trainForm = ref({ course_name: '', training_date: '', result: '', score: 0 })

const loadCrewDetail = async () => {
  try {
    const [crewRes, schedRes] = await Promise.all([
      crewAPI.get(crewId),
      crewAPI.getSchedulingInfo(crewId)
    ])
    crew.value = crewRes.data
    schedulingInfo.value = schedRes.data
  } catch (error) {
    console.error(error)
    ElMessage.error('加载详情失败')
  }
}

const goBack = () => {
  router.push('/crew')
}

const addQualification = async () => {
  try {
    await crewAPI.addQualification(crewId, qualForm.value)
    ElMessage.success('添加成功')
    showQualDialog.value = false
    qualForm.value = { type: '', certificate_no: '', issue_date: '', expiry_date: '' }
    loadCrewDetail()
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const addVacation = async () => {
  try {
    await crewAPI.addVacation(crewId, vacForm.value)
    ElMessage.success('添加成功')
    showVacDialog.value = false
    vacForm.value = { type: '', start_date: '', end_date: '', reason: '' }
    loadCrewDetail()
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const addTraining = async () => {
  try {
    await crewAPI.addTraining(crewId, trainForm.value)
    ElMessage.success('添加成功')
    showTrainDialog.value = false
    trainForm.value = { course_name: '', training_date: '', result: '', score: 0 }
    loadCrewDetail()
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const deleteQualification = async (id) => {
  try {
    await crewAPI.deleteQualification(id)
    ElMessage.success('删除成功')
    loadCrewDetail()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const deleteVacation = async (id) => {
  try {
    await crewAPI.deleteVacation(id)
    ElMessage.success('删除成功')
    loadCrewDetail()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadCrewDetail()
})
</script>

<style scoped>
.stat-card-small {
  border-radius: 8px;
}

.stat-content-small {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon-small {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.stat-icon-small.blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.stat-icon-small.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-icon-small.green { background: linear-gradient(135deg, #10b981, #059669); }
.stat-icon-small.purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.stat-icon-small.red { background: linear-gradient(135deg, #ef4444, #dc2626); }
.stat-icon-small.gray { background: linear-gradient(135deg, #6b7280, #4b5563); }

.stat-info-small { flex: 1; min-width: 0; }
.stat-value-small { font-size: 20px; font-weight: 600; color: #1e293b; }
.stat-label-small { font-size: 11px; color: #64748b; margin-top: 2px; }

.text-red { color: #ef4444; font-weight: 600; }

.card-title { font-weight: 500; }

.check-list { padding: 10px 0; }
.check-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dashed #e5e7eb;
}
.check-item:last-child { border-bottom: none; }
.check-label { font-size: 14px; color: #374151; }
</style>
