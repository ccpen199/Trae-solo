<template>
  <div class="waste-list-container">
    <el-card class="filter-card" shadow="never">
      <el-form :model="queryParams" inline class="filter-form">
        <el-form-item label="分类">
          <el-select
            v-model="queryParams.category"
            placeholder="请选择分类"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入废弃物名称"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">废弃物列表</span>
          <el-button type="primary" @click="handlePublish">
            <el-icon><Plus /></el-icon>
            发布废弃物
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        empty-text="暂无数据"
      >
        <el-table-column label="图片" width="120">
          <template #default="scope">
            <el-image
              :src="scope.row.images?.[0] || placeholderImage"
              :preview-src-list="scope.row.images || []"
              fit="cover"
              class="waste-image"
            />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="scope">
            <span class="waste-title">{{ scope.row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120">
          <template #default="scope">
            <el-tag type="success" effect="light">{{ scope.row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="重量" width="120">
          <template #default="scope">
            <span>{{ scope.row.weight }} {{ scope.row.unit || 'kg' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="140">
          <template #default="scope">
            <span class="price-text">
              <template v-if="scope.row.priceType === 'negotiable'">
                议价
              </template>
              <template v-else-if="scope.row.priceType === 'estimate'">
                估价
              </template>
              <template v-else>
                ¥{{ scope.row.price?.toLocaleString() }}
              </template>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="statusTypeMap[scope.row.status]" effect="light">
              {{ statusTextMap[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              v-if="scope.row.status === 'draft'"
              type="success"
              link
              @click="handleSubmitReview(scope.row)"
            >
              <el-icon><Check /></el-icon>
              提交审核
            </el-button>
            <el-button
              v-if="scope.row.status === 'online'"
              type="warning"
              link
              @click="handleOffline(scope.row)"
            >
              <el-icon><Bottom /></el-icon>
              下架
            </el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="420px">
      <div class="delete-confirm">
        <el-icon :size="48" class="warning-icon"><Warning /></el-icon>
        <p>确定要删除该废弃物吗？删除后无法恢复。</p>
      </div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="deleteLoading" @click="confirmDelete">
          确认删除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Refresh, Plus, Edit, Delete, Check, Bottom, Warning
} from '@element-plus/icons-vue'
import { getWasteList, deleteWaste, submitReview } from '@/api/waste'

const router = useRouter()
const loading = ref(false)
const deleteLoading = ref(false)
const deleteDialogVisible = ref(false)
const currentDeleteId = ref(null)

const placeholderImage = 'https://via.placeholder.com/100x100/e8f5e9/66bb6a?text=No+Image'

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  category: '',
  status: '',
  keyword: ''
})

const categoryOptions = [
  { label: '工业边角料', value: 'industrial' },
  { label: '二手设备', value: 'equipment' },
  { label: '废旧家电', value: 'appliance' },
  { label: '生活塑料', value: 'plastic' }
]

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '待审核', value: 'pending' },
  { label: '已上架', value: 'online' },
  { label: '已下架', value: 'offline' },
  { label: '审核未通过', value: 'rejected' }
]

const statusTypeMap = {
  draft: 'info',
  pending: 'warning',
  online: 'success',
  offline: 'info',
  rejected: 'danger'
}

const statusTextMap = {
  draft: '草稿',
  pending: '待审核',
  online: '已上架',
  offline: '已下架',
  rejected: '审核未通过'
}

const tableData = ref([
  {
    id: 1,
    title: '废旧纸箱一批 工厂库存',
    category: '工业边角料',
    subCategory: '废纸',
    material: '牛皮纸',
    weight: 500,
    unit: 'kg',
    price: 1200,
    priceType: 'fixed',
    status: 'online',
    images: ['https://via.placeholder.com/400x300/e8f5e9/66bb6a?text=Waste+Paper'],
    createTime: '2024-06-10 14:30:25'
  },
  {
    id: 2,
    title: '二手注塑机 8成新',
    category: '二手设备',
    subCategory: '机械设备',
    material: '钢铁',
    weight: 2500,
    unit: 'kg',
    price: 0,
    priceType: 'negotiable',
    status: 'pending',
    images: ['https://via.placeholder.com/400x300/c8e6c9/4caf50?text=Injection+Machine'],
    createTime: '2024-06-12 09:15:42'
  },
  {
    id: 3,
    title: '废旧家电 冰箱洗衣机',
    category: '废旧家电',
    subCategory: '大家电',
    material: '混合材质',
    weight: 120,
    unit: 'kg',
    price: 360,
    priceType: 'fixed',
    status: 'online',
    images: ['https://via.placeholder.com/400x300/dcedc8/81c784?text=Old+Appliances'],
    createTime: '2024-06-11 16:45:10'
  },
  {
    id: 4,
    title: '生活塑料瓶 回收打包',
    category: '生活塑料',
    subCategory: 'PET瓶',
    material: 'PET塑料',
    weight: 800,
    unit: 'kg',
    price: 0,
    priceType: 'estimate',
    status: 'draft',
    images: ['https://via.placeholder.com/400x300/e8f5e9/a5d6a7?text=Plastic+Bottles'],
    createTime: '2024-06-13 11:20:33'
  },
  {
    id: 5,
    title: '工业废铁 边角料',
    category: '工业边角料',
    subCategory: '废金属',
    material: '生铁',
    weight: 3000,
    unit: 'kg',
    price: 4500,
    priceType: 'fixed',
    status: 'offline',
    images: ['https://via.placeholder.com/400x300/f1f8e9/66bb6a?text=Scrap+Iron'],
    createTime: '2024-06-08 08:30:18'
  }
])

const total = ref(25)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getWasteList(queryParams)
    if (res.data) {
      tableData.value = res.data.list || res.data
      total.value = res.data.total || tableData.value.length
    }
  } catch (err) {
    console.error('获取废弃物列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  fetchData()
}

const handleReset = () => {
  queryParams.category = ''
  queryParams.status = ''
  queryParams.keyword = ''
  queryParams.page = 1
  fetchData()
}

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.page = 1
  fetchData()
}

const handleCurrentChange = (val) => {
  queryParams.page = val
  fetchData()
}

const handlePublish = () => {
  router.push('/producer/wastes/publish')
}

const handleEdit = (row) => {
  router.push(`/producer/wastes/publish?id=${row.id}`)
}

const handleSubmitReview = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要提交审核吗？提交后将进入审核流程。',
      '提交审核',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const res = await submitReview(row.id)
    if (res.code === 200 || res.success) {
      ElMessage.success('提交审核成功')
      const item = tableData.value.find(item => item.id === row.id)
      if (item) item.status = 'pending'
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('提交审核失败')
    }
  }
}

const handleOffline = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要下架该废弃物吗？',
      '下架确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const item = tableData.value.find(item => item.id === row.id)
    if (item) item.status = 'offline'
    ElMessage.success('下架成功')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('下架失败')
    }
  }
}

const handleDelete = (row) => {
  currentDeleteId.value = row.id
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  deleteLoading.value = true
  try {
    const res = await deleteWaste(currentDeleteId.value)
    if (res.code === 200 || res.success || res) {
      ElMessage.success('删除成功')
      deleteDialogVisible.value = false
      const index = tableData.value.findIndex(item => item.id === currentDeleteId.value)
      if (index > -1) {
        tableData.value.splice(index, 1)
      }
      total.value--
    }
  } catch (err) {
    ElMessage.error('删除失败')
  } finally {
    deleteLoading.value = false
    currentDeleteId.value = null
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.waste-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card {
  border-radius: 12px;
}

.filter-card :deep(.el-card__body) {
  padding: 16px 20px 0;
}

.filter-form {
  margin-bottom: 0;
}

.table-card {
  border-radius: 12px;
}

.table-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.table-card :deep(.el-card__body) {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.waste-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  cursor: pointer;
}

.waste-title {
  font-weight: 500;
  color: #303133;
}

.price-text {
  color: #e6a23c;
  font-weight: 600;
  font-size: 15px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.delete-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.warning-icon {
  color: #e6a23c;
  margin-bottom: 16px;
}

.delete-confirm p {
  font-size: 14px;
  color: #606266;
  margin: 0;
}
</style>
