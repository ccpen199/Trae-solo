<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-weight: bold">活动管理</span>
          <el-button type="primary" @click="openDialog">新增活动</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="活动名称" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地点" width="120" />
        <el-table-column label="时间" width="200">
          <template #default="{ row }">
            <div style="font-size: 12px">
              <div>开始: {{ row.start_time }}</div>
              <div>结束: {{ row.end_time }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="signupCount" label="报名人数" width="100" />
        <el-table-column prop="points_per_participant" label="每人积分" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewSignups(row)">报名管理</el-button>
            <el-button type="primary" link size="small" @click="grantPoints(row)" :disabled="row.status !== 'completed'">批量发分</el-button>
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑活动' : '新增活动'" width="700px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="活动名称" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="活动类型" required>
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="志愿服务" value="volunteer" />
            <el-option label="垃圾分类" value="garbage" />
            <el-option label="社区活动" value="activity" />
            <el-option label="文明表彰" value="civilization" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动地点">
          <el-input v-model="form.location" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" required>
              <el-date-picker
                v-model="form.start_time"
                type="datetime"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" required>
              <el-date-picker
                v-model="form.end_time"
                type="datetime"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="最大参与人数">
          <el-input-number v-model="form.max_participants" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="每人积分">
          <el-input-number v-model="form.points_per_participant" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="活动状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="进行中" value="ongoing" />
            <el-option label="已结束" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="signupDialogVisible" title="报名管理" width="900px">
      <div style="margin-bottom: 15px">
        <el-select v-model="quickResident" placeholder="快速报名" style="width: 200px" filterable @change="quickSignup">
          <el-option
            v-for="r in residents"
            :key="r.id"
            :label="`${r.name} (${r.phone || r.id_card})`"
            :value="r.id"
          />
        </el-select>
      </div>
      <el-table :data="signups" size="small">
        <el-table-column prop="resident_name" label="姓名" width="100" />
        <el-table-column prop="resident_phone" label="电话" width="120" />
        <el-table-column prop="signup_time" label="报名时间" width="180" />
        <el-table-column prop="checkin_time" label="签到时间" width="180" />
        <el-table-column prop="checkin_type" label="签到类型" width="100" />
        <el-table-column label="异常标记" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.is_anomalous" type="danger" size="small">异常</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getSignupStatusType(row.status)" size="small">
              {{ getSignupStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points_awarded" label="已发积分" width="100" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button
              v-if="!row.checkin_time"
              type="primary"
              link
              size="small"
              @click="handleCheckin(row)"
            >签到</el-button>
            <el-button
              v-if="row.status === 'pending_review'"
              type="success"
              link
              size="small"
              @click="handleReview(row, true)"
            >通过</el-button>
            <el-button
              v-if="row.status === 'pending_review'"
              type="danger"
              link
              size="small"
              @click="handleReview(row, false)"
            >拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const tableData = ref([])
const residents = ref([])

const dialogVisible = ref(false)
const signupDialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({})
const currentActivity = ref(null)
const signups = ref([])
const quickResident = ref(null)

const getTypeLabel = (type) => {
  const labels = { volunteer: '志愿服务', garbage: '垃圾分类', activity: '社区活动', civilization: '文明表彰' }
  return labels[type] || type
}

const getStatusLabel = (status) => {
  const labels = { draft: '草稿', published: '已发布', ongoing: '进行中', completed: '已结束' }
  return labels[status] || status
}

const getStatusType = (status) => {
  const types = { draft: 'info', published: 'primary', ongoing: 'success', completed: 'warning' }
  return types[status] || 'info'
}

const getSignupStatusLabel = (status) => {
  const labels = { signed_up: '已报名', checked_in: '已签到', pending_review: '待审核', approved: '已通过', rejected: '已拒绝' }
  return labels[status] || status
}

const getSignupStatusType = (status) => {
  const types = { signed_up: 'info', checked_in: 'primary', pending_review: 'warning', approved: 'success', rejected: 'danger' }
  return types[status] || 'info'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/activities', { params: { pageSize: 100 } })
    tableData.value = res.data.data
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadResidents = async () => {
  try {
    const res = await axios.get('/api/residents', { params: { pageSize: 1000 } })
    residents.value = res.data.data
  } catch (e) {
    console.error(e)
  }
}

const openDialog = (row = null) => {
  isEdit.value = !!row
  form.value = row ? { ...row } : {
    title: '',
    type: 'volunteer',
    location: '',
    start_time: '',
    end_time: '',
    max_participants: null,
    points_per_participant: 20,
    status: 'draft',
    description: ''
  }
  dialogVisible.value = true
}

const handleSave = async () => {
  try {
    if (isEdit.value) {
      await axios.put(`/api/activities/${form.value.id}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/activities', form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

const viewSignups = async (row) => {
  currentActivity.value = row
  try {
    const res = await axios.get(`/api/activities/${row.id}/signups`)
    signups.value = res.data
    signupDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const quickSignup = async (residentId) => {
  if (!residentId) return
  try {
    await axios.post(`/api/activities/${currentActivity.value.id}/signup`, { resident_id: residentId })
    ElMessage.success('报名成功')
    quickResident.value = null
    const res = await axios.get(`/api/activities/${currentActivity.value.id}/signups`)
    signups.value = res.data
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

const handleCheckin = async (row) => {
  try {
    await axios.post(`/api/activities/${currentActivity.value.id}/checkin`, {
      resident_id: row.resident_id,
      checkin_type: 'normal'
    })
    ElMessage.success('签到成功')
    const res = await axios.get(`/api/activities/${currentActivity.value.id}/signups`)
    signups.value = res.data
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

const handleReview = async (row, approved) => {
  try {
    await axios.post(`/api/activities/${currentActivity.value.id}/review-checkin`, {
      resident_id: row.resident_id,
      approved
    })
    ElMessage.success(approved ? '审核通过' : '已拒绝')
    const res = await axios.get(`/api/activities/${currentActivity.value.id}/signups`)
    signups.value = res.data
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

const grantPoints = async (row) => {
  try {
    const res = await axios.post(`/api/activities/${row.id}/grant-points`, {})
    ElMessage.success(`已为 ${res.data.grantedCount} 人发放积分`)
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

onMounted(() => {
  loadData()
  loadResidents()
})
</script>
