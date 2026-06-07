<template>
  <div class="whitelist-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">熟车白名单</span>
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            添加司机
          </el-button>
        </div>
      </template>

      <el-table :data="whitelist" v-loading="loading" stripe>
        <el-table-column label="司机信息" min-width="200">
          <template #default="{ row }">
            <div class="driver-info">
              <el-avatar :size="48">{{ row.driver_name?.charAt(0) }}</el-avatar>
              <div class="driver-detail">
                <div class="driver-name">{{ row.driver_name }}</div>
                <div class="driver-phone">{{ row.driver_phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="车辆信息" min-width="180">
          <template #default="{ row }">
            <div>{{ row.vehicle_type }} / {{ row.vehicle_length }}米</div>
            <div class="plate-number">{{ row.plate_number }}</div>
          </template>
        </el-table-column>
        <el-table-column label="信用评分" width="180">
          <template #default="{ row }">
            <div class="rating-box">
              <el-rate v-model="row.credit_score" disabled :max="5" />
              <span class="rating-text">{{ row.credit_score }}分</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="cooperation_count" label="历史合作(次)" width="140" align="center" />
        <el-table-column prop="added_at" label="添加时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.added_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleRemove(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && whitelist.length === 0" description="暂无白名单司机" />

      <div class="pagination" v-if="whitelist.length > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchWhitelist"
          @current-change="fetchWhitelist"
        />
      </div>
    </el-card>

    <el-dialog v-model="showAddDialog" title="添加白名单司机" width="500px">
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        label-width="100px"
        class="add-form"
      >
        <el-form-item label="司机姓名" prop="driver_name">
          <el-input v-model="addForm.driver_name" placeholder="请输入司机姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="driver_phone">
          <el-input v-model="addForm.driver_phone" placeholder="请输入司机手机号" />
        </el-form-item>
        <el-form-item label="车牌号码" prop="plate_number">
          <el-input v-model="addForm.plate_number" placeholder="请输入车牌号码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="adding" @click="handleAdd">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { shipperApi } from '../../api/index'

const loading = ref(false)
const adding = ref(false)
const showAddDialog = ref(false)
const addFormRef = ref(null)

const pagination = reactive({
  page: 1,
  page_size: 10,
  total: 0
})

const whitelist = ref([])

const addForm = reactive({
  driver_name: '',
  driver_phone: '',
  plate_number: ''
})

const addRules = {
  driver_name: [{ required: true, message: '请输入司机姓名', trigger: 'blur' }],
  driver_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  plate_number: [{ required: true, message: '请输入车牌号码', trigger: 'blur' }]
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

async function fetchWhitelist() {
  loading.value = true
  try {
    const res = await shipperApi.getWhitelist()
    const data = res.data || {}
    whitelist.value = data.list || data || []
    pagination.total = data.total || whitelist.value.length
  } catch (e) {
    ElMessage.error('获取白名单失败')
  } finally {
    loading.value = false
  }
}

async function handleAdd() {
  if (!addFormRef.value) return
  await addFormRef.value.validate(async (valid) => {
    if (!valid) return
    adding.value = true
    try {
      await shipperApi.addWhitelist({ ...addForm })
      ElMessage.success('添加成功')
      showAddDialog.value = false
      addFormRef.value.resetFields()
      Object.assign(addForm, { driver_name: '', driver_phone: '', plate_number: '' })
      fetchWhitelist()
    } catch (e) {
      ElMessage.error(e.response?.data?.message || '添加失败')
    } finally {
      adding.value = false
    }
  })
}

async function handleRemove(row) {
  try {
    await ElMessageBox.confirm(`确定要将司机"${row.driver_name}"从白名单中移除吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  loading.value = true
  try {
    await shipperApi.removeWhitelist(row.id)
    ElMessage.success('移除成功')
    fetchWhitelist()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '移除失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchWhitelist()
})
</script>

<style scoped>
.whitelist-page {
  padding: 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-weight: 600;
  font-size: 16px;
}
.driver-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.driver-detail {
  flex: 1;
}
.driver-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}
.driver-phone {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}
.plate-number {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
.rating-box {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rating-text {
  font-size: 14px;
  color: #606266;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.add-form {
  padding-top: 10px;
}
</style>
