<template>
  <div class="recall-detail">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>召回详情</h3>
          <el-button type="primary" @click="goBack">返回列表</el-button>
        </div>
      </template>
      
      <div v-if="loading" class="loading">
        <el-spinner size="large" />
      </div>
      
      <div v-else class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="召回编号">{{ recallDetail.recall_code }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ recallDetail.batch_code }}</el-descriptions-item>
          <el-descriptions-item label="召回原因">{{ recallDetail.reason }}</el-descriptions-item>
          <el-descriptions-item label="召回等级">
            <el-tag :type="recallDetail.level === 'serious' ? 'danger' : recallDetail.level === 'major' ? 'warning' : 'info'">
              {{ recallDetail.level_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="受影响数量">{{ recallDetail.affected_quantity }}</el-descriptions-item>
          <el-descriptions-item label="已回收数量">{{ recallDetail.recovered_quantity }}</el-descriptions-item>
          <el-descriptions-item label="已处理数量">{{ recallDetail.disposed_quantity }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ recallDetail.status }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ recallDetail.created_at }}</el-descriptions-item>
          <el-descriptions-item label="审批人" :span="2">{{ recallDetail.approval_name }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider />
        
        <h3>终端流向定位</h3>
        <el-table :data="terminalLocations" style="width: 100%">
          <el-table-column prop="terminal_name" label="终端名称" />
          <el-table-column prop="terminal_type" label="终端类型" />
          <el-table-column prop="location" label="位置" />
          <el-table-column prop="quantity" label="数量" />
          <el-table-column prop="status" label="状态" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" type="danger" @click="handleOffShelf(scope.row)">
                下架处理
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-divider />
        
        <h3>召回进度</h3>
        <el-steps :active="currentStep" align-center>
          <el-step title="发起召回" />
          <el-step title="审批通过" />
          <el-step title="终端定位" />
          <el-step title="下架处理" />
          <el-step title="完成召回" />
        </el-steps>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const recallDetail = ref({})
const terminalLocations = ref([])
const currentStep = ref(2)

onMounted(async () => {
  await loadRecallDetail()
})

const loadRecallDetail = async () => {
  loading.value = true
  try {
    const recallUid = route.params.recallUid
    // 模拟数据
    recallDetail.value = {
      recall_code: 'RC-2026-001',
      batch_code: 'FA-PR-26-ABC123',
      reason: '农残超标',
      level: 'serious',
      level_text: '严重',
      affected_quantity: 5000,
      recovered_quantity: 3500,
      disposed_quantity: 500,
      status: '处理中',
      created_at: '2026-04-25 10:00:00',
      approval_name: '张经理'
    }
    
    terminalLocations.value = [
      {
        terminal_name: '永辉超市-北京朝阳店',
        terminal_type: '零售门店',
        location: '北京市朝阳区',
        quantity: 500,
        status: '已下架'
      },
      {
        terminal_name: '物美超市-上海浦东店',
        terminal_type: '零售门店',
        location: '上海市浦东新区',
        quantity: 300,
        status: '处理中'
      }
    ]
  } finally {
    loading.value = false
  }
}

const handleOffShelf = (terminal) => {
  console.log('下架处理:', terminal)
}

const goBack = () => {
  router.push('/recall/records')
}
</script>

<style scoped>
.recall-detail {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.loading {
  text-align: center;
  padding: 60px 0;
}

.detail-content {
  margin-top: 20px;
}

.detail-content h3 {
  margin: 20px 0;
  font-size: 16px;
  color: #303133;
}
</style>
