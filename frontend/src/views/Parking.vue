<template>
  <div class="parking">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header><span>车辆入场</span></template>
          <el-form :model="entryForm" label-width="100px">
            <el-form-item label="车牌号">
              <el-input v-model="entryForm.licensePlate" placeholder="请输入车牌号" />
            </el-form-item>
            <el-form-item label="停车场">
              <el-select v-model="entryForm.parkingLotId" placeholder="请选择停车场" style="width: 100%">
                <el-option v-for="lot in parkingLots" :key="lot.id" :label="`${lot.name} (可用:${lot.available_spaces})`" :value="lot.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="车位号">
              <el-input v-model="entryForm.spaceNo" placeholder="请输入车位号" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="doEntry" :loading="entryLoading">确认入场</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header><span>车辆出场</span></template>
          <el-form :model="exitForm" label-width="100px">
            <el-form-item label="车牌号">
              <el-input v-model="exitForm.licensePlate" placeholder="请输入车牌号" />
            </el-form-item>
            <el-form-item label="减免金额" v-if="record">
              <el-input-number v-model="exitForm.discountAmount" :min="0" :max="record?.parking_fee || 0" />
              <span style="margin-left: 10px">元</span>
            </el-form-item>
            <el-form-item label="减免原因" v-if="record">
              <el-select v-model="exitForm.discountReason" placeholder="请选择" style="width: 100%">
                <el-option label="访客减免" value="访客减免" />
                <el-option label="企业客户" value="企业客户" />
                <el-option label="VIP" value="VIP" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="queryRecord">查询</el-button>
              <el-button type="success" @click="doExit" :disabled="!record" :loading="exitLoading">确认出场</el-button>
            </el-form-item>
          </el-form>

          <div v-if="record" class="parking-record">
            <el-descriptions :column="1" border size="small" title="停车信息">
              <el-descriptions-item label="入场时间">{{ formatTime(record.entry_time) }}</el-descriptions-item>
              <el-descriptions-item label="停车时长">{{ record.parking_duration ? record.parking_duration + '分钟' : '计算中' }}</el-descriptions-item>
              <el-descriptions-item label="停车费用">¥{{ record.parking_fee || 0 }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <el-row :gutter="16" align="middle">
          <el-col :span="18"><span>在场车辆</span></el-col>
          <el-col :span="6">
            <el-input v-model="searchPlate" placeholder="搜索车牌" clearable size="small" @input="loadRecords" />
          </el-col>
        </el-row>
      </template>
      <el-table :data="records" size="small" v-loading="loading">
        <el-table-column prop="license_plate" label="车牌号" width="120" />
        <el-table-column prop="space_no" label="车位" width="100" />
        <el-table-column prop="entry_time" label="入场时间" width="160">
          <template #default="{ row }">{{ formatTime(row.entry_time) }}</template>
        </el-table-column>
        <el-table-column label="已停时长" width="120">
          <template #default="{ row }">{{ calcDuration(row.entry_time) }}</template>
        </el-table-column>
        <el-table-column prop="payment_status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag type="success" v-if="row.exit_time">已出场</el-tag>
            <el-tag type="warning" v-else>在场</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { parking, parkingLots } from '../api'

const entryForm = reactive({ licensePlate: '', parkingLotId: null, spaceNo: '' })
const exitForm = reactive({ licensePlate: '', discountAmount: 0, discountReason: '' })
const parkingLotsList = ref([])
const records = ref([])
const record = ref(null)
const loading = ref(false)
const entryLoading = ref(false)
const exitLoading = ref(false)
const searchPlate = ref('')

const loadParkingLots = async () => {
  try {
    const res = await parkingLots.list()
    parkingLotsList.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const loadRecords = async () => {
  loading.value = true
  try {
    const res = await parking.records({ licensePlate: searchPlate.value, active: 'true' })
    records.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const doEntry = async () => {
  if (!entryForm.licensePlate) {
    ElMessage.warning('请输入车牌号')
    return
  }
  entryLoading.value = true
  try {
    await parking.entry(entryForm)
    ElMessage.success('入场成功')
    entryForm.licensePlate = ''
    entryForm.spaceNo = ''
    loadRecords()
    loadParkingLots()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    entryLoading.value = false
  }
}

const queryRecord = async () => {
  if (!exitForm.licensePlate) {
    ElMessage.warning('请输入车牌号')
    return
  }
  try {
    const res = await parking.records({ licensePlate: exitForm.licensePlate, active: 'true' })
    if (res.data.length > 0) {
      record.value = res.data[0]
      exitForm.discountAmount = 0
      exitForm.discountReason = ''
    } else {
      record.value = null
      ElMessage.warning('未找到在场车辆')
    }
  } catch (e) {
    ElMessage.error('查询失败')
  }
}

const doExit = async () => {
  if (!record.value) return
  exitLoading.value = true
  try {
    const res = await parking.exit({
      licensePlate: exitForm.licensePlate,
      discountAmount: exitForm.discountAmount,
      discountReason: exitForm.discountReason,
      discountApproverId: 1
    })
    ElMessage.success(`出场成功，费用：¥${res.data.finalFee}`)
    record.value = null
    exitForm.licensePlate = ''
    loadRecords()
    loadParkingLots()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    exitLoading.value = false
  }
}

const formatTime = (t) => t ? t.slice(0, 16) : ''
const calcDuration = (entry) => {
  if (!entry) return '-'
  const diff = Date.now() - new Date(entry).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}分钟`
  return `${Math.floor(mins / 60)}小时${mins % 60}分`
}

onMounted(() => {
  loadParkingLots()
  loadRecords()
})
</script>

<style scoped>
.parking-record {
  margin-top: 20px;
}
</style>
