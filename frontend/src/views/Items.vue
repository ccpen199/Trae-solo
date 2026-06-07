<template>
  <div class="items-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>事项大厅</span>
          <div class="search-box">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索事项名称"
              clearable
              style="width: 240px; margin-right: 12px;"
              @keyup.enter="loadItems"
            />
            <el-select v-model="searchForm.category" placeholder="选择分类" clearable style="width: 160px; margin-right: 12px;">
              <el-option v-for="cat in categories" :key="cat.name" :label="cat.name" :value="cat.name" />
            </el-select>
            <el-button type="primary" @click="loadItems">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="items" v-loading="loading">
        <el-table-column prop="name" label="事项名称" min-width="200" />
        <el-table-column prop="department" label="办理部门" width="180" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="processing_time" label="承诺时限" width="120">
          <template #default="{ row }">
            <span>{{ row.processing_time }} 个工作日</span>
          </template>
        </el-table-column>
        <el-table-column prop="granularity" label="颗粒度" width="120" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/items/${row.id}`)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end;"
        @size-change="loadItems"
        @current-change="loadItems"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import api from '@/utils/api';

const loading = ref(false);
const items = ref<any[]>([]);
const categories = ref<any[]>([]);

const searchForm = reactive({
  keyword: '',
  category: '',
  department: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const loadItems = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      category: searchForm.category || undefined
    };
    const res = await api.get('/items', { params });
    if (res.code === 200) {
      items.value = res.data.list;
      pagination.total = res.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const res = await api.get('/items/categories/list');
    if (res.code === 200) {
      categories.value = res.data.categories;
    }
  } catch (error) {
    console.error('加载分类失败', error);
  }
};

onMounted(() => {
  loadCategories();
  loadItems();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  display: flex;
  align-items: center;
}
</style>
