<template>
  <div class="logistics-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>物流单管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出Excel
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="物流单号">
          <el-input
            v-model="searchForm.logisticsNo"
            placeholder="请输入物流单号"
            clearable
          />
        </el-form-item>
        <el-form-item label="生产企业编号">
          <el-input
            v-model="searchForm.productionEnterpriseCode"
            placeholder="请输入生产企业编号"
            clearable
          />
        </el-form-item>
        <el-form-item label="发起企业编号">
          <el-input
            v-model="searchForm.initiatorEnterpriseCode"
            placeholder="请输入发起企业编号"
            clearable
          />
        </el-form-item>
        <el-form-item label="接收企业编号">
          <el-input
            v-model="searchForm.receiverEnterpriseCode"
            placeholder="请输入接收企业编号"
            clearable
          />
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
        <el-form-item label="异常数据">
          <el-select v-model="searchForm.isUnmatched" placeholder="全部" clearable>
            <el-option label="全部" :value="undefined" />
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="orderList" style="width: 100%" v-loading="loading" stripe>
        <el-table-column type="selection" width="50" />
        <el-table-column prop="logisticsNo" label="物流单号" width="150" fixed="left" />
        <el-table-column prop="proxyNo" label="代单号" width="120" />
        <el-table-column prop="goodsName" label="货物名称" min-width="120" />
        <el-table-column label="生产企业" min-width="150">
          <template #default="{ row }">
            <div v-if="row.productionEnterpriseName">{{ row.productionEnterpriseName }}</div>
            <div v-else>{{ row.productionEnterpriseCode || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="发起企业" min-width="150">
          <template #default="{ row }">
            <div v-if="row.initiatorEnterpriseName">{{ row.initiatorEnterpriseName }}</div>
            <div v-else>{{ row.initiatorEnterpriseCode || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="接收企业" min-width="150">
          <template #default="{ row }">
            <div v-if="row.receiverEnterpriseName">{{ row.receiverEnterpriseName }}</div>
            <div v-else>{{ row.receiverEnterpriseCode || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ logisticsStatusMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="异常" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isUnmatched" type="danger" size="small">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">查看</el-button>
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

    <el-dialog v-model="detailVisible" title="物流单详情" width="800px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="物流单号">{{ currentOrder.logisticsNo }}</el-descriptions-item>
        <el-descriptions-item label="代单号">{{ currentOrder.proxyNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="货物名称">{{ currentOrder.goodsName }}</el-descriptions-item>
        <el-descriptions-item label="数量/数量">{{ currentOrder.quantity || '-' }} {{ currentOrder.unit || '' }}</el-descriptions-item>
        <el-descriptions-item label="生产企业编号">{{ currentOrder.productionEnterpriseName || currentOrder.productionEnterpriseCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发起企业编号">{{ currentOrder.initiatorEnterpriseName || currentOrder.initiatorEnterpriseCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="中转企业编号">{{ currentOrder.transferEnterpriseName || currentOrder.transferEnterpriseCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="接收企业编号">{{ currentOrder.receiverEnterpriseName || currentOrder.receiverEnterpriseCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发货日期">{{ currentOrder.shipmentDate ? formatDate(currentOrder.shipmentDate) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="预计送达日期">{{ currentOrder.expectedDeliveryDate ? formatDate(currentOrder.expectedDeliveryDate) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentOrder.status)" size="small">
            {{ logisticsStatusMap[currentOrder.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="当前环节">{{ logisticsLinkMap[currentOrder.currentLink] }}</el-descriptions-item>
        <el-descriptions-item label="发货地址" :span="2">{{ currentOrder.shipmentAddress || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2">{{ currentOrder.deliveryAddress || '-' }}</el-descriptions-item>
        <el-descriptions-item label="异常数据">
          <el-tag v-if="currentOrder.isUnmatched" type="danger" size="small">是</el-tag>
          <span v-else>否</span>
        </el-descriptions-item>
        <el-descriptions-item label="异常原因">{{ currentOrder.unmatchedReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ formatTime(currentOrder.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '@/api/admin';
import { logisticsStatusMap, logisticsLinkMap, LogisticsStatus } from '@/types';

const loading = ref(false);
const orderList = ref<any[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const currentOrder = ref<any>(null);
const dateRange = ref<string[]>([]);
const selectedIds = ref<string[]>([]);

const searchForm = reactive({
  logisticsNo: '',
  productionEnterpriseCode: '',
  initiatorEnterpriseCode: '',
  receiverEnterpriseCode: '',
  startDate: '',
  endDate: '',
  isUnmatched: undefined as boolean | undefined,
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

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN');
};

const loadData = async () => {
  loading.value = true;
  try {
    const result = await adminApi.getLogistics({
      ...searchForm,
    });
    orderList.value = result.data?.orders || [];
    total.value = result.data?.total || 0;
  } catch (error) {
    console.error('Load data error:', error);
  } finally {
    loading.value = false;
  }
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
  searchForm.logisticsNo = '';
  searchForm.productionEnterpriseCode = '';
  searchForm.initiatorEnterpriseCode = '';
  searchForm.receiverEnterpriseCode = '';
  searchForm.startDate = '';
  searchForm.endDate = '';
  searchForm.isUnmatched = undefined;
  searchForm.page = 1;
  dateRange.value = [];
  loadData();
};

const handleView = (row: any) => {
  currentOrder.value = row;
  detailVisible.value = true;
};

const handleExport = async () => {
  try {
    const ids: string[] = [];
    const blob = await adminApi.exportLogistics(ids.length > 0 ? ids : undefined);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `物流单_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success('导出成功');
  } catch (error) {
    console.error('Export error:', error);
  }
};

onMounted(() => {
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

.search-form {
  margin-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
