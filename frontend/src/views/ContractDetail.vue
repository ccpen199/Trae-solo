<template>
  <div class="contract-detail">
    <div class="page-header">
      <h2 class="page-title">合同详情 - {{ contract.contract_no }}</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="card-shadow">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>合同信息</span>
              <el-tag :type="statusType(contract.status)" size="large">{{ statusText(contract.status) }}</el-tag>
            </div>
          </template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="合同编号">{{ contract.contract_no }}</el-descriptions-item>
            <el-descriptions-item label="流转类型">{{ typeMap[contract.type] }}</el-descriptions-item>
            <el-descriptions-item label="面积(亩)">{{ contract.area }}</el-descriptions-item>
            <el-descriptions-item label="出租方">{{ contract.lessor_name }}</el-descriptions-item>
            <el-descriptions-item label="承租方">{{ contract.lessee_name }}</el-descriptions-item>
            <el-descriptions-item label="用途">{{ contract.usage }}</el-descriptions-item>
            <el-descriptions-item label="单价(元/亩/年)">{{ contract.price }}</el-descriptions-item>
            <el-descriptions-item label="总金额(元)">{{ contract.total_amount }}</el-descriptions-item>
            <el-descriptions-item label="期限">{{ contract.term }} 年</el-descriptions-item>
            <el-descriptions-item label="开始日期">{{ contract.start_date }}</el-descriptions-item>
            <el-descriptions-item label="结束日期">{{ contract.end_date }}</el-descriptions-item>
            <el-descriptions-item label="签署日期">{{ contract.sign_date || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>租金计划</span>
              <el-button type="primary" size="small" @click="showRentPlanDialog = true">添加计划</el-button>
            </div>
          </template>
          <el-table :data="rentPlans" style="width: 100%">
            <el-table-column prop="period_no" label="期次" width="70" />
            <el-table-column prop="due_date" label="应缴日期" width="110" />
            <el-table-column prop="amount" label="应缴金额" width="100" />
            <el-table-column prop="paid_amount" label="已缴金额" width="100" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'paid' ? 'success' : 'warning'">
                  {{ row.status === 'paid' ? '已缴' : '待缴' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" v-if="rentPlans.some(r => r.status === 'pending')">
              <template #default="{ row }">
                <el-button size="small" type="success" @click="payRent(row)" v-if="row.status === 'pending'">缴费</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>履约记录</template>
          <el-table :data="performance" style="width: 100%">
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                {{ perfTypeMap[row.type] }}
              </template>
            </el-table-column>
            <el-table-column prop="record_date" label="日期" width="110" />
            <el-table-column prop="description" label="说明" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'normal' ? 'success' : 'warning'" size="small">
                  {{ row.status === 'normal' ? '正常' : '异常' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showRentPlanDialog" title="添加租金计划" width="500px">
      <el-form :model="rentPlanForm" label-width="100px">
        <el-form-item label="期次">
          <el-input-number v-model="rentPlanForm.period_no" :min="1" />
        </el-form-item>
        <el-form-item label="应缴日期">
          <el-date-picker v-model="rentPlanForm.due_date" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="rentPlanForm.amount" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRentPlanDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRentPlan">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '../utils/request'

const route = useRoute()
const contract = ref({})
const rentPlans = ref([])
const performance = ref([])
const showRentPlanDialog = ref(false)

const typeMap = {
  lease: '出租',
  sublease: '转包',
  share: '入股',
  trust: '托管'
}

const perfTypeMap = {
  rent: '租金支付',
  crop: '种植用途',
  protection: '土地保护',
  dispute: '纠纷投诉',
  termination: '提前终止'
}

const rentPlanForm = reactive({
  period_no: 1,
  due_date: '',
  amount: 0
})

const statusType = (status) => {
  const map = { draft: 'info', pending_approval: 'warning', village_approved: 'primary', active: 'success', terminated: 'danger' }
  return map[status] || 'info'
}

const statusText = (status) => {
  const map = { draft: '草稿', pending_approval: '待备案', village_approved: '村集体已批', active: '生效中', terminated: '已终止' }
  return map[status] || status
}

const loadData = async () => {
  try {
    const [contractRes, rentRes, perfRes] = await Promise.all([
      api.get(`/contracts/${route.params.id}`),
      api.get(`/contracts/${route.params.id}/rent-plans`),
      api.get('/performance', { contract_id: route.params.id })
    ])
    contract.value = contractRes.data
    rentPlans.value = rentRes.data
    performance.value = perfRes.data
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const saveRentPlan = async () => {
  try {
    await api.post(`/contracts/${route.params.id}/rent-plans`, rentPlanForm)
    ElMessage.success('添加成功')
    showRentPlanDialog.value = false
    loadData()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const payRent = async (row) => {
  try {
    await api.put(`/rent-plans/${row.id}/pay`, { paid_amount: row.amount })
    ElMessage.success('缴费成功')
    loadData()
  } catch (error) {
    ElMessage.error('缴费失败')
  }
}

onMounted(loadData)
</script>
