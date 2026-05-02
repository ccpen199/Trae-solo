<template>
  <div>
    <h2 style="margin-bottom: 20px;">监测管理</h2>
    
    <el-card>
      <template #header>
        <div class="table-header">
          <span>监测点列表</span>
          <el-button type="primary" size="small" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            新增监测点
          </el-button>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="监测类型">
          <el-select v-model="searchForm.type" placeholder="全部类型" clearable style="width: 150px;">
            <el-option label="空气" value="air" />
            <el-option label="水质" value="water" />
            <el-option label="噪声" value="noise" />
            <el-option label="土壤" value="soil" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 150px;">
            <el-option label="正常" value="normal" />
            <el-option label="异常" value="abnormal" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="monitorPoints" v-loading="loading" stripe>
        <el-table-column prop="code" label="监测点编号" width="180" />
        <el-table-column prop="name" label="监测点名称" />
        <el-table-column prop="type" label="监测类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getMonitorTypeTag(row.type)" size="small">
              {{ getMonitorTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enterpriseName" label="所属企业" />
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="editPoint(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <el-dialog v-model="showAddDialog" title="新增监测点" width="600px">
      <el-form :model="pointForm" :rules="pointRules" ref="pointFormRef" label-width="100px">
        <el-form-item label="监测点编号" prop="code">
          <el-input v-model="pointForm.code" placeholder="请输入监测点编号" />
        </el-form-item>
        <el-form-item label="监测点名称" prop="name">
          <el-input v-model="pointForm.name" placeholder="请输入监测点名称" />
        </el-form-item>
        <el-form-item label="监测类型" prop="type">
          <el-select v-model="pointForm.type" placeholder="请选择监测类型" style="width: 100%;">
            <el-option label="空气" value="air" />
            <el-option label="水质" value="water" />
            <el-option label="噪声" value="noise" />
            <el-option label="土壤" value="soil" />
          </el-select>
        </el-form-item>
        <el-form-item label="企业" prop="enterpriseId">
          <el-select v-model="pointForm.enterpriseId" placeholder="请选择所属企业" style="width: 100%;">
            <el-option 
              v-for="item in enterprises" 
              :key="item.id" 
              :label="item.name" 
              :value="item.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="pointForm.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="纬度" prop="latitude">
          <el-input v-model="pointForm.latitude" placeholder="请输入纬度" />
        </el-form-item>
        <el-form-item label="经度" prop="longitude">
          <el-input v-model="pointForm.longitude" placeholder="请输入经度" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSavePoint">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showDetailDialog" title="监测点详情" width="700px">
      <el-descriptions :column="2" border v-if="currentPoint">
        <el-descriptions-item label="监测点编号">{{ currentPoint.code }}</el-descriptions-item>
        <el-descriptions-item label="监测点名称">{{ currentPoint.name }}</el-descriptions-item>
        <el-descriptions-item label="监测类型">{{ getMonitorTypeName(currentPoint.type) }}</el-descriptions-item>
        <el-descriptions-item label="所属企业">{{ currentPoint.enterpriseName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ currentPoint.address }}</el-descriptions-item>
        <el-descriptions-item label="经度">{{ currentPoint.longitude }}</el-descriptions-item>
        <el-descriptions-item label="纬度">{{ currentPoint.latitude }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider content-position="left">监测数据</el-divider>
      <el-table :data="monitorDataList" size="small" v-loading="dataLoading">
        <el-table-column prop="dataTime" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.dataTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="rawData" label="监测数据">
          <template #default="{ row }">
            <template v-if="row.rawData">
              <span v-for="(value, key) in row.rawData" :key="key" style="margin-right: 15px;">
                {{ key }}: <strong>{{ value }}</strong>
              </span>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="isAnomaly" label="是否异常" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isAnomaly ? 'danger' : 'success'" size="small">
              {{ row.isAnomaly ? '异常' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getMonitorPoints, getMonitorData, createMonitorPoint, updateMonitorPoint } from '@/api/monitor';
import { getEnterprises } from '@/api/enterprise';
import dayjs from 'dayjs';

const loading = ref(false);
const dataLoading = ref(false);
const showAddDialog = ref(false);
const showDetailDialog = ref(false);
const pointFormRef = ref(null);
const currentPoint = ref(null);

const searchForm = reactive({
  type: '',
  status: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const monitorPoints = ref([]);
const enterprises = ref([]);
const monitorDataList = ref([]);

const pointForm = reactive({
  code: '',
  name: '',
  type: '',
  enterpriseId: '',
  address: '',
  latitude: '',
  longitude: '',
});

const pointRules = {
  code: [{ required: true, message: '请输入监测点编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入监测点名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择监测类型', trigger: 'change' }],
};

const getMonitorTypeTag = (type) => {
  const tags = { air: 'primary', water: 'success', noise: 'warning', soil: 'danger' };
  return tags[type] || 'info';
};

const getMonitorTypeName = (type) => {
  const names = { air: '空气', water: '水质', noise: '噪声', soil: '土壤' };
  return names[type] || type;
};

const formatTime = (time) => {
  if (!time) return '-';
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};

const loadMonitorPoints = async () => {
  loading.value = true;
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
    const res = await getMonitorPoints(params);
    monitorPoints.value = res.data || [];
    pagination.total = res.total || monitorPoints.value.length;
  } catch (error) {
    console.error('加载监测点失败:', error);
  } finally {
    loading.value = false;
  }
};

const loadEnterprises = async () => {
  try {
    const res = await getEnterprises({ pageSize: 100 });
    enterprises.value = res.data || [];
  } catch (error) {
    console.error('加载企业列表失败:', error);
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadMonitorPoints();
};

const handleReset = () => {
  searchForm.type = '';
  searchForm.status = '';
  pagination.page = 1;
  loadMonitorPoints();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  loadMonitorPoints();
};

const handleCurrentChange = (page) => {
  pagination.page = page;
  loadMonitorPoints();
};

const viewDetail = async (row) => {
  currentPoint.value = row;
  showDetailDialog.value = true;
  
  dataLoading.value = true;
  try {
    const res = await getMonitorData({ monitorPointId: row.id, limit: 20 });
    monitorDataList.value = res.data || [];
  } catch (error) {
    console.error('加载监测数据失败:', error);
  } finally {
    dataLoading.value = false;
  }
};

const editPoint = (row) => {
  Object.assign(pointForm, {
    code: row.code,
    name: row.name,
    type: row.type,
    enterpriseId: row.enterpriseId,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
  });
  showAddDialog.value = true;
};

const handleSavePoint = async () => {
  if (!pointFormRef.value) return;
  
  await pointFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (currentPoint.value) {
          await updateMonitorPoint(currentPoint.value.id, pointForm);
          ElMessage.success('更新成功');
        } else {
          await createMonitorPoint(pointForm);
          ElMessage.success('创建成功');
        }
        showAddDialog.value = false;
        loadMonitorPoints();
      } catch (error) {
        console.error('保存失败:', error);
      }
    }
  });
};

onMounted(() => {
  loadMonitorPoints();
  loadEnterprises();
});
</script>
