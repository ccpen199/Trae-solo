<template>
  <div class="complaints">
    <el-card>
      <template #header>申诉处理</template>
      <el-table :data="complaints" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="phone" label="会员手机号" width="140" />
        <el-table-column prop="member_name" label="会员姓名" width="120" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{row}">{{ typeMap[row.type] || row.type }}</template>
        </el-table-column>
        <el-table-column prop="transaction_id" label="关联订单" width="120" />
        <el-table-column prop="description" label="问题描述" show-overflow-tooltip />
        <el-table-column prop="created_at" label="提交时间" width="180" />
        <el-table-column label="状态" width="120">
          <template #default="{row}">
            <el-tag v-if="row.status === 'pending'" type="warning">待处理</el-tag>
            <el-tag v-else-if="row.status === 'processing'" type="primary">处理中</el-tag>
            <el-tag v-else-if="row.status === 'resolved'" type="success">已解决</el-tag>
            <el-tag v-else>{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="result" label="处理结果" show-overflow-tooltip />
        <el-table-column label="操作" width="120">
          <template #default="{row}">
            <el-button v-if="row.status === 'pending'" type="primary" link size="small" @click="handle(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="处理申诉" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="处理状态">
          <el-select v-model="form.status">
            <el-option label="处理中" value="processing'" />
            <el-option label="已解决" value="resolved'" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理结果">
          <el-input v-model="form.result" type="textarea" :rows="4" placeholder="请输入处理结果" />
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
import { report } from '../../api'

const complaints = ref([])
const dialogVisible = ref(false)
const currentId = ref(null)
const form = ref({ status: 'resolved', result: '' })
const typeMap = { volume: '加油量异常', amount: '金额异常', coupon: '优惠券问题', points: '积分问题', invoice: '发票问题', other: '其他问题' }

const load = async () => {
  complaints.value = await report.getComplaints({})
}
onMounted(load)

const handle = (row) => {
  currentId.value = row.id
  form.value = { status: 'resolved', result: '' }
  dialogVisible.value = true
}

const submit = async () => {
  try {
    await report.handleComplaint(currentId.value, form.value)
    ElMessage.success('处理完成')
    dialogVisible.value = false
    load()
  } catch (e) {
    ElMessage.error(e.error || '操作失败')
  }
}
</script>
