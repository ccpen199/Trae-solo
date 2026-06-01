<template>
  <div class="parcel-detail">
    <div class="page-header">
      <h2 class="page-title">地块详情</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>基本信息</template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="地块编号">{{ parcel.parcel_no }}</el-descriptions-item>
            <el-descriptions-item label="承包户">{{ parcel.owner_name }}</el-descriptions-item>
            <el-descriptions-item label="面积(亩)">{{ parcel.area }}</el-descriptions-item>
            <el-descriptions-item label="位置">{{ parcel.location }}</el-descriptions-item>
            <el-descriptions-item label="所属村">{{ parcel.village }}</el-descriptions-item>
            <el-descriptions-item label="土壤等级">{{ parcel.soil_grade }}</el-descriptions-item>
            <el-descriptions-item label="作物适配">{{ parcel.crop_adapt }}</el-descriptions-item>
            <el-descriptions-item label="权属证明">{{ parcel.ownership_proof || '-' }}</el-descriptions-item>
            <el-descriptions-item label="流转状态">
              <el-tag :type="parcel.is_transferable ? 'success' : 'info'">
                {{ parcel.is_transferable ? '可流转' : '不可流转' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>流转记录</template>
          <el-table :data="demands" style="width: 100%">
            <el-table-column prop="type" label="流转类型" width="100">
              <template #default="{ row }">
                {{ typeMap[row.type] }}
              </template>
            </el-table-column>
            <el-table-column prop="price" label="价格(元/亩/年)" width="120" />
            <el-table-column prop="term" label="期限(年)" width="80" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" @click="$router.push(`/demands/${row.id}`)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../utils/request'

const route = useRoute()
const parcel = ref({})
const demands = ref([])

const typeMap = {
  lease: '出租',
  sublease: '转包',
  share: '入股',
  trust: '托管'
}

const statusType = (status) => {
  const map = { pending: 'warning', published: 'success', completed: 'info', cancelled: 'danger' }
  return map[status] || 'info'
}

const loadData = async () => {
  try {
    const [parcelRes, demandsRes] = await Promise.all([
      api.get(`/parcels/${route.params.id}`),
      api.get('/transfer-demands', { parcel_id: route.params.id })
    ])
    parcel.value = parcelRes.data
    demands.value = demandsRes.data
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

onMounted(loadData)
</script>
