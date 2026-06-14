<template>
  <div>
    <div class="page-header">
      <h2>🔍 六维穿透式企业查询</h2>
      <p style="color: #909399;">工商/司法/招投标/资质/人员/信用全方位数据查询</p>
    </div>

    <el-card class="card-shadow" style="margin-bottom: 20px;">
      <el-row :gutter="16" align="middle">
        <el-col :xs="24" :md="6">
          <el-input
            v-model="keyword"
            placeholder="输入企业名称或统一社会信用代码"
            size="large"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :xs="12" :md="4">
          <el-select v-model="statusFilter" placeholder="经营状态" size="large" clearable style="width: 100%;">
            <el-option label="正常" value="正常" />
            <el-option label="经营异常" value="经营异常" />
          </el-select>
        </el-col>
        <el-col :xs="12" :md="4">
          <el-select v-model="riskFilter" placeholder="风险等级" size="large" clearable style="width: 100%;">
            <el-option label="高风险" value="高风险" />
            <el-option label="中风险" value="中风险" />
            <el-option label="低风险" value="低风险" />
          </el-select>
        </el-col>
        <el-col :xs="12" :md="3">
          <el-input-number
            v-model="scoreMin"
            :min="0"
            :max="100"
            controls-position="right"
            placeholder="最低分"
            size="large"
            style="width: 100%;"
          />
        </el-col>
        <el-col :xs="12" :md="3">
          <el-input-number
            v-model="scoreMax"
            :min="0"
            :max="100"
            controls-position="right"
            placeholder="最高分"
            size="large"
            style="width: 100%;"
          />
        </el-col>
        <el-col :xs="24" :md="4">
          <div style="display: flex; gap: 8px;">
            <el-button type="primary" size="large" @click="handleSearch">查询</el-button>
            <el-button size="large" @click="resetFilters">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="card-shadow">
      <template #header>
        <span style="font-weight: bold;">查询结果 ({{ total }} 条)</span>
      </template>
      <el-alert
        v-if="fallbackNotice"
        :title="fallbackNotice"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 16px;"
      />
      <el-table :data="list" v-loading="loading" stripe style="width: 100%;">
        <el-table-column prop="name" label="企业名称" min-width="250">
          <template #default="scope">
            <el-link type="primary" @click="$router.push(`/enterprise/${scope.row.id}`)">
              {{ scope.row.name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="unified_social_credit" label="统一社会信用代码" width="200" />
        <el-table-column prop="legal_representative" label="法定代表人" width="120" />
        <el-table-column prop="registered_capital" label="注册资本" width="140" />
        <el-table-column prop="status" label="经营状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '正常' ? 'success' : 'danger'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="综合评分" width="150">
          <template #default="scope">
            <el-progress
              :percentage="scope.row.total_score"
              :color="getScoreColor(scope.row.total_score)"
              :show-text="true"
            />
          </template>
        </el-table-column>
        <el-table-column prop="risk_level" label="风险等级" width="100">
          <template #default="scope">
            <span :class="`risk-${scope.row.risk_level === '高风险' ? 'high' : scope.row.risk_level === '中风险' ? 'medium' : 'low'}`">
              {{ scope.row.risk_level }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="$router.push(`/enterprise/${scope.row.id}`)">
              查看详情
            </el-button>
            <el-button size="small" @click="generateReport(scope.row)">
              尽调报告
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div style="margin-top: 20px; text-align: center;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="search"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { enterpriseApi, reportsApi } from '@/utils/api';
import { ElMessage } from 'element-plus';
import { Refresh, Search } from '@element-plus/icons-vue';

const keyword = ref('');
const statusFilter = ref('');
const riskFilter = ref('');
const scoreMin = ref(null);
const scoreMax = ref(null);
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const fallbackNotice = ref('');

const getScoreColor = (score) => {
  if (!score) return '#909399';
  if (score >= 80) return '#67c23a';
  if (score >= 60) return '#e6a23c';
  return '#f56c6c';
};

const search = async () => {
  loading.value = true;
  try {
    let minScore = scoreMin.value === null ? '' : scoreMin.value;
    let maxScore = scoreMax.value === null ? '' : scoreMax.value;
    if (minScore !== '' && maxScore !== '' && minScore > maxScore) {
      [minScore, maxScore] = [maxScore, minScore];
    }
    const data = await enterpriseApi.list({
      keyword: keyword.value,
      status: statusFilter.value,
      riskLevel: riskFilter.value,
      scoreMin: minScore,
      scoreMax: maxScore,
      page: page.value,
      pageSize: pageSize.value
    });
    list.value = data.list;
    total.value = data.total;
    fallbackNotice.value = data.fallback
      ? `未找到“${data.keyword}”的精确匹配，已展示高风险优先的推荐企业。`
      : '';
  } catch (err) {
    console.error('Search failed:', err);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.value = 1;
  search();
};

const handlePageSizeChange = () => {
  page.value = 1;
  search();
};

const resetFilters = () => {
  keyword.value = '';
  statusFilter.value = '';
  riskFilter.value = '';
  scoreMin.value = null;
  scoreMax.value = null;
  page.value = 1;
  search();
};

const generateReport = async (enterprise) => {
  try {
    const result = await reportsApi.generate({
      enterpriseId: enterprise.id,
      reportType: 'standard'
    });
    if (result.success) {
      ElMessage.success('尽调报告生成成功，正在下载...');
      setTimeout(() => {
        reportsApi.download(result.reportId);
      }, 500);
    }
  } catch (err) {
    console.error('Generate report failed:', err);
  }
};

onMounted(search);
</script>
