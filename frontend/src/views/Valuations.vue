<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2>评估管理</h2>
      <el-button type="primary" @click="showAddDialog = true">新增评估</el-button>
    </div>

    <el-card>
      <el-table :data="valuations" style="width: 100%">
        <el-table-column prop="vin" label="VIN码" width="180" />
        <el-table-column prop="valuator_name" label="评估师" width="100" />
        <el-table-column prop="valuation_value" label="评估价" width="120">
          <template #default="scope">¥{{ scope.row.valuation_value }}</template>
        </el-table-column>
        <el-table-column prop="is_anomaly" label="异常" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.is_anomaly" type="danger">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'approved' ? 'success' : 'warning'">
              {{ scope.row.status === 'approved' ? '已复核' : '待复核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="valuation_date" label="评估时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" v-if="scope.row.status !== 'approved'" @click="reviewValuation(scope.row)">复核</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="新增评估" width="600px">
      <el-form :model="valuationForm" label-width="100px">
        <el-form-item label="车辆" required>
          <el-select v-model="valuationForm.vehicle_id" placeholder="选择车辆" style="width: 100%">
            <el-option v-for="v in vehicles" :key="v.id" :label="`${v.vin} - ${v.plate_number || '无牌'}`" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="评估师">
          <el-input v-model="valuationForm.valuator_name" />
        </el-form-item>
        <el-form-item label="评估价" required>
          <el-input-number v-model="valuationForm.valuation_value" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="valuationForm.notes" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addValuation">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReviewDialog" title="复核评估" width="600px">
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="复核人">
          <el-input v-model="reviewForm.reviewer_name" />
        </el-form-item>
        <el-form-item label="复核结果">
          <el-radio-group v-model="reviewForm.status">
            <el-radio label="approved">通过</el-radio>
            <el-radio label="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="差异说明">
          <el-input v-model="reviewForm.difference_explanation" type="textarea" />
        </el-form-item>
        <el-form-item label="复核备注">
          <el-input v-model="reviewForm.review_notes" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReviewDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReview">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const valuations = ref([])
const vehicles = ref([])
const showAddDialog = ref(false)
const showReviewDialog = ref(false)
const selectedValuationId = ref(null)

const valuationForm = ref({
  vehicle_id: null,
  valuator_name: '',
  valuation_value: 0,
  notes: ''
})

const reviewForm = ref({
  reviewer_name: '',
  status: 'approved',
  difference_explanation: '',
  review_notes: ''
})

const loadVehicles = async () => {
  try {
    const res = await api.get('/vehicles')
    if (res.data.success) {
      vehicles.value = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

const loadValuations = async () => {
  try {
    const res = await api.get('/valuations')
    if (res.data.success) {
      valuations.value = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

const addValuation = async () => {
  if (!valuationForm.value.vehicle_id || !valuationForm.value.valuation_value) {
    ElMessage.error('请填写完整信息')
    return
  }
  try {
    const res = await api.post('/valuations', valuationForm.value)
    if (res.data.success) {
      ElMessage.success(res.data.data.is_anomaly ? '评估已提交，检测到估值异常' : '评估已提交')
      showAddDialog.value = false
      loadValuations()
      valuationForm.value = { vehicle_id: null, valuator_name: '', valuation_value: 0, notes: '' }
    }
  } catch (e) {
    ElMessage.error('提交失败')
  }
}

const reviewValuation = (row) => {
  selectedValuationId.value = row.id
  reviewForm.value = { reviewer_name: '', status: 'approved', difference_explanation: '', review_notes: '' }
  showReviewDialog.value = true
}

const submitReview = async () => {
  try {
    const res = await api.put(`/valuations/${selectedValuationId.value}/review`, reviewForm.value)
    if (res.data.success) {
      ElMessage.success('复核完成')
      showReviewDialog.value = false
      loadValuations()
    }
  } catch (e) {
    ElMessage.error('复核失败')
  }
}

onMounted(() => {
  loadVehicles()
  loadValuations()
})
</script>
