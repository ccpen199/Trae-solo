<template>
  <div class="enterprises">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>企业管理</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            新增企业
          </el-button>
        </div>
      </template>

      <el-table :data="enterprises" border stripe>
        <el-table-column prop="name" label="企业名称" width="200" />
        <el-table-column prop="building_name" label="楼栋" width="120" />
        <el-table-column prop="floor" label="楼层" width="100" />
        <el-table-column prop="room_no" label="房号" width="120" />
        <el-table-column prop="area" label="面积(㎡)" width="100" />
        <el-table-column prop="workstations" label="工位" width="100" />
        <el-table-column prop="contact_person" label="联系人" width="120" />
        <el-table-column prop="contact_phone" label="联系电话" width="140" />
        <el-table-column prop="lease_start_date" label="起租日期" width="120" />
        <el-table-column prop="lease_end_date" label="到期日期" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '在租' : '已退租' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'active'" 
              type="danger" 
              link 
              size="small" 
              @click="handleTerminate(row)"
            >
              退租
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="addVisible" title="新增企业" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="企业名称" required>
          <el-input v-model="form.name" placeholder="请输入企业名称" />
        </el-form-item>
        <el-form-item label="所属楼栋" required>
          <el-select v-model="form.building_id" placeholder="请选择" style="width: 100%;">
            <el-option v-for="b in buildings" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="楼层">
          <el-input v-model="form.floor" placeholder="如：3层" />
        </el-form-item>
        <el-form-item label="房号">
          <el-input v-model="form.room_no" placeholder="如：301-305" />
        </el-form-item>
        <el-form-item label="面积(㎡)">
          <el-input-number v-model="form.area" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="工位数">
          <el-input-number v-model="form.workstations" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact_person" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contact_phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="起租日期">
          <el-date-picker 
            v-model="form.lease_start_date" 
            type="date" 
            value-format="YYYY-MM-DD" 
            style="width: 100%;" 
          />
        </el-form-item>
        <el-form-item label="到期日期">
          <el-date-picker 
            v-model="form.lease_end_date" 
            type="date" 
            value-format="YYYY-MM-DD" 
            style="width: 100%;" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEnterprises, addEnterprise, updateEnterprise, getBuildings } from '../api'

const enterprises = ref([])
const buildings = ref([])
const addVisible = ref(false)

const form = ref({
  name: '',
  building_id: null,
  floor: '',
  room_no: '',
  area: 0,
  workstations: 0,
  contact_person: '',
  contact_phone: '',
  lease_start_date: '',
  lease_end_date: ''
})

const loadEnterprises = async () => {
  try {
    const res = await getEnterprises({})
    enterprises.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const showAddDialog = () => {
  form.value = {
    name: '',
    building_id: null,
    floor: '',
    room_no: '',
    area: 0,
    workstations: 0,
    contact_person: '',
    contact_phone: '',
    lease_start_date: '',
    lease_end_date: ''
  }
  addVisible.value = true
}

const handleAdd = async () => {
  if (!form.value.name || !form.value.building_id) {
    ElMessage.warning('请填写必填项')
    return
  }
  try {
    await addEnterprise(form.value)
    ElMessage.success('新增成功')
    addVisible.value = false
    loadEnterprises()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '新增失败')
  }
}

const handleTerminate = async (row) => {
  try {
    await ElMessageBox.confirm(`确认将 ${row.name} 标记为退租？`, '提示', { type: 'warning' })
    await updateEnterprise(row.id, { status: 'inactive' })
    ElMessage.success('已退租')
    loadEnterprises()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

onMounted(async () => {
  await loadEnterprises()
  const bRes = await getBuildings()
  buildings.value = bRes.data
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
