<template>
  <div class="checkout">
    <el-card>
      <template #header><span>离园确认</span></template>
      
      <el-form :inline="true">
        <el-form-item label="预约号/车牌">
          <el-input v-model="search" placeholder="输入预约号或车牌" style="width: 300px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchAppointment">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" size="small" v-loading="loading" @selection-change="onSelect" style="margin-top: 20px">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="appointment_no" label="预约号" width="120" />
        <el-table-column prop="visitor_name" label="访客" width="100" />
        <el-table-column prop="enterprise_name" label="企业" />
        <el-table-column prop="license_plate" label="车牌" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag type="success">已入园</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="入园时间" width="160">
          <template #default="{ row }">{{ getCheckinTime(row.id) }}</template>
        </el-table-column>
      </el-table>

      <el-divider />

      <div v-if="selected" class="checkout-form">
        <h4>离园信息确认</h4>
        <el-descriptions :column="2" border size="small" style="margin-bottom: 20px">
          <el-descriptions-item label="预约号">{{ selected.appointment_no }}</el-descriptions-item>
          <el-descriptions-item label="访客">{{ selected.visitor_name }}</el-descriptions-item>
          <el-descriptions-item label="企业">{{ selected.enterprise_name }}</el-descriptions-item>
          <el-descriptions-item label="被访人">{{ selected.contact_person }}</el-descriptions-item>
        </el-descriptions>

        <el-form :model="form" label-width="120px">
          <el-form-item label="访客确认">
            <el-switch v-model="form.visitorConfirmation" />
          </el-form-item>
          <el-form-item label="被访人确认">
            <el-switch v-model="form.contactConfirmation" />
          </el-form-item>
          <el-form-item label="异常情况">
            <el-select v-model="form.anomalies" multiple placeholder="请选择（可多选）" style="width: 100%">
              <el-option label="超时停留" value="超时停留" />
              <el-option label="物品遗留" value="物品遗留" />
              <el-option label="行为异常" value="行为异常" />
              <el-option label="无异常" value="无异常" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.remarks" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="doCheckout" :loading="submitting">确认离园</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { appointments, checkout } from '../api'

const search = ref('')
const list = ref([])
const checkins = ref({})
const loading = ref(false)
const selected = ref(null)
const submitting = ref(false)
const form = reactive({
  visitorConfirmation: false,
  contactConfirmation: false,
  anomalies: [],
  remarks: ''
})

const searchAppointment = async () => {
  if (!search.value) {
    ElMessage.warning('请输入预约号或车牌')
    return
  }
  loading.value = true
  try {
    const res = await appointments.list({ status: 'checked_in', search: search.value })
    list.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const onSelect = (rows) => {
  if (rows.length > 0) {
    selected.value = rows[0]
  } else {
    selected.value = null
  }
}

const getCheckinTime = (aptId) => {
  return checkins.value[aptId] || '-'
}

const doCheckout = async () => {
  if (!selected.value) return
  submitting.value = true
  try {
    await checkout.do({
      appointmentId: selected.value.id,
      ...form,
      anomalies: form.anomalies.join(','),
      operatorId: 1
    })
    ElMessage.success('离园确认完成')
    selected.value = null
    list.value = []
    search.value = ''
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.checkout-form h4 {
  margin-bottom: 15px;
  color: #333;
}
</style>
