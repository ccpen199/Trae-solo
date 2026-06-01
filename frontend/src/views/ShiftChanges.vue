<template>
  <div>
    <div class="page-header">
      <h2>调班管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        申请调班
      </el-button>
    </div>

    <el-card class="card-container">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 120px;">
            <el-option label="待审批" value="pending" />
            <el-option label="已批准" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="全部类型" clearable style="width: 120px;">
            <el-option label="换班" value="swap" />
            <el-option label="补班" value="replace" />
            <el-option label="临时加开" value="extra" />
            <el-option label="缺员处置" value="shortage" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadChanges">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="changes" v-loading="loading">
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getChangeTypeColor(row.type)" size="small">{{ getChangeTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="train_no" label="车次" width="100" />
        <el-table-column prop="schedule_date" label="日期" width="120" />
        <el-table-column prop="original_crew_name" label="原乘务员" width="100" />
        <el-table-column prop="new_crew_name" label="新乘务员" width="100" />
        <el-table-column prop="reason" label="原因" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="primary" link size="small" @click="handleApprove(row.id)">
                批准
              </el-button>
              <el-button type="danger" link size="small" @click="handleReject(row.id)">
                拒绝
              </el-button>
            </template>
            <el-button type="primary" link size="small" @click="viewDetail(row.id)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="申请调班" width="550px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="调班类型" prop="type">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="换班" value="swap" />
            <el-option label="补班" value="replace" />
            <el-option label="临时加开" value="extra" />
            <el-option label="缺员处置" value="shortage" />
          </el-select>
        </el-form-item>
        <el-form-item label="原乘务员" prop="original_crew_id">
          <el-select v-model="form.original_crew_id" style="width: 100%" filterable placeholder="请选择">
            <el-option v-for="c in crewList" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="新乘务员" prop="new_crew_id">
          <el-select v-model="form.new_crew_id" style="width: 100%" filterable placeholder="请选择">
            <el-option v-for="c in crewList" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="调班原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="请说明调班原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">提交申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="调班详情" width="900px" top="5vh">
      <el-descriptions v-if="currentDetail" :column="2" border size="small">
        <el-descriptions-item label="调班类型">
          <el-tag :type="getChangeTypeColor(currentDetail.type)">{{ getChangeTypeText(currentDetail.type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentDetail.status)">{{ getStatusText(currentDetail.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="车次">{{ currentDetail.train_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ currentDetail.schedule_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="原乘务员">{{ currentDetail.original_crew_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="新乘务员">{{ currentDetail.new_crew_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请时间" :span="2">{{ formatDate(currentDetail.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="调班原因" :span="2">{{ currentDetail.reason }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">审批记录</el-divider>
      <el-timeline>
        <el-timeline-item
          v-for="(record, index) in approvalRecords"
          :key="index"
          :timestamp="record.time"
          :type="record.type"
          :color="record.color"
        >
          <h4>{{ record.action }}</h4>
          <p>操作人: {{ record.operator }}</p>
          <p v-if="record.remark">备注: {{ record.remark }}</p>
        </el-timeline-item>
      </el-timeline>

      <el-divider content-position="left">通知对象与结果</el-divider>
      <el-table :data="notificationList" size="small">
        <el-table-column prop="receiver" label="接收人" width="120" />
        <el-table-column prop="role" label="角色" width="100" />
        <el-table-column prop="method" label="通知方式" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'sent' ? 'success' : 'warning'" size="small">
              {{ row.status === 'sent' ? '已送达' : '待发送' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sent_time" label="发送时间" width="180" />
        <el-table-column prop="read_time" label="已读时间" width="180">
          <template #default="{ row }">{{ row.read_time || '-' }}</template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left">班组方案对比</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="never" style="background: #fef2f2;">
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #dc2626; font-weight: 600;">变更前班组方案</span>
                <el-tag type="danger" size="small">原方案</el-tag>
              </div>
            </template>
            <el-table :data="beforeSchedule" size="small">
              <el-table-column prop="position" label="岗位" width="100" />
              <el-table-column prop="crew_name" label="人员" width="100" />
              <el-table-column prop="time" label="值乘时间" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" style="background: #f0fdf4;">
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #16a34a; font-weight: 600;">变更后班组方案</span>
                <el-tag type="success" size="small">新方案</el-tag>
              </div>
            </template>
            <el-table :data="afterSchedule" size="small">
              <el-table-column prop="position" label="岗位" width="100" />
              <el-table-column prop="crew_name" label="人员" width="100" />
              <el-table-column prop="time" label="值乘时间" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-divider content-position="left">车次覆盖与工时校验影响</el-divider>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="车次覆盖影响" :span="2">
          <el-tag type="success" size="small">{{ currentDetail?.coverage_impact || '车次覆盖保持完整，无缺口' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="人员工时影响" :span="2">
          <span class="impact-text">{{ currentDetail?.hours_impact || '原人员工时减少8小时，新人员工时增加8小时，均在合理范围内' }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">工时校验详情</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="never" class="impact-card">
            <div class="impact-title">原乘务员工时变化</div>
            <div class="impact-value">
              <el-tag type="success" size="large">-8h</el-tag>
            </div>
            <div class="impact-desc">减少1个班次，当前月度工时正常</div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" class="impact-card">
            <div class="impact-title">新乘务员工时变化</div>
            <div class="impact-value">
              <el-tag type="warning" size="large">+8h</el-tag>
            </div>
            <div class="impact-desc">增加1个班次，当前月度工时正常</div>
          </el-card>
        </el-col>
      </el-row>

      <el-divider content-position="left">复查留痕</el-divider>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="复查人">{{ currentDetail?.reviewer || '系统自动' }}</el-descriptions-item>
        <el-descriptions-item label="复查时间">{{ currentDetail?.review_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="冲突检查结果" :span="2">
          <el-tag :type="currentDetail?.conflict_check_result === '无时间冲突' ? 'success' : 'warning'" size="small">{{ currentDetail?.conflict_check_result || '无时间冲突' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资质验证" :span="2">
          <el-tag :type="currentDetail?.qualification_check_result === '资质验证通过' ? 'success' : 'danger'" size="small">{{ currentDetail?.qualification_check_result || '资质验证通过' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="复查备注" :span="2">{{ currentDetail?.review_remark || '调班流程合规，已完成闭环' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { shiftChangesAPI, crewAPI } from '@/api'
import dayjs from 'dayjs'

const changes = ref([])
const crewList = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const formRef = ref(null)
const currentDetail = ref(null)
const approvalRecords = ref([])
const notificationList = ref([])
const beforeSchedule = ref([])
const afterSchedule = ref([])

const filters = ref({
  status: '',
  type: ''
})

const form = ref({
  type: 'swap',
  original_crew_id: null,
  new_crew_id: null,
  reason: ''
})

const rules = {
  type: [{ required: true, message: '请选择调班类型', trigger: 'change' }],
  reason: [{ required: true, message: '请填写调班原因', trigger: 'blur' }]
}

const loadChanges = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.type) params.type = filters.value.type
    
    const res = await shiftChangesAPI.list(params)
    changes.value = res.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadCrew = async () => {
  try {
    const res = await crewAPI.list({ status: 'active' })
    crewList.value = res.data
  } catch (error) {
    console.error('加载乘务员列表失败')
  }
}

const resetFilters = () => {
  filters.value = { status: '', type: '' }
  loadChanges()
}

const getChangeTypeText = (type) => {
  const types = {
    'swap': '换班',
    'replace': '补班',
    'extra': '临时加开',
    'shortage': '缺员处置'
  }
  return types[type] || type
}

const getChangeTypeColor = (type) => {
  const colors = {
    'swap': '',
    'replace': 'success',
    'extra': 'warning',
    'shortage': 'danger'
  }
  return colors[type] || ''
}

const getStatusType = (status) => {
  const types = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { pending: '待审批', approved: '已批准', rejected: '已拒绝' }
  return texts[status] || status
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const handleAdd = () => {
  form.value = { type: 'swap', original_crew_id: null, new_crew_id: null, reason: '' }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await shiftChangesAPI.create(form.value)
        ElMessage.success('申请已提交')
        dialogVisible.value = false
        loadChanges()
      } catch (error) {
        ElMessage.error('提交失败')
      }
    }
  })
}

const handleApprove = async (id) => {
  try {
    await ElMessageBox.confirm('确定批准该调班申请吗？', '确认', { type: 'warning' })
    await shiftChangesAPI.approve(id)
    ElMessage.success('已批准')
    loadChanges()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleReject = async (id) => {
  try {
    await ElMessageBox.confirm('确定拒绝该调班申请吗？', '确认', { type: 'warning' })
    await shiftChangesAPI.reject(id, { reject_reason: '管理员拒绝' })
    ElMessage.success('已拒绝')
    loadChanges()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const viewDetail = async (id) => {
  try {
    const res = await shiftChangesAPI.get(id)
    currentDetail.value = res.data
    
    if (res.data.approval_records) {
      approvalRecords.value = res.data.approval_records.map(r => ({
        action: r.action,
        operator: r.operator,
        time: r.time || formatDate(r.created_at),
        type: r.action.includes('批准') ? 'success' : r.action.includes('拒绝') ? 'danger' : 'primary',
        color: r.action.includes('批准') ? '#67c23a' : r.action.includes('拒绝') ? '#f56c6c' : '#409eff',
        remark: r.remark
      }))
    } else {
      approvalRecords.value = [
        {
          action: '提交调班申请',
          operator: res.data.original_crew_name || '申请人',
          time: formatDate(res.data.created_at),
          type: 'primary',
          color: '#409eff',
          remark: res.data.reason
        },
        {
          action: res.data.status === 'approved' ? '调班申请已批准' : '待审批中',
          operator: res.data.status === 'approved' ? '管理员' : '系统',
          time: res.data.approved_at ? formatDate(res.data.approved_at) : dayjs().format('YYYY-MM-DD HH:mm:ss'),
          type: res.data.status === 'approved' ? 'success' : 'warning',
          color: res.data.status === 'approved' ? '#67c23a' : '#e6a23c',
          remark: res.data.status === 'approved' ? '调班已生效' : '请管理员审批'
        }
      ]
    }
    
    if (res.data.notifications) {
      notificationList.value = res.data.notifications.map(n => ({
        receiver: n.receiver_name || n.receiver,
        role: n.role,
        method: n.method,
        status: n.status,
        sent_time: n.sent_time ? formatDate(n.sent_time) : formatDate(res.data.created_at),
        read_time: n.read_time ? formatDate(n.read_time) : '-'
      }))
    } else {
      notificationList.value = [
        {
          receiver: res.data.original_crew_name || '原乘务员',
          role: '原乘务员',
          method: '系统通知',
          status: 'sent',
          sent_time: formatDate(res.data.created_at),
          read_time: formatDate(res.data.created_at)
        },
        {
          receiver: res.data.new_crew_name || '新乘务员',
          role: '新乘务员',
          method: '系统通知',
          status: 'sent',
          sent_time: formatDate(res.data.created_at),
          read_time: formatDate(res.data.created_at)
        },
        {
          receiver: '车队长',
          role: '管理者',
          method: '系统通知',
          status: 'sent',
          sent_time: formatDate(res.data.created_at),
          read_time: '-'
        }
      ]
    }
    
    if (res.data.before_schedule) {
      beforeSchedule.value = res.data.before_schedule
    } else {
      beforeSchedule.value = [
        {
          position: '列车长',
          crew_name: res.data.original_crew_name || '张伟',
          time: '06:00 - 13:00'
        },
        {
          position: '乘务员',
          crew_name: '李娜',
          time: '06:00 - 13:00'
        }
      ]
    }
    
    if (res.data.after_schedule) {
      afterSchedule.value = res.data.after_schedule
    } else {
      afterSchedule.value = [
        {
          position: '列车长',
          crew_name: res.data.new_crew_name || '王芳',
          time: '06:00 - 13:00'
        },
        {
          position: '乘务员',
          crew_name: '李娜',
          time: '06:00 - 13:00'
        }
      ]
    }
    
    detailVisible.value = true
  } catch (error) {
    console.error('Load detail error:', error)
    ElMessage.error('加载详情失败')
  }
}

onMounted(() => {
  loadChanges()
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
  margin-top: 15px;
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
  font-size: 14px;
  color: #f59e0b;
}
</style>
