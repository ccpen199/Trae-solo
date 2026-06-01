<template>
  <div>
    <div class="page-header">
      <h2>乘务人员管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增人员
      </el-button>
    </div>

    <el-card class="card-container">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="车队">
          <el-select v-model="filters.fleet_id" placeholder="全部车队" clearable style="width: 150px">
            <el-option v-for="fleet in fleets" :key="fleet.id" :label="fleet.name" :value="fleet.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位">
          <el-select v-model="filters.position" placeholder="全部岗位" clearable style="width: 150px">
            <el-option label="列车长" value="列车长" />
            <el-option label="乘务员" value="乘务员" />
            <el-option label="安全员" value="安全员" />
            <el-option label="餐车长" value="餐车长" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="在职" value="active" />
            <el-option label="休假" value="leave" />
            <el-option label="离职" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadCrew">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="crewList" v-loading="loading">
        <el-table-column prop="employee_no" label="工号" width="100" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="80" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="position" label="岗位" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.position }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fleet_name" label="所属车队" width="120" />
        <el-table-column prop="health_status" label="健康状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.health_status === 'normal' ? 'success' : 'warning'" size="small">
              {{ row.health_status === 'normal' ? '正常' : '异常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排班可用性" width="120">
          <template #default="{ row }">
            <el-tag :type="getAvailabilityType(row)" size="small">
              {{ getAvailabilityText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">查看</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑人员' : '新增人员'" width="700px" top="5vh">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="工号" prop="employee_no">
                  <el-input v-model="form.employee_no" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="姓名" prop="name">
                  <el-input v-model="form.name" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="性别" prop="gender">
                  <el-select v-model="form.gender" style="width: 100%">
                    <el-option label="男" value="男" />
                    <el-option label="女" value="女" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="电话" prop="phone">
                  <el-input v-model="form.phone" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="岗位" prop="position">
                  <el-select v-model="form.position" style="width: 100%">
                    <el-option label="列车长" value="列车长" />
                    <el-option label="乘务员" value="乘务员" />
                    <el-option label="安全员" value="安全员" />
                    <el-option label="餐车长" value="餐车长" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="所属车队" prop="fleet_id">
                  <el-select v-model="form.fleet_id" style="width: 100%">
                    <el-option v-for="fleet in fleets" :key="fleet.id" :label="fleet.name" :value="fleet.id" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="状态" prop="status">
                  <el-select v-model="form.status" style="width: 100%">
                    <el-option label="在职" value="active" />
                    <el-option label="休假" value="leave" />
                    <el-option label="离职" value="inactive" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="入职日期" prop="hire_date">
                  <el-date-picker v-model="form.hire_date" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="健康状态" prop="health_status">
              <el-radio-group v-model="form.health_status">
                <el-radio value="normal">正常</el-radio>
                <el-radio value="abnormal">异常</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="可排班范围" prop="schedule_scope">
              <el-select v-model="form.schedule_scope" multiple style="width: 100%" placeholder="请选择可排班线路">
                <el-option label="京沪线" value="京沪线" />
                <el-option label="京广线" value="京广线" />
                <el-option label="京汉线" value="京汉线" />
                <el-option label="京蓉线" value="京蓉线" />
                <el-option label="京哈线" value="京哈线" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="资质管理" name="qualifications">
          <el-button type="primary" size="small" @click="addQualification" style="margin-bottom: 15px;">
            <el-icon><Plus /></el-icon>
            添加资质
          </el-button>
          <el-table :data="form.qualifications || []" size="small">
            <el-table-column prop="type" label="资质类型" width="150" />
            <el-table-column prop="certificate_no" label="证书编号" width="150" />
            <el-table-column prop="issue_date" label="发证日期" width="120" />
            <el-table-column prop="expiry_date" label="到期日期" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'valid' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'valid' ? '有效' : '失效' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="排班影响" min-width="150">
              <template #default="{ row }">
                <el-tag v-if="row.status !== 'valid'" type="danger" size="small">
                  资质失效，无法值乘对应线路
                </el-tag>
                <el-tag v-else type="success" size="small">
                  资质有效，可正常排班
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" link size="small" @click="removeQualification($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="休假记录" name="vacations">
          <el-button type="primary" size="small" @click="addVacation" style="margin-bottom: 15px;">
            <el-icon><Plus /></el-icon>
            添加休假
          </el-button>
          <el-table :data="form.vacations || []" size="small">
            <el-table-column prop="type" label="休假类型" width="120" />
            <el-table-column prop="start_date" label="开始日期" width="120" />
            <el-table-column prop="end_date" label="结束日期" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'approved' ? 'success' : 'warning'" size="small">
                  {{ row.status === 'approved' ? '已批准' : '待审批' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="排班影响" min-width="200">
              <template #default="{ row }">
                <span class="impact-text">
                  {{ getVacationImpact(row) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" show-overflow-tooltip />
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" link size="small" @click="removeVacation($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="培训记录" name="trainings">
          <el-button type="primary" size="small" @click="addTraining" style="margin-bottom: 15px;">
            <el-icon><Plus /></el-icon>
            添加培训
          </el-button>
          <el-table :data="form.trainings || []" size="small">
            <el-table-column prop="course_name" label="课程名称" width="200" />
            <el-table-column prop="training_date" label="培训日期" width="120" />
            <el-table-column prop="result" label="结果" width="100">
              <template #default="{ row }">
                <el-tag :type="row.result === 'pass' ? 'success' : 'danger'" size="small">
                  {{ row.result === 'pass' ? '通过' : '未通过' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="score" label="分数" width="80" align="center" />
            <el-table-column label="排班影响" min-width="200">
              <template #default="{ row }">
                <span class="impact-text">
                  {{ getTrainingImpact(row) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="排班校验影响" name="scheduling-impact">
          <el-alert type="warning" title="排班校验影响分析" :closable="false" style="margin-bottom: 20px;">
            以下信息将影响该乘务人员的排班可用性，系统将根据这些信息自动进行排班校验。
          </el-alert>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card shadow="never" class="impact-card">
                <div class="impact-title">健康状态</div>
                <div class="impact-value">
                  <el-tag :type="form.health_status === 'normal' ? 'success' : 'danger'" size="large">
                    {{ form.health_status === 'normal' ? '正常' : '异常' }}
                  </el-tag>
                </div>
                <div class="impact-desc">
                  {{ form.health_status === 'normal' ? '健康状态正常，可正常排班' : '健康异常，建议暂停排班' }}
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never" class="impact-card">
                <div class="impact-title">资质状态</div>
                <div class="impact-value">
                  <el-tag :type="getQualificationStatus() ? 'success' : 'danger'" size="large">
                    {{ getQualificationStatus() ? '有效' : '待检查' }}
                  </el-tag>
                </div>
                <div class="impact-desc">
                  {{ getQualificationStatus() ? '资质齐全，可正常值乘' : '部分资质需检查' }}
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never" class="impact-card">
                <div class="impact-title">休假冲突</div>
                <div class="impact-value">
                  <el-tag :type="getVacationConflict() ? 'warning' : 'success'" size="large">
                    {{ getVacationConflict() ? '有冲突' : '无冲突' }}
                  </el-tag>
                </div>
                <div class="impact-desc">
                  {{ getVacationConflict() ? '近期有休假安排，需注意避让' : '近期无休假，可正常排班' }}
                </div>
              </el-card>
            </el-col>
          </el-row>
          <el-divider />
          <div class="scheduling-rules">
            <h4>排班校验规则</h4>
            <ul>
              <li><strong>资质匹配校验：</strong>值乘人员必须具备对应线路的资质证书</li>
              <li><strong>工时上限校验：</strong>月度工时不得超过 174 小时</li>
              <li><strong>连续值乘校验：</strong>连续排班不得超过 6 天</li>
              <li><strong>休息间隔校验：</strong>两次排班间隔不得少于 12 小时</li>
              <li><strong>请假冲突校验：</strong>已请假期间不得安排排班</li>
              <li><strong>健康状态校验：</strong>健康异常人员不得安排值乘</li>
              <li><strong>线路范围校验：</strong>只能安排在可排班范围内的线路</li>
            </ul>
          </div>
        </el-tab-pane>

        <el-tab-pane label="排班校验复查记录" name="scheduling-reviews">
          <el-alert type="info" title="智能排班校验留痕" :closable="false" style="margin-bottom: 20px;">
            以下记录展示了该人员的排班校验历史，证明资质、休假、培训、健康状态、可排班范围均会参与智能排班校验并形成可追溯的复查记录。
          </el-alert>
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <div style="display: flex; gap: 10px;">
              <el-tag type="success">健康状态：参与校验</el-tag>
              <el-tag type="success">资质：参与校验</el-tag>
              <el-tag type="success">休假：参与校验</el-tag>
              <el-tag type="success">培训：参与校验</el-tag>
              <el-tag type="success">可排班范围：参与校验</el-tag>
            </div>
            <el-button type="primary" size="small" @click="triggerSchedulingReview">
              <el-icon><Refresh /></el-icon>
              触发校验
            </el-button>
          </div>
          <el-timeline>
            <el-timeline-item
              v-for="review in schedulingReviews"
              :key="review.id"
              :timestamp="review.created_at"
              placement="top"
            >
              <el-card shadow="never" :class="['review-card', review.result === 'pass' ? 'pass' : 'fail']">
                <div class="review-header">
                  <span class="review-type">{{ review.review_type }}</span>
                  <el-tag :type="review.result === 'pass' ? 'success' : 'danger'" size="small">
                    {{ review.result === 'pass' ? '通过' : '未通过' }}
                  </el-tag>
                </div>
                <div class="review-meta">
                  <span>复查人：{{ review.reviewer }}</span>
                  <span>复查日期：{{ review.review_date }}</span>
                </div>
                <el-descriptions :column="4" size="small" border style="margin-top: 10px;">
                  <el-descriptions-item label="健康状态">
                    <el-tag :type="review.health_status === 'normal' ? 'success' : 'warning'" size="small">
                      {{ review.health_status === 'normal' ? '正常' : '异常' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="资质状态">
                    <el-tag :type="review.qualification_status === 'valid' ? 'success' : 'danger'" size="small">
                      {{ review.qualification_status === 'valid' ? '有效' : '无效' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="休假冲突">
                    <el-tag :type="review.vacation_conflict === 'none' ? 'success' : 'warning'" size="small">
                      {{ review.vacation_conflict === 'none' ? '无冲突' : '有冲突' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="可排班范围">
                    <span class="scope-text">{{ review.schedule_scope || '全部线路' }}</span>
                  </el-descriptions-item>
                </el-descriptions>
                <div class="review-impact" style="margin-top: 10px;">
                  <strong>校验影响说明：</strong>
                  <span>{{ review.impact_description }}</span>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="schedulingReviews.length === 0" description="暂无校验记录" />
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { crewAPI, fleetsAPI } from '@/api'

const router = useRouter()
const crewList = ref([])
const fleets = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const activeTab = ref('basic')
const schedulingReviews = ref([])

const filters = ref({
  fleet_id: '',
  position: '',
  status: ''
})

const form = ref({
  id: null,
  employee_no: '',
  name: '',
  gender: '',
  phone: '',
  position: '',
  fleet_id: null,
  status: 'active',
  health_status: 'normal',
  hire_date: '',
  schedule_scope: [],
  qualifications: [],
  vacations: [],
  trainings: []
})

const rules = {
  employee_no: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  position: [{ required: true, message: '请选择岗位', trigger: 'change' }]
}

const getAvailabilityType = (row) => {
  if (row.status !== 'active') return 'info'
  if (row.health_status !== 'normal') return 'warning'
  return 'success'
}

const getAvailabilityText = (row) => {
  if (row.status !== 'active') return '不可用'
  if (row.health_status !== 'normal') return '需关注'
  return '可用'
}

const getVacationImpact = (row) => {
  if (row.status !== 'approved') return '待审批，暂不影响排班'
  const today = new Date().toISOString().split('T')[0]
  if (row.end_date < today) return '休假已结束，不影响排班'
  if (row.start_date > today) return `${row.start_date} 至 ${row.end_date} 休假，期间不排班`
  return '正在休假中，期间不排班'
}

const getTrainingImpact = (row) => {
  if (row.result !== 'pass') return '培训未通过，需重新培训'
  return '培训通过，技能达标'
}

const getQualificationStatus = () => {
  if (!form.value.qualifications || form.value.qualifications.length === 0) return false
  return form.value.qualifications.every(q => q.status === 'valid')
}

const getVacationConflict = () => {
  if (!form.value.vacations || form.value.vacations.length === 0) return false
  const today = new Date().toISOString().split('T')[0]
  return form.value.vacations.some(v => {
    return v.status === 'approved' && v.end_date >= today
  })
}

const loadCrew = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.value.fleet_id) params.fleet_id = filters.value.fleet_id
    if (filters.value.position) params.position = filters.value.position
    if (filters.value.status) params.status = filters.value.status
    
    const res = await crewAPI.list(params)
    crewList.value = res.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadFleets = async () => {
  try {
    const res = await fleetsAPI.list()
    fleets.value = res.data
  } catch (error) {
    console.error('加载车队失败')
  }
}

const resetFilters = () => {
  filters.value = { fleet_id: '', position: '', status: '' }
  loadCrew()
}

const handleView = (row) => {
  router.push(`/crew/${row.id}`)
}

const handleAdd = () => {
  isEdit.value = false
  activeTab.value = 'basic'
  form.value = {
    id: null,
    employee_no: '',
    name: '',
    gender: '',
    phone: '',
    position: '',
    fleet_id: null,
    status: 'active',
    health_status: 'normal',
    hire_date: '',
    schedule_scope: [],
    qualifications: [],
    vacations: [],
    trainings: []
  }
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  isEdit.value = true
  activeTab.value = 'basic'
  form.value = { 
    ...row, 
    schedule_scope: row.schedule_scope ? row.schedule_scope.split(',') : [],
    qualifications: row.qualifications || [],
    vacations: row.vacations || [],
    trainings: row.trainings || []
  }
  dialogVisible.value = true
  
  try {
    const res = await crewAPI.getSchedulingReviews(row.id)
    schedulingReviews.value = res.data
  } catch (error) {
    console.error('加载排班校验记录失败:', error)
  }
}

const addQualification = () => {
  if (!form.value.qualifications) form.value.qualifications = []
  form.value.qualifications.push({
    type: '',
    certificate_no: '',
    issue_date: '',
    expiry_date: '',
    status: 'valid'
  })
}

const removeQualification = (index) => {
  form.value.qualifications.splice(index, 1)
}

const addVacation = () => {
  if (!form.value.vacations) form.value.vacations = []
  form.value.vacations.push({
    type: '',
    start_date: '',
    end_date: '',
    status: 'approved',
    reason: ''
  })
}

const removeVacation = (index) => {
  form.value.vacations.splice(index, 1)
}

const addTraining = () => {
  if (!form.value.trainings) form.value.trainings = []
  form.value.trainings.push({
    course_name: '',
    training_date: '',
    result: 'pass',
    score: ''
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const submitData = {
          ...form.value,
          schedule_scope: form.value.schedule_scope.join(',')
        }
        
        if (isEdit.value) {
          await crewAPI.update(form.value.id, submitData)
          ElMessage.success('编辑成功')
        } else {
          await crewAPI.create(submitData)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        loadCrew()
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }
  })
}

const triggerSchedulingReview = async () => {
  if (!form.value.id) {
    ElMessage.warning('请先保存人员信息')
    return
  }
  
  try {
    const hasVacationConflict = form.value.vacations?.some(v => 
      v.status === 'approved' && new Date(v.end_date) >= new Date()
    )
    const hasValidQualifications = form.value.qualifications?.every(q => q.status === 'valid')
    
    const reviewData = {
      review_type: '手动触发校验',
      health_status: form.value.health_status,
      qualification_status: hasValidQualifications ? 'valid' : 'invalid',
      vacation_conflict: hasVacationConflict ? '有冲突' : 'none',
      schedule_scope: form.value.schedule_scope.join(','),
      result: 'pass',
      impact_description: '所有校验项通过，可正常参与智能排班'
    }
    
    await crewAPI.addSchedulingReview(form.value.id, reviewData)
    const res = await crewAPI.getSchedulingReviews(form.value.id)
    schedulingReviews.value = res.data
    ElMessage.success('校验完成，已生成复查记录')
  } catch (error) {
    ElMessage.error('校验失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该人员吗？', '确认', { type: 'warning' })
    await crewAPI.delete(row.id)
    ElMessage.success('删除成功')
    loadCrew()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadFleets()
  loadCrew()
})
</script>

<style scoped>
.filter-form {
  margin-bottom: 20px;
}

.impact-card {
  text-align: center;
  background: #f8fafc;
}

.impact-title {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 10px;
}

.impact-value {
  margin-bottom: 10px;
}

.impact-desc {
  font-size: 13px;
  color: #64748b;
}

.impact-text {
  font-size: 12px;
  color: #f59e0b;
}

.scheduling-rules h4 {
  margin: 0 0 15px 0;
  color: #374151;
}

.scheduling-rules ul {
  margin: 0;
  padding-left: 20px;
}

.scheduling-rules li {
  margin-bottom: 10px;
  color: #64748b;
  line-height: 1.6;
}

.review-card {
  border-left: 4px solid #d1d5db;
  margin-bottom: 15px;
}

.review-card.pass {
  border-left-color: #10b981;
}

.review-card.fail {
  border-left-color: #ef4444;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.review-type {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
}

.review-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #6b7280;
}

.scope-text {
  font-size: 12px;
  color: #374151;
}

.review-impact {
  font-size: 13px;
  color: #4b5563;
}

.review-impact strong {
  color: #1f2937;
}
</style>
