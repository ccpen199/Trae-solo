<template>
  <div class="demand-detail">
    <div class="page-header">
      <h2 class="page-title">流转需求详情</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>需求信息</template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="流转类型">{{ typeMap[demand.type] }}</el-descriptions-item>
            <el-descriptions-item label="价格">{{ demand.price }} 元/亩/年</el-descriptions-item>
            <el-descriptions-item label="期限">{{ demand.term }} 年</el-descriptions-item>
            <el-descriptions-item label="用途限制">{{ demand.usage_restriction || '-' }}</el-descriptions-item>
            <el-descriptions-item label="描述">{{ demand.description || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusType(demand.status)">{{ statusText(demand.status) }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="card-shadow" style="margin-top: 20px">
          <template #header>地块信息</template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="发包方">{{ demand.owner_name }}</el-descriptions-item>
            <el-descriptions-item label="面积">{{ demand.area }} 亩</el-descriptions-item>
            <el-descriptions-item label="位置">{{ demand.location }}</el-descriptions-item>
            <el-descriptions-item label="所属村">{{ demand.village }}</el-descriptions-item>
            <el-descriptions-item label="土壤等级">{{ demand.soil_grade }}</el-descriptions-item>
            <el-descriptions-item label="作物适配">{{ demand.crop_adapt }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>报名意向</span>
              <el-button type="primary" size="small" @click="showBidDialog = true">我要报名</el-button>
            </div>
          </template>
          <el-table :data="bids" style="width: 100%">
            <el-table-column prop="bidder_name" label="意向方" width="120" />
            <el-table-column prop="bid_price" label="出价" width="100" />
            <el-table-column prop="bid_term" label="期限" width="80" />
            <el-table-column prop="intention" label="意向说明" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="bidStatusType(row.status)">{{ bidStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" v-if="demand.status === 'published'">
              <template #default="{ row }">
                <el-button size="small" type="success" @click="confirmBid(row)" v-if="row.status === 'pending'">确认</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="card-shadow" style="margin-top: 20px" v-if="demand.status === 'published'">
          <template #header>操作</template>
          <el-button type="success" @click="createContract">生成合同</el-button>
          <el-button type="warning" @click="completeDemand">标记完成</el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showBidDialog" title="报名意向" width="500px">
      <el-form :model="bidForm" label-width="100px">
        <el-form-item label="意向方名称">
          <el-input v-model="bidForm.bidder_name" placeholder="请输入您的名称" />
        </el-form-item>
        <el-form-item label="出价">
          <el-input-number v-model="bidForm.bid_price" :min="0" /> 元/亩/年
        </el-form-item>
        <el-form-item label="意向期限">
          <el-input-number v-model="bidForm.bid_term" :min="1" /> 年
        </el-form-item>
        <el-form-item label="意向说明">
          <el-input type="textarea" v-model="bidForm.intention" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBidDialog = false">取消</el-button>
        <el-button type="primary" @click="submitBid">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '../utils/request'

const route = useRoute()
const router = useRouter()
const demand = ref({})
const bids = ref([])
const showBidDialog = ref(false)

const typeMap = {
  lease: '出租',
  sublease: '转包',
  share: '入股',
  trust: '托管'
}

const bidForm = reactive({
  bidder_name: '',
  bid_price: 0,
  bid_term: 5,
  intention: ''
})

const statusType = (status) => {
  const map = { pending: 'warning', published: 'success', completed: 'info', cancelled: 'danger' }
  return map[status] || 'info'
}

const statusText = (status) => {
  const map = { pending: '待发布', published: '已发布', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

const bidStatusType = (status) => {
  const map = { pending: 'warning', confirmed: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const bidStatusText = (status) => {
  const map = { pending: '待确认', confirmed: '已确认', rejected: '已拒绝' }
  return map[status] || status
}

const loadData = async () => {
  try {
    const [demandRes, bidsRes] = await Promise.all([
      api.get(`/transfer-demands/${route.params.id}`),
      api.get('/bids', { demand_id: route.params.id })
    ])
    demand.value = demandRes.data
    bids.value = bidsRes.data
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const submitBid = async () => {
  try {
    await api.post('/bids', {
      demand_id: route.params.id,
      bidder_id: 9,
      ...bidForm
    })
    ElMessage.success('报名成功')
    showBidDialog.value = false
    loadData()
  } catch (error) {
    ElMessage.error('提交失败')
  }
}

const confirmBid = async (row) => {
  try {
    await api.put(`/bids/${row.id}/status`, { status: 'confirmed' })
    ElMessage.success('确认成功')
    loadData()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const createContract = () => {
  const confirmedBid = bids.value.find(b => b.status === 'confirmed')
  if (!confirmedBid) {
    ElMessage.warning('请先确认一个意向方')
    return
  }
  router.push({
    path: '/contracts',
    query: {
      create: 'true',
      demand_id: demand.value.id,
      parcel_id: demand.value.id
    }
  })
}

const completeDemand = async () => {
  try {
    await api.put(`/transfer-demands/${route.params.id}/status`, { status: 'completed' })
    ElMessage.success('已标记完成')
    loadData()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

onMounted(loadData)
</script>
