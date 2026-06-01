<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2>预警处置中心</h2>
      <div style="display: flex; gap: 10px">
        <el-select v-model="filterStatus" placeholder="筛选状态" clearable style="width: 150px" @change="loadAlerts">
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已处理" value="resolved" />
          <el-option label="误报关闭" value="false_positive" />
        </el-select>
        <el-button type="primary" @click="testOverloadAlert">模拟超载预警</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="alerts" border>
        <el-table-column prop="device_code" label="设备编号" width="120" />
        <el-table-column prop="alert_type" label="预警类型" width="120">
          <template #default="{ row }">
            {{ alertTypeMap[row.alert_type] || row.alert_type }}
          </template>
        </el-table-column>
        <el-table-column prop="alert_level" label="级别" width="80">
          <template #default="{ row }">
            <el-tag :type="row.alert_level === 'danger' ? 'danger' : 'warning'" size="small">
              {{ row.alert_level === 'danger' ? '危险' : '警告' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="预警信息" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handler" label="处理人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'pending'" size="small" type="primary" @click="openHandle(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="handleDialogVisible" title="处理预警" width="500px">
      <el-form :model="handleForm" label-width="100px">
        <el-form-item label="处理人">
          <el-select v-model="handleForm.handler" placeholder="请选择处理人" style="width: 100%" filterable allow-create>
            <el-option-group label="安全员">
              <el-option v-for="p in safetyOfficers" :key="p" :label="p" :value="p" />
            </el-option-group>
            <el-option-group label="设备管理员">
              <el-option v-for="p in deviceAdmins" :key="p" :label="p" :value="p" />
            </el-option-group>
            <el-option-group label="塔吊司机">
              <el-option v-for="d in drivers" :key="d" :label="d" :value="d" />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="处理结果">
          <el-select v-model="handleForm.status" style="width: 100%">
            <el-option label="已解决" value="resolved" />
            <el-option label="误报关闭" value="false_positive" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理结论">
          <el-input type="textarea" v-model="handleForm.handle_result" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="预警详情" width="600px">
      <el-descriptions :column="2" border v-if="currentAlert">
        <el-descriptions-item label="设备编号">{{ currentAlert.device_code }}</el-descriptions-item>
        <el-descriptions-item label="预警类型">{{ alertTypeMap[currentAlert.alert_type] }}</el-descriptions-item>
        <el-descriptions-item label="预警级别">
          <el-tag :type="currentAlert.alert_level === 'danger' ? 'danger' : 'warning'">
            {{ currentAlert.alert_level === 'danger' ? '危险' : '警告' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentAlert.status)">{{ getStatusText(currentAlert.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预警信息" :span="2">{{ currentAlert.message }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentAlert.handler || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ currentAlert.handled_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理结论" :span="2">{{ currentAlert.handle_result || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="handleRecords.length" style="margin-top: 20px">
        <h4>处置记录</h4>
        <el-timeline>
          <el-timeline-item v-for="r in handleRecords" :key="r.id" :timestamp="r.created_at">
            <strong>{{ r.operator }}</strong> - {{ r.action }}<br>
            <span style="color: #666">{{ r.remark }}</span>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getAlerts, handleAlert, createAlert, getHandleRecords, getCranes } from '../api'

const alerts = ref([])
const cranes = ref([])
const filterStatus = ref(null)
const handleDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentAlert = ref(null)
const handleRecords = ref([])
const currentAlertId = ref(null)
const handleForm = ref({
  handler: '',
  status: 'resolved',
  handle_result: ''
})

const safetyOfficers = ['李安全', '王监察', '张督导', '刘巡查']
const deviceAdmins = ['陈主管', '杨经理', '赵工程师']
const drivers = computed(() => {
  return [...new Set(cranes.value.map(c => c.driver_name).filter(Boolean))]
})

const alertTypeMap = {
  overload: '超载预警',
  strong_wind: '强风预警',
  limit_error: '限位异常',
  offline: '设备离线',
  expired_cert: '证件过期',
  maintenance_overdue: '维保逾期'
}

const getStatusType = (status) => {
  const map = { pending: 'warning', processing: 'primary', resolved: 'success', false_positive: 'info' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = { pending: '待处理', processing: '处理中', resolved: '已处理', false_positive: '误报关闭' }
  return map[status] || status
}

const loadAlerts = async () => {
  const params = {}
  if (filterStatus.value) params.status = filterStatus.value
  const res = await getAlerts(params)
  alerts.value = res.data
}

const openHandle = (row) => {
  currentAlertId.value = row.id
  handleForm.value = { handler: '', status: 'resolved', handle_result: '' }
  handleDialogVisible.value = true
}

const submitHandle = async () => {
  await handleAlert(currentAlertId.value, handleForm.value)
  ElMessage.success('处理成功')
  handleDialogVisible.value = false
  loadAlerts()
}

const viewDetail = async (row) => {
  currentAlert.value = row
  const res = await getHandleRecords(row.id)
  handleRecords.value = res.data
  detailDialogVisible.value = true
}

const testOverloadAlert = async () => {
  await createAlert({
    crane_id: 1,
    alert_type: 'overload',
    alert_level: 'warning',
    message: '测试超载预警 - 当前载重超过额定值80%'
  })
  ElMessage.success('模拟预警已生成')
  loadAlerts()
}

onMounted(async () => {
  const craneRes = await getCranes()
  cranes.value = craneRes.data
  loadAlerts()
})
</script>
