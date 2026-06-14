<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2>📄 定制化尽调报告</h2>
        <p style="color: #909399;">生成包含 PDF 和可视化图表的定制化尽职调查报告</p>
      </div>
      <el-button type="primary" @click="generateDialogVisible = true">
        <el-icon><Plus /></el-icon>
        生成报告
      </el-button>
    </div>

    <el-card class="card-shadow">
      <template #header>
        <span style="font-weight: bold;">报告列表</span>
      </template>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="report_name" label="报告名称" min-width="250">
          <template #default="scope">
            <el-link type="primary" @click="viewReport(scope.row)">
              {{ scope.row.report_name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="enterprise_name" label="企业名称" min-width="200" />
        <el-table-column prop="report_type" label="报告类型" width="120">
          <template #default="scope">
            <el-tag>{{ scope.row.report_type === 'detailed' ? '详细版' : '标准版' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.status === '已完成' ? 'success' : 'warning'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="生成时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewReport(scope.row)">查看</el-button>
            <el-button size="small" @click="downloadReport(scope.row)" :disabled="scope.row.status !== '已完成'">
              下载 PDF
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 20px; text-align: center;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <el-dialog v-model="generateDialogVisible" title="生成尽调报告" width="500px">
      <el-form :model="generateForm" label-width="100px">
        <el-form-item label="企业" required>
          <el-select v-model="generateForm.enterpriseId" filterable style="width: 100%;" placeholder="请选择企业">
            <el-option
              v-for="e in enterpriseList"
              :key="e.id"
              :label="e.name"
              :value="e.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="报告名称">
          <el-input v-model="generateForm.reportName" placeholder="请输入报告名称" />
        </el-form-item>
        <el-form-item label="报告类型" required>
          <el-radio-group v-model="generateForm.reportType">
            <el-radio value="standard">标准版</el-radio>
            <el-radio value="detailed">详细版</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="generateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="generateReport" :loading="generating">
          生成报告
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="报告详情" width="900px">
      <div v-if="reportDetail">
        <el-alert
          :title="`${reportDetail.enterprise.name} - 综合健康度 ${reportDetail.enterprise.total_score} 分`"
          :type="reportDetail.enterprise.risk_level === '高风险' ? 'error' : reportDetail.enterprise.risk_level === '中风险' ? 'warning' : 'success'"
          show-icon
          style="margin-bottom: 20px;"
        />
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card style="margin-bottom: 20px;">
              <template #header>
                <span style="font-weight: bold;">六维评分</span>
              </template>
              <div style="height: 250px;">
                <Radar :data="radarData" :options="radarOptions" />
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card style="margin-bottom: 20px;">
              <template #header>
                <span style="font-weight: bold;">风险分布</span>
              </template>
              <div style="height: 250px;">
                <Doughnut :data="riskDistributionData" :options="chartOptions" />
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card style="margin-bottom: 20px;">
          <template #header>
            <span style="font-weight: bold;">企业基本信息</span>
          </template>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div><span style="color: #909399;">统一社会信用代码：</span>{{ reportDetail.enterprise.unified_social_credit }}</div>
            <div><span style="color: #909399;">法定代表人：</span>{{ reportDetail.enterprise.legal_representative }}</div>
            <div><span style="color: #909399;">注册资本：</span>{{ reportDetail.enterprise.registered_capital }}</div>
            <div><span style="color: #909399;">成立日期：</span>{{ reportDetail.enterprise.establishment_date }}</div>
            <div><span style="color: #909399;">经营状态：</span>{{ reportDetail.enterprise.status }}</div>
            <div><span style="color: #909399;">风险等级：</span>
              <span :class="`risk-${reportDetail.enterprise.risk_level === '高风险' ? 'high' : reportDetail.enterprise.risk_level === '中风险' ? 'medium' : 'low'}`">
                {{ reportDetail.enterprise.risk_level }}
              </span>
            </div>
          </div>
        </el-card>

        <el-tabs v-model="viewActiveTab">
          <el-tab-pane label="司法记录" name="judicial">
            <div v-if="reportDetail.judicial?.length > 0">
              <div v-for="item in reportDetail.judicial" :key="item.id" style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
                <div style="font-weight: bold;">[{{ item.case_type }}] {{ item.case_reason }}</div>
                <div style="color: #606266; font-size: 12px;">{{ item.court }} | {{ item.filing_date }}</div>
                <div v-if="item.amount" style="color: #f56c6c;">涉及金额：¥{{ item.amount.toLocaleString() }}</div>
              </div>
            </div>
            <div v-else style="text-align: center; color: #909399; padding: 20px;">暂无司法记录</div>
          </el-tab-pane>
          <el-tab-pane label="招投标记录" name="bidding">
            <el-table :data="reportDetail.bidding" v-if="reportDetail.bidding?.length > 0" size="small">
              <el-table-column prop="project_name" label="项目名称" />
              <el-table-column label="中标金额" width="150">
                <template #default="scope">¥{{ scope.row.bidding_amount.toLocaleString() }}</template>
              </el-table-column>
              <el-table-column prop="winning_status" label="状态" width="100">
                <template #default="scope">
                  <el-tag size="small" :type="scope.row.winning_status === '中标' ? 'success' : 'info'">
                    {{ scope.row.winning_status }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <div v-else style="text-align: center; color: #909399; padding: 20px;">暂无招投标记录</div>
          </el-tab-pane>
          <el-tab-pane label="信用记录" name="credit">
            <div v-if="reportDetail.credit?.length > 0">
              <div v-for="item in reportDetail.credit" :key="item.id" style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
                <div style="font-weight: bold;">[{{ item.credit_type }}] {{ item.credit_level }}</div>
                <div style="color: #606266;">{{ item.description }}</div>
                <div style="color: #909399; font-size: 12px;">{{ item.effective_date }} 至 {{ item.display_deadline }}</div>
              </div>
            </div>
            <div v-else style="text-align: center; color: #909399; padding: 20px;">暂无信用记录</div>
          </el-tab-pane>
          <el-tab-pane label="风险预警" name="alerts">
            <el-alert
              v-if="reportDetail.abnormal?.length > 0"
              :title="`存在 ${reportDetail.abnormal.length} 条经营异常记录`"
              type="warning"
              show-icon
              style="margin-bottom: 10px;"
            />
            <el-alert
              v-if="reportDetail.rigging?.length > 0"
              :title="`存在 ${reportDetail.rigging.length} 条围标串标嫌疑记录`"
              type="error"
              show-icon
              style="margin-bottom: 10px;"
            />
            <el-alert
              v-if="reportDetail.blacklist?.length > 0"
              :title="`企业在黑名单中`"
              type="error"
              show-icon
            />
            <div v-if="!reportDetail.abnormal?.length && !reportDetail.rigging?.length && !reportDetail.blacklist?.length"
                 style="text-align: center; color: #67c23a; padding: 20px;">
              <el-icon :size="48"><CircleCheck /></el-icon>
              <p style="margin-top: 8px;">暂无风险预警</p>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Radar } from 'vue-chartjs';
import { reportsApi, enterpriseApi } from '@/utils/api';
import { ElMessage } from 'element-plus';
import { Plus, CircleCheck } from '@element-plus/icons-vue';

ChartJS.register(ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler);

const loading = ref(false);
const generating = ref(false);
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const enterpriseList = ref([]);
const generateDialogVisible = ref(false);
const viewDialogVisible = ref(false);
const viewActiveTab = ref('judicial');
const reportDetail = ref(null);

const generateForm = reactive({
  enterpriseId: null,
  reportName: '',
  reportType: 'standard'
});

const radarData = computed(() => {
  if (!reportDetail.value) return { labels: [], datasets: [] };
  return {
    labels: ['工商信息', '司法风险', '招投标', '资质情况', '人员配置', '信用状况'],
    datasets: [{
      label: '评分',
      data: [
        reportDetail.value.scores.business,
        reportDetail.value.scores.judicial,
        reportDetail.value.scores.bidding,
        reportDetail.value.scores.qualification,
        reportDetail.value.scores.personnel,
        reportDetail.value.scores.credit
      ],
      backgroundColor: 'rgba(30, 58, 138, 0.2)',
      borderColor: '#1e3a8a',
      borderWidth: 2,
      pointBackgroundColor: '#1e3a8a'
    }]
  };
});

const riskDistributionData = computed(() => ({
  labels: ['工商', '司法', '招投标', '资质', '人员', '信用'],
  datasets: [{
    data: reportDetail.value ? [
      reportDetail.value.scores.business,
      reportDetail.value.scores.judicial,
      reportDetail.value.scores.bidding,
      reportDetail.value.scores.qualification,
      reportDetail.value.scores.personnel,
      reportDetail.value.scores.credit
    ] : [],
    backgroundColor: ['#1e3a8a', '#f56c6c', '#409eff', '#67c23a', '#e6a23c', '#909399']
  }]
}));

const radarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      beginAtZero: true,
      max: 25
    }
  }
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } }
};

const loadList = async () => {
  loading.value = true;
  try {
    const data = await reportsApi.list({ page: page.value, pageSize: pageSize.value });
    list.value = data.list;
    total.value = data.total;
  } catch (err) {
    console.error('Load reports failed:', err);
  } finally {
    loading.value = false;
  }
};

const loadEnterprises = async () => {
  try {
    const data = await enterpriseApi.list({ pageSize: 100 });
    enterpriseList.value = data.list;
  } catch (err) {
    console.error('Load enterprises failed:', err);
  }
};

const generateReport = async () => {
  if (!generateForm.enterpriseId) {
    ElMessage.warning('请选择企业');
    return;
  }
  
  generating.value = true;
  try {
    const result = await reportsApi.generate({
      enterpriseId: generateForm.enterpriseId,
      reportType: generateForm.reportType,
      reportName: generateForm.reportName
    });
    
    if (result.success) {
      ElMessage.success('报告生成成功！');
      generateDialogVisible.value = false;
      loadList();
      
      setTimeout(() => {
        reportsApi.download(result.reportId);
      }, 500);
    }
  } catch (err) {
    console.error('Generate report failed:', err);
  } finally {
    generating.value = false;
  }
};

const viewReport = async (row) => {
  try {
    reportDetail.value = await reportsApi.getJson(row.id);
    viewDialogVisible.value = true;
  } catch (err) {
    console.error('View report failed:', err);
  }
};

const downloadReport = (row) => {
  reportsApi.download(row.id);
};

onMounted(() => {
  loadList();
  loadEnterprises();
});
</script>
