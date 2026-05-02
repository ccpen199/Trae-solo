<template>
  <div class="houses-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>房源列表</span>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索房源名称/地址/编号"
              style="width: 300px"
              clearable
              @clear="fetchHouses"
              @keyup.enter="fetchHouses"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="fetchHouses">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button v-if="userStore.user?.role === 'admin' || userStore.user?.role === 'developer'" type="primary" @click="openCreateDialog">
              <el-icon><Plus /></el-icon>新增房源
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="houses" v-loading="loading" style="width: 100%" stripe>
        <el-table-column prop="house_no" label="房源编号" width="140" />
        <el-table-column prop="name" label="房源名称" min-width="200">
          <template #default="scope">
            <el-button type="primary" link @click="goToDetail(scope.row.id)">{{ scope.row.name }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="area" label="面积(㎡)" width="100">
          <template #default="scope">
            {{ scope.row.area || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="rooms" label="户型" width="100">
          <template #default="scope">
            {{ scope.row.rooms ? scope.row.rooms + '室' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格(万元)" width="120">
          <template #default="scope">
            {{ scope.row.price ? (scope.row.price / 10000).toFixed(0) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="panoramic_count" label="全景图" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.panoramic_count > 0 ? 'success' : 'info'" size="small">
              {{ scope.row.panoramic_count || 0 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'available' ? 'success' : 'info'">
              {{ scope.row.status === 'available' ? '可租' : '不可租' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="goToDetail(scope.row.id)">详情</el-button>
            <el-button 
              v-if="userStore.user?.role === 'buyer'" 
              type="success" 
              link 
              @click="startViewingSession(scope.row)"
            >开始看房</el-button>
            <el-button 
              v-if="userStore.user?.role === 'admin'" 
              type="danger" 
              link 
              @click="handleDelete(scope.row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchHouses"
          @current-change="fetchHouses"
        />
      </div>
    </el-card>

    <el-dialog v-model="createDialogVisible" title="新增房源" width="600px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="房源编号" prop="house_no">
          <el-input v-model="createForm.house_no" placeholder="请输入房源编号" />
        </el-form-item>
        <el-form-item label="房源名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入房源名称" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="createForm.address" placeholder="请输入地址" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="面积(㎡)" prop="area">
              <el-input-number v-model="createForm.area" :min="0" :precision="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="户型(室)" prop="rooms">
              <el-input-number v-model="createForm.rooms" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="价格(元)" prop="price">
          <el-input-number v-model="createForm.price" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/user'
import { housesApi, sessionsApi } from '@/api'
import { Search, Plus } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const houses = ref([])
const searchKeyword = ref('')
const createDialogVisible = ref(false)
const createFormRef = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const createForm = reactive({
  house_no: '',
  name: '',
  address: '',
  area: null,
  rooms: null,
  price: null
})

const createRules = {
  house_no: [{ required: true, message: '请输入房源编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入房源名称', trigger: 'blur' }]
}

const goToDetail = (id) => {
  router.push(`/houses/${id}`)
}

const fetchHouses = async () => {
  loading.value = true
  try {
    const res = await housesApi.getList({
      keyword: searchKeyword.value,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    houses.value = res.houses
    pagination.total = res.pagination.total
  } catch (error) {
    console.error('获取房源列表失败:', error)
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  createForm.house_no = `H${Date.now()}`
  createForm.name = ''
  createForm.address = ''
  createForm.area = null
  createForm.rooms = null
  createForm.price = null
  createDialogVisible.value = true
}

const handleCreate = async () => {
  const valid = await createFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await housesApi.create(createForm)
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    fetchHouses()
  } catch (error) {
    console.error('创建房源失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除房源 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await housesApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchHouses()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除房源失败:', error)
    }
  }
}

const startViewingSession = async (house) => {
  try {
    const res = await sessionsApi.create({ house_id: house.id })
    ElMessage.success('看房会话创建成功')
    router.push(`/sessions/${res.session.id}`)
  } catch (error) {
    if (error.response?.data?.existingSessionId) {
      ElMessage.warning('该房源已有进行中的看房会话')
      router.push(`/sessions/${error.response.data.existingSessionId}`)
    }
  }
}

onMounted(() => {
  fetchHouses()
})
</script>

<style scoped>
.houses-container {
  min-height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
