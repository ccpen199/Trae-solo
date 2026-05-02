<template>
  <div class="bom-list-container">
    <el-card class="filter-card">
      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option label="草稿" value="draft" />
            <el-option label="已生成" value="generated" />
            <el-option label="已确认" value="confirmed" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="queryForm.keyword" placeholder="BOM编号/款式" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary">搜索</el-button>
          <el-button>重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>BOM列表</span>
        </div>
      </template>

      <el-table :data="bomList" stripe>
        <el-table-column prop="bomNumber" label="BOM编号" width="150" />
        <el-table-column prop="styleNumber" label="款号" width="130" />
        <el-table-column prop="styleName" label="款式名称" min-width="180" />
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column prop="totalCost" label="总成本" width="120" />
        <el-table-column prop="unitCost" label="单位成本" width="120" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" text @click="handleView(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const bomList = ref([])
const total = ref(0)

const queryForm = reactive({
  page: 1,
  pageSize: 20,
  status: '',
  keyword: '',
})

const handleView = (row: { id: string }) => {
  router.push(`/boms/${row.id}`)
}

onMounted(() => {
  console.log('BomListView mounted')
})
</script>

<style scoped>
.bom-list-container {
  .filter-card {
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
