<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">新增检查记录</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-card>
      <el-form :model="form" label-width="120px" style="max-width: 800px">
        <el-form-item label="检查单位" required>
          <el-select v-model="form.unit_id" placeholder="请选择检查单位" style="width: 100%">
            <el-option v-for="unit in units" :key="unit.id" :label="unit.name" :value="unit.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="检查人" required>
          <el-select v-model="form.inspector" placeholder="请选择检查人" style="width: 100%" filterable allow-create>
            <el-option v-for="inspector in inspectors" :key="inspector" :label="inspector" :value="inspector" />
          </el-select>
        </el-form-item>
        <el-form-item label="检查日期" required>
          <el-date-picker v-model="form.inspection_date" type="date" style="width: 100%" />
        </el-form-item>

        <el-divider>检查项目</el-divider>

        <el-form-item label="灭火器">
          <el-radio-group v-model="form.fire_extinguisher">
            <el-radio value="normal">正常</el-radio>
            <el-radio value="minor">一般问题</el-radio>
            <el-radio value="serious">严重问题</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="疏散通道">
          <el-radio-group v-model="form.evacuation_route">
            <el-radio value="normal">正常</el-radio>
            <el-radio value="minor">一般问题</el-radio>
            <el-radio value="serious">严重问题</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="电气线路">
          <el-radio-group v-model="form.electrical_circuit">
            <el-radio value="normal">正常</el-radio>
            <el-radio value="minor">一般问题</el-radio>
            <el-radio value="serious">严重问题</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="消防控制室">
          <el-radio-group v-model="form.control_room">
            <el-radio value="normal">正常</el-radio>
            <el-radio value="minor">一般问题</el-radio>
            <el-radio value="serious">严重问题</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="其他问题">
          <el-input v-model="form.other_issues" type="textarea" :rows="3" placeholder="请输入其他发现的问题" />
        </el-form-item>

        <el-form-item label="总体状态">
          <el-radio-group v-model="form.overall_status">
            <el-radio value="pass">合格</el-radio>
            <el-radio value="fail">有隐患</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">提交</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

const router = useRouter()
const units = ref([])
const submitting = ref(false)
const inspectors = ref(['张警官', '李警官', '王警官', '赵队长', '刘科长', '陈督察', '杨执法'])

const form = reactive({
  unit_id: null,
  inspector: '',
  inspection_date: new Date().toISOString().split('T')[0],
  fire_extinguisher: 'normal',
  evacuation_route: 'normal',
  electrical_circuit: 'normal',
  control_room: 'normal',
  other_issues: '',
  overall_status: 'pass'
})

const loadUnits = async () => {
  units.value = await api.getUnits()
}

const handleSubmit = async () => {
  if (!form.unit_id || !form.inspector || !form.inspection_date) {
    ElMessage.warning('请填写必填项')
    return
  }
  
  submitting.value = true
  try {
    await api.createInspectionRecord(form)
    ElMessage.success('检查记录提交成功')
    router.push('/inspections')
  } catch (error) {
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadUnits()
})
</script>
