<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">新建工单</span>
      <div>
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" @click="save">创建</el-button>
      </div>
    </div>
    
    <el-card>
      <el-form :model="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="工单号" required>
              <el-input v-model="form.order_no" placeholder="例如：WO202401001" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产品" required>
              <el-select v-model="form.product_id" placeholder="选择产品" style="width: 100%;">
                <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="数量" required>
              <el-input-number v-model="form.quantity" :min="1" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="工序流程" required>
          <el-transfer
            v-model="selectedProcesses"
            filterable
            :data="processOptions"
            :titles="['可选工序', '已选工序']"
            :props="{ key: 'id', label: 'name' }"
          />
          <div style="margin-top: 12px; color: #909399; font-size: 12px;">
            提示：在右侧调整工序顺序（拖拽排序）
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
import { ElMessage } from 'element-plus';

const router = useRouter();
const products = ref([]);
const processes = ref([]);
const selectedProcesses = ref([]);
const form = ref({
  order_no: '',
  product_id: '',
  quantity: 1
});

const processOptions = computed(() => {
  return processes.value.map(p => ({
    id: p.id,
    name: `${p.code} - ${p.name}`,
    disabled: false
  }));
});

const loadOptions = async () => {
  const [pRes, proRes] = await Promise.all([api.get('/products'), api.get('/processes')]);
  products.value = pRes.data;
  processes.value = proRes.data;
};

const save = async () => {
  if (!form.value.order_no || !form.value.product_id || selectedProcesses.value.length === 0) {
    ElMessage.warning('请填写必填项并选择工序');
    return;
  }
  
  try {
    await api.post('/work-orders', {
      ...form.value,
      process_ids: selectedProcesses.value
    });
    ElMessage.success('工单创建成功');
    router.push('/work-orders');
  } catch (e) {
    console.error(e);
  }
};

onMounted(loadOptions);
</script>
