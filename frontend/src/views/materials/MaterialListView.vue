<template>
  <div class="material-list-container">
    <el-card class="filter-card">
      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="分类">
          <el-select v-model="queryForm.category" placeholder="全部分类" clearable style="width: 150px">
            <el-option label="面料" value="fabric" />
            <el-option label="辅料" value="accessory" />
            <el-option label="包装" value="packaging" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="queryForm.keyword" placeholder="物料编码/名称" clearable style="width: 180px" />
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
          <span>物料列表</span>
        </div>
      </template>

      <el-table :data="materialList" stripe>
        <el-table-column prop="materialCode" label="物料编码" width="150" />
        <el-table-column prop="name" label="物料名称" min-width="180" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="specification" label="规格" width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="unitPrice" label="单价" width="100" />
        <el-table-column prop="supplierName" label="供应商" width="150" />
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

const materialList = ref([])
const total = ref(0)

const queryForm = reactive({
  page: 1,
  pageSize: 20,
  category: '',
  keyword: '',
})

const handleView = (row: { id: string; name: string }) => {
  console.log('查看物料:', row)
}

onMounted(() => {
  console.log('MaterialListView mounted')
})
</script>

<style scoped>
.material-list-container {
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
