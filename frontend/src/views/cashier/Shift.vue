<template>
  <div class="shift">
    <el-card v-if="!myShift">
      <template #header>开始班次</template>
      <el-form :model="startForm" label-width="100px" style="max-width: 400px;">
        <el-form-item label="班次名称">
          <el-select v-model="startForm.shift_name">
            <el-option label="早班" value="早班" />
            <el-option label="中班" value="中班" />
            <el-option label="晚班" value="晚班" />
          </el-select>
        </el-form-item>
        <el-form-item label="备用金">
          <el-input-number v-model="startForm.opening_cash" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="startShift">开始班次</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card v-else>
      <template #header>当前班次</template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="班次">{{ myShift.shift_name }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ myShift.start_time }}</el-descriptions-item>
        <el-descriptions-item label="所属油站">{{ myShift.station_name }}</el-descriptions-item>
        <el-descriptions-item label="备用金">¥{{ myShift.opening_cash.toFixed(2) }}</el-descriptions-item>
      </el-descriptions>
      <el-divider />
      <h3>班次统计</h3>
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="6"><el-card><div class="stat"><span>交易笔数</span><b>{{ myShift.stats?.transaction_count || 0 }}</b></div></el-card></el-col>
        <el-col :span="6"><el-card><div class="stat"><span>总金额</span><b>¥{{ myShift.stats?.total_amount?.toFixed(2) || '0.00' }}</b></div></el-card></el-col>
        <el-col :span="6"><el-card><div class="stat"><span>现金收入</span><b>¥{{ myShift.stats?.cash_amount?.toFixed(2) || '0.00' }}</b></div></el-card></el-col>
        <el-col :span="6"><el-card><div class="stat"><span>电子支付</span><b>¥{{ (myShift.stats?.online_amount || 0).toFixed(2) }}</b></div></el-card></el-col>
      </el-row>
      <el-divider />
      <h3>交接班次</h3>
      <el-form :model="endForm" label-width="100px" style="max-width: 400px; margin-top: 20px;">
        <el-form-item label="实际现金">
          <el-input-number v-model="endForm.closing_cash" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="endForm.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item>
          <el-button type="danger" @click="endShift">交接班次</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { shift } from '../../api'

const myShift = ref(null)
const startForm = ref({ shift_name: '早班', opening_cash: 500 })
const endForm = ref({ closing_cash: 0, remark: '' })

const load = async () => {
  try {
    myShift.value = await shift.myShift()
  } catch (e) { myShift.value = null }
}
onMounted(load)

const startShift = async () => {
  try {
    await shift.start(startForm.value)
    ElMessage.success('班次已开始')
    load()
  } catch (e) {
    ElMessage.error(e.error || '操作失败')
  }
}

const endShift = async () => {
  try {
    await ElMessageBox.confirm('确定要交接当前班次吗？', '提示', { type: 'warning' })
    const res = await shift.end({ shift_id: myShift.value.id, ...endForm.value })
    ElMessage.success(`班次交接完成，现金差异: ¥${res.difference.toFixed(2)}`)
    myShift.value = null
  } catch (e) {}
}
</script>

<style scoped>
.stat { text-align: center; padding: 10px 0; }
.stat span { display: block; color: #666; margin-bottom: 5px; }
.stat b { font-size: 24px; color: #409eff; }
</style>
