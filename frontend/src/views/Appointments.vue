<template>
  <div class="appointments">
    <el-card>
      <template #header>
        <el-row :gutter="16" align="middle">
          <el-col :span="16"><span>预约管理</span></el-col>
          <el-col :span="8">
            <el-input v-model="search" placeholder="搜索姓名/车牌/预约号" clearable size="small" @input="loadData" />
          </el-col>
        </el-row>
      </template>
      <el-table :data="list" size="small" v-loading="loading">
        <el-table-column prop="appointment_no" label="预约号" width="120" />
        <el-table-column prop="visitor_name" label="访客" width="100" />
        <el-table-column prop="visitor_phone" label="电话" width="120" />
        <el-table-column prop="visitor_id_card" label="身份证" width="180" />
        <el-table-column prop="enterprise_name" label="企业" />
        <el-table-column prop="contact_person" label="被访人" width="100" />
        <el-table-column prop="license_plate" label="车牌" width="100" />
        <el-table-column prop="visit_reason" label="事由" width="100" />
        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="reviewType(row.review_status)">{{ reviewText(row.review_status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="scheduled_arrival" label="预约到达" width="160">
          <template #default="{ row }">{{ formatTime(row.scheduled_arrival) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewDetail(row)">详情</el-button>
            <el-button 
              type="danger" 
              size="small" 
              link 
              @click="cancelAppointment(row)"
              :disabled="row.status === 'checked_in' || row.status === 'checked_out' || row.status === 'cancelled'"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDetail" title="预约详情" width="600px">
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item label="预约号" :span="2">{{ detail.appointment_no }}</el-descriptions-item>
        <el-descriptions-item label="访客姓名">{{ detail.visitor_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detail.visitor_phone }}</el-descriptions-item>
        <el-descriptions-item label="身份证号" :span="2">{{ detail.visitor_id_card }}</el-descriptions-item>
        <el-descriptions-item label="车牌号码">{{ detail.license_plate || '无' }}</el-descriptions-item>
        <el-descriptions-item label="来访企业">{{ detail.enterprise_name }}</el-descriptions-item>
        <el-descriptions-item label="被访人">{{ detail.contact_person }}</el-descriptions-item>
        <el-descriptions-item label="到访事由">{{ detail.visit_reason }}</el-descriptions-item>
        <el-descriptions-item label="预计到达">{{ formatTime(detail.scheduled_arrival) }}</el-descriptions-item>
        <el-descriptions-item label="预计离开">{{ formatTime(detail.scheduled_departure) }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag :type="reviewType(detail.review_status)">{{ reviewText(detail.review_status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预约状态">
          <el-tag :type="statusType(detail.status)">{{ statusText(detail.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatTime(detail.created_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="showCancel" title="取消预约" width="400px">
      <p style="margin-bottom: 15px">确定要取消该预约吗？</p>
      <el-form :model="cancelForm">
        <el-form-item label="取消原因">
          <el-input v-model="cancelForm.reason" type="textarea" :rows="3" placeholder="请输入取消原因（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCancel = false">取消</el-button>
        <el-button type="danger" @click="confirmCancel" :loading="cancelling">确认取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { appointments } from '../api'

const list = ref([])
const loading = ref(false)
const search = ref('')
const showDetail = ref(false)
const showCancel = ref(false)
const detail = ref(null)
const currentRow = ref(null)
const cancelling = ref(false)
const cancelForm = reactive({ reason: '' })

const loadData = async () => {
  loading.value = true
  try {
    const res = await appointments.list({ search: search.value })
    list.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const viewDetail = (row) => {
  detail.value = row
  showDetail.value = true
}

const cancelAppointment = (row) => {
  currentRow.value = row
  cancelForm.reason = ''
  showCancel.value = true
}

const confirmCancel = async () => {
  cancelling.value = true
  try {
    await appointments.cancel(currentRow.value.id, { 
      reason: cancelForm.reason,
      operatorId: 1
    })
    ElMessage.success('预约已取消')
    showCancel.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '取消失败')
  } finally {
    cancelling.value = false
  }
}

const statusType = (s) => ({ pending: 'info', checked_in: 'success', checked_out: '', cancelled: 'danger' }[s] || '')
const statusText = (s) => ({ pending: '待入园', checked_in: '已入园', checked_out: '已离园', cancelled: '已取消' }[s] || s)
const reviewType = (s) => ({ auto_passed: 'success', pending_review: 'warning', rejected: 'danger', approved: 'primary' }[s] || '')
const reviewText = (s) => ({ auto_passed: '自动通过', pending_review: '待审核', rejected: '已拒绝', approved: '已通过' }[s] || s)
const formatTime = (t) => t ? t.slice(0, 16) : ''

onMounted(loadData)
</script>
