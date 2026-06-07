<template>
  <div class="standard-page">
    <el-card>
      <template #header>
        <span>全省事项标准化引擎 - 国家事项库编码映射</span>
      </template>

      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-statistic title="事项总数" :value="mappingData.statistics?.total || 0" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="已映射" :value="mappingData.statistics?.mapped || 0" value-style="color: #10b981" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="未映射" :value="mappingData.statistics?.unmapped || 0" value-style="color: #f59e0b" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="映射率" :value="mappingData.statistics?.mappingRate || '0%'" />
        </el-col>
      </el-row>

      <el-table :data="mappingData.items || []" style="margin-top: 20px;">
        <el-table-column prop="name" label="事项名称" min-width="200" />
        <el-table-column prop="department" label="所属部门" width="140" />
        <el-table-column prop="local_code" label="本地编码" width="120" />
        <el-table-column label="国家编码映射" width="200">
          <template #default="{ row }">
            <el-input 
              v-if="row.editing"
              v-model="row.national_code"
              size="small"
              placeholder="请输入国家编码"
              @blur="saveMapping(row)"
              @keyup.enter="saveMapping(row)"
            />
            <span v-else @click="startEdit(row)" class="editable-text">
              {{ row.national_code || '点击映射' }}
              <el-icon style="margin-left: 4px; font-size: 12px;"><Edit /></el-icon>
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/utils/api';

const mappingData = ref<any>({ statistics: {}, items: [] });

const loadMapping = async () => {
  try {
    const res = await api.get('/items/standard/mapping');
    if (res.code === 200) {
      mappingData.value = res.data;
    }
  } catch (error) {
    console.error('加载映射数据失败', error);
  }
};

const startEdit = (row: any) => {
  row.editing = true;
};

const saveMapping = async (row: any) => {
  row.editing = false;
  try {
    const res = await api.post('/items/standard/map', {
      itemId: row.id,
      nationalCode: row.national_code
    });
    if (res.code === 200) {
      ElMessage.success('映射成功');
      loadMapping();
    }
  } catch (error) {
    console.error('保存映射失败', error);
  }
};

onMounted(() => {
  loadMapping();
});
</script>

<style scoped>
.stats-row {
  margin-bottom: 20px;
}

.editable-text {
  cursor: pointer;
  color: #3b82f6;
}

.editable-text:hover {
  text-decoration: underline;
}
</style>
