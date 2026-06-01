<template>
  <div>
    <div class="page-header">
      <h2>统计报表</h2>
      <div style="display: flex; gap: 12px;">
        <el-date-picker
          v-model="dateRange"
          type="monthrange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始月份"
          end-placeholder="结束月份"
          style="width: 280px;"
        />
        <el-button type="primary" @click="showCaliberDialog">
          <el-icon><InfoFilled /></el-icon>
          统计口径
        </el-button>
        <el-dropdown @command="handleExportWithVerify">
          <el-button type="success">
            <el-icon><Download /></el-icon>
            导出报表
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="workload">人员负荷报表</el-dropdown-item>
              <el-dropdown-item command="violations">违规排班报表</el-dropdown-item>
              <el-dropdown-item command="all">综合统计报表</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="warning" @click="verifyExport">
          <el-icon><CircleCheck /></el-icon>
          导出核对
        </el-button>
        <el-button type="primary" @click="loadAllReports">
          <el-icon><Refresh /></el-icon>
          刷新报表
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="card-container" style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>人员负荷统计</span>
              <el-tag type="info" size="small">共 {{ workloadData.length }} 人</el-tag>
            </div>
          </template>
          <el-table :data="workloadData" size="small" max-height="400">
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="employee_no" label="工号" width="100" />
            <el-table-column prop="position" label="岗位" width="100" />
            <el-table-column prop="fleet_name" label="车队" width="100" />
            <el-table-column prop="schedule_count" label="排班次数" width="100" align="center" />
            <el-table-column prop="total_hours" label="总工时" width="100" align="center">
              <template #default="{ row }">
                <span :class="{ 'text-red': row.total_hours > 160 }">
                  {{ row.total_hours?.toFixed(1) || 0 }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="card-container" style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>车次覆盖情况</span>
              <el-tag type="success" size="small">{{ coverageData.coverage_rate || 0 }}%</el-tag>
            </div>
          </template>
          <div style="padding: 20px 0;">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="stat-box">
                  <div class="stat-num blue">{{ coverageData.total_trains || 0 }}</div>
                  <div class="stat-label">总车次</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-box">
                  <div class="stat-num green">{{ coverageData.fully_covered || 0 }}</div>
                  <div class="stat-label">完全覆盖</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-box">
                  <div class="stat-num orange">{{ coverageData.partially_covered || 0 }}</div>
                  <div class="stat-label">部分覆盖</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <el-card class="card-container">
          <template #header>
            <div class="card-header">
              <span>调班频次统计</span>
              <el-tag type="warning" size="small">{{ shiftChangeData.total_changes || 0 }} 次</el-tag>
            </div>
          </template>
          <div style="padding: 20px 0;">
            <el-table :data="shiftChangeData.details || []" size="small">
              <el-table-column prop="type" label="类型" width="120">
                <template #default="{ row }">{{ getChangeTypeText(row.type) }}</template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="count" label="数量" align="center" />
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="card-container" style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>缺员风险明细</span>
              <div style="display: flex; gap: 10px;">
                <el-tag type="danger" size="small">高风险: {{ highRiskCount }} 人</el-tag>
                <el-tag type="warning" size="small">休假中: {{ vacationCount }} 人</el-tag>
                <el-tag type="info" size="small">培训中: {{ trainingCount }} 人</el-tag>
                <el-tag type="danger" size="small">资质冲突: {{ qualificationConflictCount }} 人</el-tag>
              </div>
            </div>
          </template>
          <el-tabs v-model="shortageRiskTab" type="card">
            <el-tab-pane label="人员缺员明细" name="crew">
              <el-table :data="shortageRiskDetail" size="small" max-height="300">
                <el-table-column prop="name" label="姓名" width="100" />
                <el-table-column prop="employee_no" label="工号" width="100" />
                <el-table-column prop="position" label="岗位" width="100" />
                <el-table-column prop="fleet_name" label="车队" width="120" />
                <el-table-column prop="health_status" label="健康状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.health_status === 'normal' ? 'success' : 'warning'" size="small">
                      {{ row.health_status === 'normal' ? '正常' : '异常' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="on_vacation" label="休假" width="80" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.on_vacation > 0" type="warning" size="small">是</el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column prop="on_training" label="培训" width="80" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.on_training > 0" type="info" size="small">是</el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="可排班范围" min-width="150">
                  <template #default="{ row }">
                    <el-tag v-for="(scope, idx) in row.schedule_scope" :key="idx" size="small" style="margin-right: 4px;">
                      {{ scope }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="qualification_conflict" label="资质冲突" width="100">
                  <template #default="{ row }">
                    <el-tag v-if="row.qualification_conflict" type="danger" size="small">有冲突</el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column prop="assigned_count" label="已排班" width="80" align="center" />
                <el-table-column prop="risk_note" label="风险说明" min-width="120">
                  <template #default="{ row }">
                    <el-tag :type="row.is_available ? 'success' : 'danger'" size="small">
                      {{ row.risk_note }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80">
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="viewCrewRiskDetail(row)">
                      详情
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="车次岗位缺口" name="gaps">
              <el-table :data="routeGaps" size="small" max-height="300">
                <el-table-column prop="route_name" label="线路名称" width="150" />
                <el-table-column prop="position" label="岗位" width="100" />
                <el-table-column prop="required" label="需求人数" width="100" align="center" />
                <el-table-column prop="assigned" label="已排人数" width="100" align="center" />
                <el-table-column prop="gap" label="缺口数" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag type="danger" size="small">{{ row.gap }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="缺口优先级" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.gap > 5 ? 'danger' : row.gap > 2 ? 'warning' : 'info'" size="small">
                      {{ row.gap > 5 ? '紧急' : row.gap > 2 ? '高' : '中' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="资质冲突明细" name="conflicts">
              <el-table :data="qualificationConflicts" size="small" max-height="300">
                <el-table-column prop="crew_name" label="乘务员" width="100" />
                <el-table-column prop="position" label="岗位" width="100" />
                <el-table-column label="冲突详情" min-width="200">
                  <template #default="{ row }">
                    <el-tag v-for="(conflict, idx) in row.conflicts" :key="idx" type="danger" size="small" style="margin-right: 4px;">
                      {{ conflict }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="影响线路" width="150">
                  <template #default="{ row }">
                    <span class="impact-text">影响对应线路值乘资格</span>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="qualificationConflicts.length === 0" description="暂无资质冲突" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="card-container" style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>违规排班预警</span>
              <div style="display: flex; gap: 10px;">
                <el-tag type="danger" size="small">待处理: {{ pendingViolations }}</el-tag>
                <el-tag type="success" size="small">已处理: {{ resolvedViolations }}</el-tag>
              </div>
            </div>
          </template>
          <el-table :data="violations" size="small" v-loading="loading">
            <el-table-column prop="type" label="违规类型" width="150">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="crew_name" label="乘务员" width="100" />
            <el-table-column prop="description" label="详细说明" min-width="200" />
            <el-table-column prop="value" label="数值" width="100" align="center" />
            <el-table-column prop="review_status" label="复查状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.review_status === 'resolved' ? 'success' : 'warning'" size="small">
                  {{ row.review_status === 'resolved' ? '已复查' : '待复查' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="handle_result" label="处理结果" width="120">
              <template #default="{ row }">{{ row.handle_result || '-' }}</template>
            </el-table-column>
            <el-table-column prop="adjusted_schedule" label="调整排班" min-width="150">
              <template #default="{ row }">{{ row.adjusted_schedule || '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.review_status !== 'resolved'" type="primary" link size="small" @click="handleReview(row)">
                  复查
                </el-button>
                <el-button v-else type="primary" link size="small" @click="viewReview(row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="violations.length === 0" description="暂无违规记录" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="card-container">
          <template #header>
            <div class="card-header">
              <span>违规排班复查记录</span>
              <el-tag type="success" size="small">已闭环: {{ violationReviews.length }} 条</el-tag>
            </div>
          </template>
          <el-table :data="violationReviews" size="small" max-height="300">
            <el-table-column prop="violation_type" label="违规类型" width="150" />
            <el-table-column prop="crew_name" label="乘务员" width="100" />
            <el-table-column prop="description" label="违规说明" min-width="200" />
            <el-table-column prop="reviewer" label="复查人" width="100" />
            <el-table-column prop="review_time" label="复查时间" width="180" />
            <el-table-column prop="handle_result" label="处理结果" min-width="150" />
            <el-table-column prop="adjusted_schedule" label="调整排班" min-width="150" />
            <el-table-column prop="remark" label="备注" min-width="150" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="caliberDialogVisible" title="统计口径说明" width="700px">
      <div v-if="statisticsCaliber">
        <el-alert type="info" :title="`统计月份: ${statisticsCaliber.month}`" style="margin-bottom: 20px;" />
        <div v-for="(value, key) in statisticsCaliber.caliber" :key="key" class="caliber-item">
          <h4>{{ key }}</h4>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item v-for="(itemValue, itemKey) in value" :key="itemKey" :label="itemKey">
              {{ itemValue }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="reviewDialogVisible" title="违规复查" width="600px">
      <el-form v-if="currentViolation" :model="reviewForm" label-width="100px">
        <el-form-item label="违规类型">
          <el-tag type="danger">{{ currentViolation.type }}</el-tag>
        </el-form-item>
        <el-form-item label="乘务员">{{ currentViolation.crew_name }}</el-form-item>
        <el-form-item label="违规说明">{{ currentViolation.description }}</el-form-item>
        <el-form-item label="处理结果">
          <el-select v-model="reviewForm.handle_result" style="width: 100%">
            <el-option label="已调整排班" value="已调整排班" />
            <el-option label="已安排休息" value="已安排休息" />
            <el-option label="已重新分配车次" value="已重新分配车次" />
            <el-option label="特殊情况豁免" value="特殊情况豁免" />
          </el-select>
        </el-form-item>
        <el-form-item label="调整说明">
          <el-input v-model="reviewForm.adjusted_schedule" type="textarea" :rows="3" placeholder="请说明调整后的排班方案" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="reviewForm.remark" type="textarea" :rows="2" placeholder="备注说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReview">确认复查</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="crewRiskDetailVisible" title="人员缺员风险详情" width="700px">
      <el-descriptions v-if="currentCrewRisk" :column="2" border size="small">
        <el-descriptions-item label="姓名">{{ currentCrewRisk.name }}</el-descriptions-item>
        <el-descriptions-item label="工号">{{ currentCrewRisk.employee_no }}</el-descriptions-item>
        <el-descriptions-item label="岗位">{{ currentCrewRisk.position }}</el-descriptions-item>
        <el-descriptions-item label="车队">{{ currentCrewRisk.fleet_name }}</el-descriptions-item>
        <el-descriptions-item label="健康状态">
          <el-tag :type="currentCrewRisk.health_status === 'normal' ? 'success' : 'warning'">
            {{ currentCrewRisk.health_status === 'normal' ? '正常' : '异常' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="可用性">
          <el-tag :type="currentCrewRisk.is_available ? 'success' : 'danger'">
            {{ currentCrewRisk.is_available ? '可用' : '不可用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="可排班范围" :span="2">
          <el-tag v-for="(scope, idx) in currentCrewRisk.schedule_scope" :key="idx" size="small" style="margin-right: 4px;">
            {{ scope }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="风险说明" :span="2">{{ currentCrewRisk.risk_note }}</el-descriptions-item>
      </el-descriptions>
      <el-divider v-if="currentCrewRisk?.qualifications" content-position="left">资质信息</el-divider>
      <el-table v-if="currentCrewRisk?.qualifications" :data="currentCrewRisk.qualifications" size="small">
        <el-table-column prop="qualification_type" label="资质类型" width="150" />
        <el-table-column prop="expiry_date" label="到期日期" width="120" />
        <el-table-column prop="qualification_status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.qualification_status === 'valid' ? 'success' : 'danger'" size="small">
              {{ row.qualification_status === 'valid' ? '有效' : '无效' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="exportVerifyVisible" title="导出核对结果" width="500px">
      <el-result v-if="exportVerifyResult" :icon="exportVerifyResult.verified ? 'success' : 'warning'" :title="exportVerifyResult.message">
        <template #subTitle>
          <div class="verify-detail">
            <p>客户端校验值: {{ exportVerifyResult.client_checksum }}</p>
            <p>服务端校验值: {{ exportVerifyResult.server_checksum }}</p>
            <p>客户端记录数: {{ exportVerifyResult.client_count }}</p>
            <p>服务端记录数: {{ exportVerifyResult.server_count }}</p>
          </div>
        </template>
        <template #extra>
          <el-button type="primary" @click="exportVerifyVisible = false">确定</el-button>
        </template>
      </el-result>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { reportsAPI } from '@/api'

const dateRange = ref([])
const loading = ref(false)
const workloadData = ref([])
const coverageData = ref({})
const shiftChangeData = ref({})
const violations = ref([])
const shortageRiskDetail = ref([])
const routeGaps = ref([])
const qualificationConflicts = ref([])
const violationReviews = ref([])
const statisticsCaliber = ref(null)
const caliberDialogVisible = ref(false)
const reviewDialogVisible = ref(false)
const currentViolation = ref(null)
const reviewForm = ref({
  handle_result: '',
  adjusted_schedule: '',
  remark: ''
})
const shortageRiskTab = ref('crew')
const crewRiskDetailVisible = ref(false)
const currentCrewRisk = ref(null)
const exportVerifyVisible = ref(false)
const exportVerifyResult = ref(null)
const lastExportData = ref(null)

const highRiskCount = computed(() => shortageRiskDetail.value.filter(c => !c.is_available).length)
const vacationCount = computed(() => shortageRiskDetail.value.filter(c => c.on_vacation > 0).length)
const trainingCount = computed(() => shortageRiskDetail.value.filter(c => c.on_training > 0).length)
const qualificationConflictCount = computed(() => shortageRiskDetail.value.filter(c => c.qualification_conflict).length)
const pendingViolations = computed(() => violations.value.filter(v => v.review_status === 'pending').length)
const resolvedViolations = computed(() => violations.value.filter(v => v.review_status === 'resolved').length)

const getChangeTypeText = (type) => {
  const types = {
    'swap': '换班',
    'replace': '补班',
    'extra': '临时加开',
    'shortage': '缺员处置'
  }
  return types[type] || type
}

const getStatusType = (status) => {
  const types = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { pending: '待审批', approved: '已批准', rejected: '已拒绝' }
  return texts[status] || status
}

const loadAllReports = async () => {
  loading.value = true
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }

    const [workRes, coverRes, shiftRes, violRes, shortageRes, reviewsRes] = await Promise.all([
      reportsAPI.workload(params),
      reportsAPI.coverage(params),
      reportsAPI.shiftChanges(params),
      reportsAPI.violations(params),
      reportsAPI.shortageRiskDetail(params),
      reportsAPI.violationReviews(params)
    ])

    workloadData.value = workRes.data
    coverageData.value = coverRes.data
    shiftChangeData.value = shiftRes.data
    violations.value = violRes.data
    
    if (shortageRes.data.crew_detail) {
      shortageRiskDetail.value = shortageRes.data.crew_detail
      routeGaps.value = shortageRes.data.route_gaps || []
      qualificationConflicts.value = shortageRes.data.qualification_conflicts || []
    } else {
      shortageRiskDetail.value = shortageRes.data
      routeGaps.value = []
      qualificationConflicts.value = []
    }
    
    violationReviews.value = reviewsRes.data
  } catch (error) {
    console.error('Load reports error:', error)
    ElMessage.error('加载报表失败')
  } finally {
    loading.value = false
  }
}

const showCaliberDialog = async () => {
  try {
    const res = await reportsAPI.statisticsCaliber()
    statisticsCaliber.value = res.data
    caliberDialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载统计口径失败')
  }
}

const handleExport = async (type) => {
  try {
    const params = { type }
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    
    const res = await reportsAPI.export(params)
    const blob = new Blob([res.data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `报表_${type}_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const handleReview = (row) => {
  currentViolation.value = row
  reviewForm.value = {
    handle_result: '',
    adjusted_schedule: '',
    remark: ''
  }
  reviewDialogVisible.value = true
}

const viewReview = (row) => {
  currentViolation.value = row
  reviewForm.value = {
    handle_result: row.handle_result,
    adjusted_schedule: row.adjusted_schedule,
    remark: row.remark || ''
  }
  reviewDialogVisible.value = true
}

const submitReview = async () => {
  try {
    await reportsAPI.reviewViolation(currentViolation.value.id, {
      handle_result: reviewForm.value.handle_result,
      adjusted_schedule: reviewForm.value.adjusted_schedule,
      remark: reviewForm.value.remark,
      crew_id: currentViolation.value.crew_id,
      crew_name: currentViolation.value.crew_name,
      violation_type: currentViolation.value.type,
      description: currentViolation.value.description
    })
    
    const idx = violations.value.findIndex(v => v.id === currentViolation.value.id)
    if (idx > -1) {
      violations.value[idx].review_status = 'resolved'
      violations.value[idx].handle_result = reviewForm.value.handle_result
      violations.value[idx].adjusted_schedule = reviewForm.value.adjusted_schedule
      violations.value[idx].remark = reviewForm.value.remark
    }
    
    await loadAllReports()
    ElMessage.success('复查完成，状态已回写')
    reviewDialogVisible.value = false
  } catch (error) {
    ElMessage.error('复查提交失败')
  }
}

const viewCrewRiskDetail = (row) => {
  currentCrewRisk.value = row
  crewRiskDetailVisible.value = true
}

const handleExportWithVerify = async (type) => {
  try {
    const params = { type }
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    
    const res = await reportsAPI.export(params)
    const blob = new Blob([res.data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `报表_${type}_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        lastExportData.value = {
          type,
          checksum: data.checksum,
          record_count: data.record_count,
          start_date: params.start_date,
          end_date: params.end_date
        }
      } catch (err) {
        console.error('Parse export data error:', err)
      }
    }
    reader.readAsText(blob)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const verifyExport = async () => {
  if (!lastExportData.value) {
    ElMessage.warning('请先导出报表再进行核对')
    return
  }
  
  try {
    const res = await reportsAPI.verifyExport(lastExportData.value)
    exportVerifyResult.value = res.data
    exportVerifyVisible.value = true
  } catch (error) {
    ElMessage.error('核对失败')
  }
}

onMounted(() => {
  loadAllReports()
})
</script>

<style scoped>
.stat-box {
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-num {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 8px;
}

.stat-num.blue { color: #3b82f6; }
.stat-num.green { color: #10b981; }
.stat-num.orange { color: #f59e0b; }
.stat-num.purple { color: #8b5cf6; }

.stat-label {
  font-size: 14px;
  color: #64748b;
}

.text-red {
  color: #ef4444;
  font-weight: 600;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.caliber-item {
  margin-bottom: 20px;
}

.caliber-item h4 {
  margin: 0 0 10px 0;
  color: #374151;
}

.impact-text {
  font-size: 12px;
  color: #f59e0b;
}

.verify-detail p {
  margin: 5px 0;
  font-size: 14px;
  color: #64748b;
}
</style>
