<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-weight: bold">居民档案列表</span>
          <div>
            <el-input
              v-model="keyword"
              placeholder="搜索姓名/电话/身份证"
              style="width: 250px; margin-right: 10px"
              clearable
              @clear="loadData"
              @keyup.enter="loadData"
            />
            <el-button type="primary" @click="openMergeDialog" :disabled="selectedResidents.length < 2">
              合并选中 ({{ selectedResidents.length }})
            </el-button>
            <el-button type="primary" @click="openDialog">新增居民</el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="tableData"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column prop="id_card" label="身份证" width="180" />
        <el-table-column label="楼栋" width="120">
          <template #default="{ row }">
            {{ row.building }}栋{{ row.unit }}单元{{ row.room_number }}
          </template>
        </el-table-column>
        <el-table-column label="身份" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.is_party_member" type="danger" size="small" style="margin-right: 5px">党员</el-tag>
            <el-tag v-if="row.is_volunteer" type="success" size="small">志愿者</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_points" label="总积分" width="100" />
        <el-table-column prop="available_points" label="可用积分" width="100" />
        <el-table-column label="隐私授权" width="100">
          <template #default="{ row }">
            <el-tag :type="row.privacy_authorized ? 'success' : 'info'" size="small">
              {{ row.privacy_authorized ? '已授权' : '未授权' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        style="margin-top: 20px; justify-content: flex-end"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑居民' : '新增居民'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="姓名" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input v-model="form.id_card" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="楼栋">
              <el-input v-model="form.building" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单元">
              <el-input v-model="form.unit" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="房号">
              <el-input v-model="form.room_number" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="党员身份">
          <el-switch v-model="form.is_party_member" />
        </el-form-item>
        <el-form-item label="志愿者身份">
          <el-switch v-model="form.is_volunteer" />
        </el-form-item>
        <el-form-item label="隐私授权">
          <el-switch v-model="form.privacy_authorized" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="mergeDialogVisible" title="合并居民" width="500px">
      <div style="margin-bottom: 20px">
        <p>已选择 {{ selectedResidents.length }} 位居民进行合并</p>
        <p style="color: #909399; font-size: 14px">请选择目标居民，其他居民的数据将合并到目标居民</p>
      </div>
      <el-form label-width="100px">
        <el-form-item label="目标居民">
          <el-select v-model="mergeTargetId" style="width: 100%">
            <el-option
              v-for="r in selectedResidents"
              :key="r.id"
              :label="`${r.name} (ID: ${r.id})`"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="mergeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleMerge">确认合并</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="居民详情" width="700px">
      <el-descriptions :column="2" border v-if="currentResident">
        <el-descriptions-item label="姓名">{{ currentResident.name }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ currentResident.phone }}</el-descriptions-item>
        <el-descriptions-item label="身份证">{{ currentResident.id_card }}</el-descriptions-item>
        <el-descriptions-item label="住址">
          {{ currentResident.building }}栋{{ currentResident.unit }}单元{{ currentResident.room_number }}
        </el-descriptions-item>
        <el-descriptions-item label="总积分">{{ currentResident.total_points }}</el-descriptions-item>
        <el-descriptions-item label="可用积分">{{ currentResident.available_points }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeTab" style="margin-top: 20px">
        <el-tab-pane label="积分明细" name="transactions">
          <el-table :data="transactions" size="small">
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.type === 'earn' ? 'success' : row.type === 'spend' ? 'danger' : 'warning'" size="small">
                  {{ row.type === 'earn' ? '获得' : row.type === 'spend' ? '消费' : '撤销' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="points" label="积分" width="80" />
            <el-table-column prop="balance_before" label="变动前" width="80" />
            <el-table-column prop="balance_after" label="变动后" width="80" />
            <el-table-column prop="reason" label="原因" show-overflow-tooltip />
            <el-table-column label="撤销" width="80">
              <template #default="{ row }">
                <el-button
                  v-if="row.type === 'earn' && !row.is_revoked"
                  type="danger"
                  link
                  size="small"
                  @click="revokePoints(row)"
                >撤销</el-button>
                <el-tag v-else-if="row.is_revoked" type="info" size="small">已撤销</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间" width="180" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const selectedResidents = ref([])

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({})

const mergeDialogVisible = ref(false)
const mergeTargetId = ref(null)

const detailVisible = ref(false)
const currentResident = ref(null)
const activeTab = ref('transactions')
const transactions = ref([])

const loadData = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/residents', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: keyword.value || undefined
      }
    })
    tableData.value = res.data.data
    total.value = res.data.total
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (selection) => {
  selectedResidents.value = selection
}

const openDialog = (row = null) => {
  isEdit.value = !!row
  form.value = row ? { ...row } : {
    name: '',
    id_card: '',
    phone: '',
    building: '',
    unit: '',
    room_number: '',
    is_party_member: false,
    is_volunteer: false,
    privacy_authorized: false
  }
  dialogVisible.value = true
}

const handleSave = async () => {
  try {
    if (isEdit.value) {
      await axios.put(`/api/residents/${form.value.id}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/residents', form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该居民吗？', '提示')
    await axios.delete(`/api/residents/${row.id}`)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const openMergeDialog = () => {
  mergeTargetId.value = selectedResidents.value[0]?.id
  mergeDialogVisible.value = true
}

const handleMerge = async () => {
  try {
    const sourceIds = selectedResidents.value
      .filter(r => r.id !== mergeTargetId.value)
      .map(r => r.id)

    await axios.post('/api/residents/merge', {
      targetId: mergeTargetId.value,
      sourceIds
    })
    ElMessage.success('合并成功')
    mergeDialogVisible.value = false
    selectedResidents.value = []
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '合并失败')
  }
}

const viewDetail = async (row) => {
  currentResident.value = row
  detailVisible.value = true
  loadTransactions(row.id)
}

const loadTransactions = async (residentId) => {
  try {
    const res = await axios.get(`/api/residents/${residentId}/transactions`)
    transactions.value = res.data.data
  } catch (e) {
    console.error(e)
  }
}

const revokePoints = async (row) => {
  try {
    await ElMessageBox.confirm('确定撤销该积分吗？', '提示')
    await axios.post('/api/publication/points/revoke', {
      transaction_id: row.id,
      reason: '手动撤销'
    })
    ElMessage.success('撤销成功')
    loadTransactions(currentResident.value.id)
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.error || '撤销失败')
    }
  }
}

onMounted(() => {
  loadData()
})
</script>
