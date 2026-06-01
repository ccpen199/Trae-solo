<template>
  <div class="rules">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>分摊规则</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            新增规则
          </el-button>
        </div>
      </template>

      <el-table :data="rules" border stripe>
        <el-table-column prop="rule_name" label="规则名称" width="200" />
        <el-table-column label="能源类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ energyTypeMap[row.energy_type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分摊类型" width="120">
          <template #default="{ row }">
            <el-tag type="info">{{ allocationTypeMap[row.allocation_type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="building_name" label="适用楼栋" width="140" />
        <el-table-column prop="source_meter_no" label="源表号" width="140" />
        <el-table-column prop="effective_date" label="生效日期" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '生效' : '失效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" />
      </el-table>
    </el-card>

    <el-dialog v-model="addVisible" title="新增分摊规则" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="规则名称" required>
          <el-input v-model="form.rule_name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="能源类型" required>
          <el-select v-model="form.energy_type" placeholder="请选择" style="width: 100%;">
            <el-option label="电" value="electricity" />
            <el-option label="水" value="water" />
            <el-option label="气" value="gas" />
            <el-option label="空调" value="cooling" />
          </el-select>
        </el-form-item>
        <el-form-item label="分摊类型" required>
          <el-select v-model="form.allocation_type" placeholder="请选择" style="width: 100%;">
            <el-option label="面积分摊" value="area" />
            <el-option label="工位分摊" value="workstation" />
            <el-option label="公共区域" value="public" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用楼栋">
          <el-select v-model="form.building_id" placeholder="请选择（为空表示全园区）" style="width: 100%;" clearable>
            <el-option v-for="b in buildings" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="源表计" required>
          <el-select v-model="form.source_meter_id" placeholder="请选择公共总表" style="width: 100%;" filterable>
            <el-option 
              v-for="m in publicMeters" 
              :key="m.id" 
              :label="`${m.meter_no} - ${m.meter_name}`" 
              :value="m.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="生效日期" required>
          <el-date-picker 
            v-model="form.effective_date" 
            type="date" 
            value-format="YYYY-MM-DD" 
            style="width: 100%;" 
          />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="3" />
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
import { ElMessage } from 'element-plus'
import { getAllocationRules, addAllocationRule, getBuildings, getMeters, energyTypeMap, allocationTypeMap } from '../api'

const rules = ref([])
const buildings = ref([])
const publicMeters = ref([])
const addVisible = ref(false)

const form = ref({
  rule_name: '',
  energy_type: '',
  allocation_type: '',
  building_id: null,
  source_meter_id: null,
  effective_date: '',
  description: ''
})

const loadRules = async () => {
  try {
    const res = await getAllocationRules({})
    rules.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const showAddDialog = () => {
  form.value = {
    rule_name: '',
    energy_type: '',
    allocation_type: '',
    building_id: null,
    source_meter_id: null,
    effective_date: new Date().toISOString().split('T')[0],
    description: ''
  }
  addVisible.value = true
}

const handleAdd = async () => {
  if (!form.value.rule_name || !form.value.energy_type || !form.value.allocation_type || !form.value.source_meter_id) {
    ElMessage.warning('请填写必填项')
    return
  }
  try {
    await addAllocationRule(form.value)
    ElMessage.success('新增成功，原有同类型规则已自动失效')
    addVisible.value = false
    loadRules()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '新增失败')
  }
}

onMounted(async () => {
  await loadRules()
  const [bRes, mRes] = await Promise.all([getBuildings(), getMeters({ is_public: 1 })])
  buildings.value = bRes.data
  publicMeters.value = mRes.data
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
