<template>
  <div class="recall-records">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>召回记录管理</h3>
          <el-button type="danger" @click="createRecall">发起召回</el-button>
        </div>
      </template>
      
      <div class="search-bar">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索召回编号或批次号"
              clearable
              prefix-icon="Search"
            />
          </el-col>
          <el-col :span="6">
            <el-select v-model="searchStatus" placeholder="选择状态" clearable>
              <el-option label="全部" value="" />
              <el-option label="待审批" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="search">搜索</el-button>
          </el-col>
        </el-row>
      </div>
      
      <el-table :data="records" style="width: 100%" stripe>
        <el-table-column prop="recall_code" label="召回编号" width="180" />
        <el-table-column prop="batch_code" label="批次号" />
        <el-table-column prop="reason" label="召回原因" />
        <el-table-column prop="level" label="召回等级" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.level === 'serious' ? 'danger' : scope.row.level === 'major' ? 'warning' : 'info'">
              {{ scope.row.level_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="affected_quantity" label="受影响数量" width="120" />
        <el-table-column prop="recovered_quantity" label="已回收数量" width="120" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewRecall(scope.row.uid)">
              查看
            </el-button>
            <el-button size="small" type="warning" @click="locateTerminals(scope.row.batch_uid)">
              定位终端
            </el-button>
            <el-button size="small" type="success" @click="updateProgress(scope.row.uid)">
              更新进度
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalRecords"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const searchKeyword = ref('')
const searchStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalRecords = ref(0)
const records = ref([])

onMounted(async () => {
  await loadRecords()
})

const loadRecords = async () => {
  // 模拟数据
  records.value = [
    {
      uid: '1',
      recall_code: 'RC-2026-001',
      batch_code: 'FA-PR-26-ABC123',
      reason: '农残超标',
      level: 'serious',
      level_text: '严重',
      affected_quantity: 5000,
      recovered_quantity: 3500,
      status: '处理中',
      batch_uid: 'batch_1',
      created_at: '2026-04-25 10:00:00'
    },
    {
      uid: '2',
      recall_code: 'RC-2026-002',
      batch_code: 'FA-PR-26-DEF456',
      reason: '重金属超标',
      level: 'major',
      level_text: '重要',
      affected_quantity: 3000,
      recovered_quantity: 3000,
      status: '已完成',
      batch_uid: 'batch_2',
      created_at: '2026-04-20 14:30:00'
    }
  ]
  totalRecords.value = records.value.length
}

const search = async () => {
  await loadRecords()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  loadRecords()
}

const handleCurrentChange = (current) => {
  currentPage.value = current
  loadRecords()
}

const createRecall = () => {
  router.push('/recall/create')
}

const viewRecall = (recallUid) => {
  router.push(`/recall/detail/${recallUid}`)
}

const locateTerminals = (batchUid) => {
  console.log('定位终端:', batchUid)
}

const updateProgress = (recallUid) => {
  console.log('更新进度:', recallUid)
}
</script>

<style scoped>
.recall-records {
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

.search-bar {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
