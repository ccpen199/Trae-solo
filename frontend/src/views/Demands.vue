<template>
  <div class="demands">
    <div class="page-header">
      <h2 class="page-title">流转需求</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon> 发布需求
      </el-button>
    </div>

    <el-card class="card-shadow">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="流转类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable>
            <el-option label="出租" value="lease" />
            <el-option label="转包" value="sublease" />
            <el-option label="入股" value="share" />
            <el-option label="托管" value="trust" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="待发布" value="pending" />
            <el-option label="已发布" value="published" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-shadow" style="margin-top: 20px">
      <el-table :data="demands" style="width: 100%">
        <el-table-column prop="type" label="流转类型" width="100">
          <template #default="{ row }">
            {{ typeMap[row.type] }}
          </template>
        </el-table-column>
        <el-table-column prop="owner_name" label="发包方" width="100" />
        <el-table-column prop="area" label="面积(亩)" width="100" />
        <el-table-column prop="location" label="位置" />
        <el-table-column prop="village" label="村庄" width="80" />
        <el-table-column prop="price" label="价格(元/亩)" width="110" />
        <el-table-column prop="term" label="期限(年)" width="90" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="$router.push(`/demands/${row.id}`)">查看</el-button>
            <el-button size="small" type="primary" @click="publishDemand(row)" v-if="row.status === 'pending'">发布</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="发布流转需求" width="600px">
      <el-form :model="formData" label-width="120px">
        <el-form-item label="选择地块">
          <el-select v-model="formData.parcel_id" placeholder="请选择地块" filterable>
            <el-option v-for="p in availableParcels" :key="p.id" :label="`${p.parcel_no} - ${p.location} (${p.area}亩)`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="流转类型">
          <el-select v-model="formData.type">
            <el-option label="出租" value="lease" />
            <el-option label="转包" value="sublease" />
            <el-option label="入股" value="share" />
            <el-option label="托管" value="trust" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格(元/亩/年)">
          <el-input-number v-model="formData.price" :min="0" />
        </el-form-item>
        <el-form-item label="期限(年)">
          <el-input-number v-model="formData.term" :min="1" :max="30" />
        </el-form-item>
        <el-form-item label="用途限制">
          <el-input v-model="formData.usage_restriction" placeholder="如：粮食种植" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input type="textarea" v-model="formData.description" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveDemand">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../utils/request'

const demands = ref([])
const availableParcels = ref([])
const showAddDialog = ref(false)

const typeMap = {
  lease: '出租',
  sublease: '转包',
  share: '入股',
  trust: '托管'
}

const searchForm = reactive({
  type: '',
  status: ''
})

const formData = reactive({
  parcel_id: '',
  type: 'lease',
  price: 0,
  term: 5,
  usage_restriction: '',
  description: '',
  publisher_id: 1
})

const statusType = (status) => {
  const map = { pending: 'warning', published: 'success', completed: 'info', cancelled: 'danger' }
  return map[status] || 'info'
}

const statusText = (status) => {
  const map = { pending: '待发布', published: '已发布', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

const loadData = async () => {
  try {
    const [demandsRes, parcelsRes] = await Promise.all([
      api.get('/transfer-demands', searchForm),
      api.get('/parcels', { is_transferable: 1 })
    ])
    demands.value = demandsRes.data
    availableParcels.value = parcelsRes.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const resetSearch = () => {
  searchForm.type = ''
  searchForm.status = ''
  loadData()
}

const saveDemand = async () => {
  try {
    await api.post('/transfer-demands', formData)
    ElMessage.success('发布成功')
    showAddDialog.value = false
    loadData()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  }
}

const publishDemand = async (row) => {
  try {
    await api.put(`/transfer-demands/${row.id}/status`, { status: 'published' })
    ElMessage.success('发布成功')
    loadData()
  } catch (error) {
    ElMessage.error('发布失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.search-form {
  display: flex;
  flex-wrap: wrap;
}
</style>
