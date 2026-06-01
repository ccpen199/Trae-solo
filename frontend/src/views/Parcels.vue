<template>
  <div class="parcels">
    <div class="page-header">
      <h2 class="page-title">地块库</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon> 新增地块
      </el-button>
    </div>

    <el-card class="card-shadow">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="村庄">
          <el-select v-model="searchForm.village" placeholder="全部" clearable>
            <el-option label="东村" value="东村" />
            <el-option label="西村" value="西村" />
          </el-select>
        </el-form-item>
        <el-form-item label="流转状态">
          <el-select v-model="searchForm.is_transferable" placeholder="全部" clearable>
            <el-option label="可流转" :value="1" />
            <el-option label="不可流转" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="地块号/位置/承包户" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-shadow" style="margin-top: 20px">
      <el-table :data="parcels" style="width: 100%" @row-click="goToDetail">
        <el-table-column prop="parcel_no" label="地块编号" width="120" />
        <el-table-column prop="owner_name" label="承包户" width="100" />
        <el-table-column prop="area" label="面积(亩)" width="100" />
        <el-table-column prop="location" label="位置" />
        <el-table-column prop="village" label="所属村" width="100" />
        <el-table-column prop="soil_grade" label="土壤等级" width="100" />
        <el-table-column prop="is_transferable" label="流转状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_transferable ? 'success' : 'info'">
              {{ row.is_transferable ? '可流转' : '不可流转' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click.stop="editParcel(row)">编辑</el-button>
            <el-button size="small" type="danger" @click.stop="deleteParcel(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" :title="editingParcel ? '编辑地块' : '新增地块'" width="600px">
      <el-form :model="formData" label-width="120px">
        <el-form-item label="地块编号">
          <el-input v-model="formData.parcel_no" placeholder="如：DC-001" />
        </el-form-item>
        <el-form-item label="承包户">
          <el-input v-model="formData.owner_name" placeholder="承包户姓名" />
        </el-form-item>
        <el-form-item label="面积(亩)">
          <el-input-number v-model="formData.area" :min="0" :precision="1" />
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="formData.location" placeholder="地块位置" />
        </el-form-item>
        <el-form-item label="所属村">
          <el-select v-model="formData.village">
            <el-option label="东村" value="东村" />
            <el-option label="西村" value="西村" />
          </el-select>
        </el-form-item>
        <el-form-item label="土壤等级">
          <el-select v-model="formData.soil_grade">
            <el-option label="A级(优质)" value="A" />
            <el-option label="B级(良好)" value="B" />
            <el-option label="C级(一般)" value="C" />
          </el-select>
        </el-form-item>
        <el-form-item label="作物适配">
          <el-input v-model="formData.crop_adapt" placeholder="如：水稻,小麦" />
        </el-form-item>
        <el-form-item label="权属证明">
          <el-input v-model="formData.ownership_proof" placeholder="权属证明编号" />
        </el-form-item>
        <el-form-item label="可流转">
          <el-switch v-model="formData.is_transferable" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveParcel">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../utils/request'

const router = useRouter()
const parcels = ref([])
const showAddDialog = ref(false)
const editingParcel = ref(null)

const searchForm = reactive({
  village: '',
  is_transferable: '',
  keyword: ''
})

const formData = reactive({
  parcel_no: '',
  owner_name: '',
  area: 0,
  location: '',
  village: '',
  soil_grade: 'B',
  crop_adapt: '',
  ownership_proof: '',
  is_transferable: 1
})

const statusType = (status) => {
  const map = { available: 'success', transferred: 'warning', unavailable: 'info' }
  return map[status] || 'info'
}

const loadData = async () => {
  try {
    const res = await api.get('/parcels', searchForm)
    parcels.value = res.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const resetSearch = () => {
  searchForm.village = ''
  searchForm.is_transferable = ''
  searchForm.keyword = ''
  loadData()
}

const goToDetail = (row) => {
  router.push(`/parcels/${row.id}`)
}

const editParcel = (row) => {
  editingParcel.value = row
  Object.assign(formData, row)
  showAddDialog.value = true
}

const saveParcel = async () => {
  try {
    if (editingParcel.value) {
      await api.put(`/parcels/${editingParcel.value.id}`, formData)
      ElMessage.success('更新成功')
    } else {
      await api.post('/parcels', formData)
      ElMessage.success('添加成功')
    }
    showAddDialog.value = false
    loadData()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  }
}

const deleteParcel = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该地块吗？', '提示', { type: 'warning' })
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
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
