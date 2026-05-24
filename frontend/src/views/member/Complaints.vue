<template>
  <div class="complaints">
    <el-card>
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span>申诉中心</span>
          <el-button type="primary" @click="dialogVisible = true">提交申诉</el-button>
        </div>
      </template>
      <el-table :data="complaints" border>
        <el-table-column prop="created_at" label="提交时间" width="180" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{row}">
            <el-tag>{{ typeMap[row.type] || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="transaction_id" label="关联订单" width="120">
          <template #default="{row}">#{{ row.transaction_id || '-' }}</template>
        </el-table-column>
        <el-table-column prop="description" label="问题描述" show-overflow-tooltip />
        <el-table-column label="状态" width="120">
          <template #default="{row}">
            <el-tag v-if="row.status === 'pending'" type="warning">待处理</el-tag>
            <el-tag v-else-if="row.status === 'processing'" type="primary">处理中</el-tag>
            <el-tag v-else-if="row.status === 'resolved'" type="success">已解决</el-tag>
            <el-tag v-else type="info">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="result" label="处理结果" show-overflow-tooltip />
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="提交申诉" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="申诉类型">
          <el-select v-model="form.type" placeholder="请选择">
            <el-option label="加油量异常" value="volume" />
            <el-option label="金额异常" value="amount" />
            <el-option label="优惠券问题" value="coupon" />
            <el-option label="积分问题" value="points" />
            <el-option label="发票问题" value="invoice" />
            <el-option label="其他问题" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联订单">
          <el-input v-model="form.transaction_id" placeholder="请输入交易单号（选填）" />
        </el-form-item>
        <el-form-item label="问题描述">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请详细描述您遇到的问题" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { member } from '../../api'

const complaints = ref([])
const dialogVisible = ref(false)
const form = ref({ type: '', transaction_id: '', description: '' })
const typeMap = { volume: '加油量异常', amount: '金额异常', coupon: '优惠券问题', points: '积分问题', invoice: '发票问题', other: '其他问题' }

const load = async () => {
  complaints.value = await member.getComplaints()
}
onMounted(load)

const submit = async () => {
  try {
    await member.submitComplaint(form.value)
    ElMessage.success('申诉已提交')
    dialogVisible.value = false
    form.value = { type: '', transaction_id: '', description: '' }
    load()
  } catch (e) {
    ElMessage.error(e.error || '提交失败')
  }
}
</script>
