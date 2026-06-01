<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">检查记录</h2>
      <el-button type="primary" @click="$router.push('/inspections/new')">
        <el-icon><Plus /></el-icon>
        新增检查
      </el-button>
    </div>

    <el-table :data="records" border stripe>
      <el-table-column prop="unit_name" label="检查单位" min-width="150" />
      <el-table-column prop="inspection_date" label="检查日期" width="120" />
      <el-table-column prop="inspector" label="检查人" width="100" />
      <el-table-column label="灭火器" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.fire_extinguisher)" size="small">
            {{ getStatusText(row.fire_extinguisher) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="疏散通道" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.evacuation_route)" size="small">
            {{ getStatusText(row.evacuation_route) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="电气线路" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.electrical_circuit)" size="small">
            {{ getStatusText(row.electrical_circuit) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="消防控制室" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.control_room)" size="small">
            {{ getStatusText(row.control_room) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="总体状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.overall_status === 'pass' ? 'success' : 'warning'" size="small">
            {{ row.overall_status === 'pass' ? '合格' : '有隐患' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="detailVisible" title="检查详情" width="800px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="检查单位">{{ currentRecord.unit_name }}</el-descriptions-item>
        <el-descriptions-item label="检查日期">{{ currentRecord.inspection_date }}</el-descriptions-item>
        <el-descriptions-item label="检查人">{{ currentRecord.inspector }}</el-descriptions-item>
        <el-descriptions-item label="总体状态">
          <el-tag :type="currentRecord.overall_status === 'pass' ? 'success' : 'warning'">
            {{ currentRecord.overall_status === 'pass' ? '合格' : '有隐患' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="灭火器" :span="2">
          <el-tag :type="getStatusType(currentRecord.fire_extinguisher)" size="small">
            {{ getStatusText(currentRecord.fire_extinguisher) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="疏散通道" :span="2">
          <el-tag :type="getStatusType(currentRecord.evacuation_route)" size="small">
            {{ getStatusText(currentRecord.evacuation_route) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="电气线路" :span="2">
          <el-tag :type="getStatusType(currentRecord.electrical_circuit)" size="small">
            {{ getStatusText(currentRecord.electrical_circuit) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="消防控制室" :span="2">
          <el-tag :type="getStatusType(currentRecord.control_room)" size="small">
            {{ getStatusText(currentRecord.control_room) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="其他问题" :span="2">{{ currentRecord.other_issues || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const records = ref([])
const detailVisible = ref(false)
const currentRecord = ref(null)

const getStatusType = (status) => {
  if (status === 'normal') return 'success'
  if (status === 'minor') return 'warning'
  if (status === 'serious') return 'danger'
  return 'info'
}

const getStatusText = (status) => {
  if (status === 'normal') return '正常'
  if (status === 'minor') return '一般问题'
  if (status === 'serious') return '严重问题'
  return '未检查'
}

const viewDetail = (row) => {
  currentRecord.value = row
  detailVisible.value = true
}

const loadRecords = async () => {
  records.value = await api.getInspectionRecords()
}

onMounted(() => {
  loadRecords()
})
</script>
