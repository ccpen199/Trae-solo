<template>
  <div class="logistics-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="tabs-wrapper">
            <el-tabs v-model="activeTab" @tab-change="handleTabChange">
              <el-tab-pane label="生产物流单" name="production" />
              <el-tab-pane label="发起物流单" name="initiator" />
              <el-tab-pane label="中转物流单" name="transfer" />
              <el-tab-pane label="接收物流单" name="receiver" />
            </el-tabs>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              新增物流单
            </el-button>
            <el-button type="success" @click="handleUpload">
              <el-icon><Upload /></el-icon>
              上传Excel
            </el-button>
            <el-button
              type="warning"
              :disabled="selectedIds.length === 0"
              @click="handleBatchDownload"
            >
              <el-icon><Download /></el-icon>
              批量下载
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="物流单号">
          <el-input
            v-model="searchForm.keyword"
            placeholder="物流单号/代单号/货物名称"
            clearable
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option
              v-for="(label, key) in logisticsStatusMap"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间段">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        :data="logisticsList"
        style="width: 100%"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="logisticsNo" label="物流单号" width="180">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">
              {{ row.logisticsNo }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="proxyNo" label="代单号" width="120" />
        <el-table-column prop="goodsName" label="货物名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="initiatorEnterpriseName" label="发起企业" min-width="120" show-overflow-tooltip />
        <el-table-column prop="receiverEnterpriseName" label="接收企业" min-width="120" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ logisticsStatusMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">详情</el-button>
            <el-button type="success" link @click="handleDownload(row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="detailVisible"
      title="物流单详情"
      width="800px"
      destroy-on-close
    >
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="物流单号">{{ currentOrder.logisticsNo }}</el-descriptions-item>
        <el-descriptions-item label="代单号">{{ currentOrder.proxyNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="货物名称">{{ currentOrder.goodsName }}</el-descriptions-item>
        <el-descriptions-item label="货物数量">{{ currentOrder.quantity || '-' }}</el-descriptions-item>
        <el-descriptions-item label="货物重量">{{ currentOrder.weight || '-' }} 吨</el-descriptions-item>
        <el-descriptions-item label="货物体积">{{ currentOrder.volume || '-' }} m³</el-descriptions-item>
        <el-descriptions-item label="生产企业编号">{{ currentOrder.productionEnterpriseCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="生产企业名称">{{ currentOrder.productionEnterpriseName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发起企业编号">{{ currentOrder.initiatorEnterpriseCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发起企业名称">{{ currentOrder.initiatorEnterpriseName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="中转企业编号">{{ currentOrder.transferEnterpriseCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="中转企业名称">{{ currentOrder.transferEnterpriseName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="接收企业编号">{{ currentOrder.receiverEnterpriseCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="接收企业名称">{{ currentOrder.receiverEnterpriseName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发货地址">{{ currentOrder.shipmentAddress }}</el-descriptions-item>
        <el-descriptions-item label="收货地址">{{ currentOrder.deliveryAddress }}</el-descriptions-item>
        <el-descriptions-item label="计划发货时间">
          {{ currentOrder.shipmentDate ? formatTime(currentOrder.shipmentDate) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="计划到达时间">
          {{ currentOrder.expectedDeliveryDate ? formatTime(currentOrder.expectedDeliveryDate) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="当前环节" :span="2">
          <el-tag type="info">{{ logisticsLinkMap[currentOrder.currentLink] || currentOrder.currentLink }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态" :span="2">
          <el-tag :type="getStatusType(currentOrder.status)">
            {{ logisticsStatusMap[currentOrder.status] }}
          </el-tag>
          <el-tag v-if="currentOrder.isUnmatched" type="danger" style="margin-left: 10px">异常数据</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ currentOrder.createdAt ? formatTime(currentOrder.createdAt) : '-' }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleDownload(currentOrder)">下载Excel</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { logisticsService, logisticsApi } from '@/api/logistics';
import { logisticsStatusMap, logisticsLinkMap, LogisticsStatus, EnterpriseType } from '@/types';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const loading = ref(false);
const logisticsList = ref<any[]>([]);
const total = ref(0);
const dateRange = ref<string[]>([]);
const selectedIds = ref<string[]>([]);
const detailVisible = ref(false);
const currentOrder = ref<any>(null);

const enterpriseType = computed(() => userStore.userInfo?.enterprise?.enterpriseType);

const getDefaultTabByEnterpriseType = (type?: EnterpriseType): string => {
  const map: Record<EnterpriseType, string> = {
    production: 'production',
    logistics: 'initiator',
    transfer: 'transfer',
    receiver: 'receiver',
  };
  return type ? map[type] : 'initiator';
};

const activeTab = ref(getDefaultTabByEnterpriseType(enterpriseType.value));

const searchForm = reactive({
  keyword: '',
  status: undefined as LogisticsStatus | undefined,
  startDate: '',
  endDate: '',
  page: 1,
  pageSize: 20,
});

const getStatusType = (status: LogisticsStatus) => {
  const map: Record<LogisticsStatus, string> = {
    created: 'info',
    transit: 'primary',
    transferring: 'warning',
    delivered: 'success',
    abnormal: 'danger',
  };
  return map[status] || 'info';
};

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN');
};

const loadData = async () => {
  loading.value = true;
  try {
    const result = await logisticsApi.getList(activeTab.value as any, {
      ...searchForm,
    });
    logisticsList.value = result.data?.orders || [];
    total.value = result.data?.total || 0;
  } catch (error) {
    console.error('Load data error:', error);
  } finally {
    loading.value = false;
  }
};

const handleTabChange = (tabName: string) => {
  searchForm.page = 1;
  loadData();
};

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map(item => item.id);
};

const handleSearch = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    searchForm.startDate = dateRange.value[0];
    searchForm.endDate = dateRange.value[1];
  } else {
    searchForm.startDate = '';
    searchForm.endDate = '';
  }
  searchForm.page = 1;
  loadData();
};

const handleReset = () => {
  searchForm.keyword = '';
  searchForm.status = undefined;
  searchForm.startDate = '';
  searchForm.endDate = '';
  searchForm.page = 1;
  dateRange.value = [];
  loadData();
};

const handleCreate = () => {
  router.push('/enterprise/logistics/create');
};

const handleUpload = () => {
  router.push('/enterprise/logistics/upload');
};

const handleViewDetail = (row: any) => {
  currentOrder.value = row;
  detailVisible.value = true;
};

const handleDownload = async (row: any) => {
  try {
    const blob = await logisticsApi.exportExcel([row.id]);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `物流单_${row.logisticsNo}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    ElMessage.success('下载成功');
  } catch (error) {
    console.error('Download error:', error);
    ElMessage.error('下载失败');
  }
};

const handleBatchDownload = async () => {
  try {
    const blob = await logisticsApi.exportExcel(selectedIds.value);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `物流单批量导出_${new Date().toLocaleDateString()}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    ElMessage.success('下载成功');
  } catch (error) {
    console.error('Download error:', error);
    ElMessage.error('下载失败');
  }
};

onMounted(() => {
  const tab = route.params.tab as string;
  if (tab && ['production', 'initiator', 'transfer', 'receiver'].includes(tab)) {
    activeTab.value = tab;
  }
  loadData();
});
</script>

<style scoped>
.logistics-page {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tabs-wrapper {
  margin: -15px 0;
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
}

.search-form {
  margin-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
