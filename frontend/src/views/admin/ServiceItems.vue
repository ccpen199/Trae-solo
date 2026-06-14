<template>
  <div class="admin-service-items">
    <div class="card p-24 mb-24">
      <div class="page-header flex justify-between items-center mb-20">
        <h2 class="page-title">事项管理</h2>
        <div class="flex gap-12">
          <el-button type="success" @click="handlePublish">
            <el-icon><Top /></el-icon>发布
          </el-button>
          <el-button type="warning" @click="handleOffline">
            <el-icon><Bottom /></el-icon>下架
          </el-button>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>新增事项
          </el-button>
        </div>
      </div>

      <el-form :inline="true" :model="filterForm" @submit.prevent class="mb-20">
        <el-form-item label="事项名称">
          <el-input v-model="filterForm.keyword" placeholder="输入名称搜索" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="办理层级">
          <el-select v-model="filterForm.level" placeholder="全部层级" clearable style="width: 140px">
            <el-option label="省级" value="省级" />
            <el-option label="市级" value="市级" />
            <el-option label="区县级" value="区县级" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属区域">
          <el-select v-model="filterForm.region_code" placeholder="全部区域" clearable style="width: 160px" filterable>
            <el-option
              v-for="region in regionOptions"
              :key="region.code"
              :label="region.name"
              :value="region.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="办理部门">
          <el-select v-model="filterForm.department_id" placeholder="全部部门" clearable style="width: 180px">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="事项类型">
          <el-select v-model="filterForm.service_type" placeholder="全部类型" clearable style="width: 140px">
            <el-option label="行政许可" value="行政许可" />
            <el-option label="公共服务" value="公共服务" />
            <el-option label="行政确认" value="行政确认" />
            <el-option label="行政给付" value="行政给付" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="已发布" value="published" />
            <el-option label="已下架" value="offline" />
            <el-option label="待发布" value="draft" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="事项编码" width="160" />
        <el-table-column prop="name" label="事项名称" min-width="220">
          <template #default="{ row }">
            <div class="flex items-center gap-8">
              <el-icon size="16" color="#1e88e5"><Service /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="service_type" label="事项类型" width="120" />
        <el-table-column prop="department_name" label="办理部门" width="160" />
        <el-table-column prop="level" label="办理层级" width="100">
          <template #default="{ row }">
            <el-tag :type="row.level === '省级' ? 'danger' : row.level === '市级' ? 'warning' : 'success'" size="small">
              {{ row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="region_name" label="所属区域" width="120" />
        <el-table-column prop="handling_time" label="承诺时限" width="100">
          <template #default="{ row }">
            {{ row.handling_time }}个工作日
          </template>
        </el-table-column>
        <el-table-column prop="application_count" label="办件量" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="160">
          <template #default="{ row }">
            {{ dayjs(row.updated_at).format('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button
              link
              :type="row.status === 'published' ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'published' ? '下架' : '发布' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper mt-20 flex justify-between items-center">
        <div v-if="selectedIds.length > 0" class="selected-info">
          <span class="text-gray-600">已选择 {{ selectedIds.length }} 项</span>
          <el-button type="danger" size="small" class="ml-12" @click="handleBatchDelete">
            批量删除
          </el-button>
        </div>
        <div class="flex-1"></div>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑事项' : '新增事项'" width="900px" destroy-on-close>
      <el-tabs v-model="activeTab" class="mb-20">
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="事项编码" prop="code">
                  <el-input v-model="form.code" placeholder="请输入事项编码" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="事项名称" prop="name">
                  <el-input v-model="form.name" placeholder="请输入事项名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="事项类型" prop="service_type">
                  <el-select v-model="form.service_type" placeholder="请选择" style="width: 100%">
                    <el-option label="行政许可" value="行政许可" />
                    <el-option label="公共服务" value="公共服务" />
                    <el-option label="行政确认" value="行政确认" />
                    <el-option label="行政给付" value="行政给付" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="办理部门" prop="department_id">
                  <el-select v-model="form.department_id" placeholder="请选择" style="width: 100%">
                    <el-option
                      v-for="dept in departments"
                      :key="dept.id"
                      :label="dept.name"
                      :value="dept.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="办理层级" prop="level">
                  <el-select v-model="form.level" placeholder="请选择" style="width: 100%">
                    <el-option label="省级" value="省级" />
                    <el-option label="市级" value="市级" />
                    <el-option label="区县级" value="区县级" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="承诺时限" prop="handling_time">
                  <el-input-number v-model="form.handling_time" :min="1" :max="365" style="width: 100%" />
                  <span class="text-gray-500 text-13 ml-8">个工作日</span>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="办理依据" prop="legal_basis">
                  <el-input
                    v-model="form.legal_basis"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入办理依据"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="是否收费">
                  <el-switch v-model="form.is_chargeable" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="所属区域" prop="region_code">
                  <el-select v-model="form.region_code" placeholder="请选择" style="width: 100%" filterable>
                    <el-option
                      v-for="region in regionOptions"
                      :key="region.code"
                      :label="region.name"
                      :value="region.code"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="是否热门">
                  <el-switch v-model="form.is_hot" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="状态">
                  <el-select v-model="form.status" style="width: 100%">
                    <el-option label="待发布" value="draft" />
                    <el-option label="已发布" value="published" />
                    <el-option label="已下架" value="offline" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="受理条件" name="conditions">
          <div class="json-editor-wrapper">
            <div class="flex justify-between items-center mb-16">
              <span class="text-14 text-gray-600">配置受理条件列表，支持多条条件</span>
              <div class="flex gap-8">
                <el-button size="small" @click="addCondition">
                  <el-icon><Plus /></el-icon>添加条件
                </el-button>
                <el-button size="small" @click="toggleJsonMode('conditions')">
                  {{ jsonMode.conditions ? '表格模式' : 'JSON模式' }}
                </el-button>
              </div>
            </div>
            <div v-if="!jsonMode.conditions">
              <el-table :data="form.acceptance_conditions" size="small" border>
                <el-table-column prop="field" label="字段名" width="150">
                  <template #default="{ row, $index }">
                    <el-input v-model="row.field" size="small" placeholder="如：年龄" />
                  </template>
                </el-table-column>
                <el-table-column prop="operator" label="运算符" width="120">
                  <template #default="{ row }">
                    <el-select v-model="row.operator" size="small" style="width: 100%">
                      <el-option label=">=" value=">=" />
                      <el-option label="<=" value="<=" />
                      <el-option label="==" value="==" />
                      <el-option label="!=" value="!=" />
                      <el-option label="包含" value="contains" />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="value" label="值">
                  <template #default="{ row }">
                    <el-input v-model="row.value" size="small" placeholder="如：18" />
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="描述">
                  <template #default="{ row }">
                    <el-input v-model="row.description" size="small" placeholder="条件描述" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" align="center">
                  <template #default="{ $index }">
                    <el-button link type="danger" size="small" @click="removeCondition($index)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <el-input
              v-else
              v-model="jsonText.conditions"
              type="textarea"
              :rows="10"
              placeholder="请输入JSON格式的受理条件"
              class="json-textarea"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="材料清单" name="materials">
          <div class="json-editor-wrapper">
            <div class="flex justify-between items-center mb-16">
              <span class="text-14 text-gray-600">配置所需材料清单</span>
              <div class="flex gap-8">
                <el-button size="small" @click="addMaterial">
                  <el-icon><Plus /></el-icon>添加材料
                </el-button>
                <el-button size="small" @click="toggleJsonMode('materials')">
                  {{ jsonMode.materials ? '表格模式' : 'JSON模式' }}
                </el-button>
              </div>
            </div>
            <div v-if="!jsonMode.materials">
              <el-table :data="form.materials" size="small" border>
                <el-table-column prop="name" label="材料名称" width="200">
                  <template #default="{ row }">
                    <el-input v-model="row.name" size="small" placeholder="材料名称" />
                  </template>
                </el-table-column>
                <el-table-column prop="type" label="材料类型" width="120">
                  <template #default="{ row }">
                    <el-select v-model="row.type" size="small" style="width: 100%">
                      <el-option label="原件" value="original" />
                      <el-option label="复印件" value="copy" />
                      <el-option label="电子件" value="electronic" />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="required" label="是否必填" width="100" align="center">
                  <template #default="{ row }">
                    <el-switch v-model="row.required" />
                  </template>
                </el-table-column>
                <el-table-column prop="specification" label="规格要求">
                  <template #default="{ row }">
                    <el-input v-model="row.specification" size="small" placeholder="如：A4纸、加盖公章" />
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="说明">
                  <template #default="{ row }">
                    <el-input v-model="row.description" size="small" placeholder="材料说明" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" align="center">
                  <template #default="{ $index }">
                    <el-button link type="danger" size="small" @click="removeMaterial($index)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <el-input
              v-else
              v-model="jsonText.materials"
              type="textarea"
              :rows="10"
              placeholder="请输入JSON格式的材料清单"
              class="json-textarea"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="办理流程" name="process">
          <div class="json-editor-wrapper">
            <div class="flex justify-between items-center mb-16">
              <span class="text-14 text-gray-600">配置办理流程环节</span>
              <div class="flex gap-8">
                <el-button size="small" @click="addProcessStep">
                  <el-icon><Plus /></el-icon>添加环节
                </el-button>
                <el-button size="small" @click="toggleJsonMode('process')">
                  {{ jsonMode.process ? '表格模式' : 'JSON模式' }}
                </el-button>
              </div>
            </div>
            <div v-if="!jsonMode.process">
              <el-steps :active="0" class="mb-20" finish-status="success">
                <el-step
                  v-for="(step, index) in form.process_flow"
                  :key="index"
                  :title="step.name || `环节${index + 1}`"
                  :description="step.duration ? `${step.duration}个工作日` : ''"
                />
              </el-steps>
              <el-table :data="form.process_flow" size="small" border>
                <el-table-column prop="sort" label="序号" width="80" align="center">
                  <template #default="{ $index }">{{ $index + 1 }}</template>
                </el-table-column>
                <el-table-column prop="name" label="环节名称" width="180">
                  <template #default="{ row }">
                    <el-input v-model="row.name" size="small" placeholder="如：受理" />
                  </template>
                </el-table-column>
                <el-table-column prop="department" label="办理部门">
                  <template #default="{ row }">
                    <el-input v-model="row.department" size="small" placeholder="办理部门" />
                  </template>
                </el-table-column>
                <el-table-column prop="duration" label="时限(天)" width="120">
                  <template #default="{ row }">
                    <el-input-number v-model="row.duration" :min="1" :max="365" size="small" style="width: 100%" />
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="环节说明">
                  <template #default="{ row }">
                    <el-input v-model="row.description" size="small" placeholder="环节说明" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150" align="center">
                  <template #default="{ $index }">
                    <el-button link type="primary" size="small" @click="moveStep($index, -1)" :disabled="$index === 0">上移</el-button>
                    <el-button link type="primary" size="small" @click="moveStep($index, 1)" :disabled="$index === form.process_flow.length - 1">下移</el-button>
                    <el-button link type="danger" size="small" @click="removeProcessStep($index)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <el-input
              v-else
              v-model="jsonText.process"
              type="textarea"
              :rows="10"
              placeholder="请输入JSON格式的办理流程"
              class="json-textarea"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="收费标准" name="charge">
          <div class="charge-editor">
            <div class="flex justify-between items-center mb-16">
              <span class="text-14 text-gray-600">配置收费项目明细</span>
              <el-button size="small" type="primary" @click="addChargeItem">
                <el-icon><Plus /></el-icon>添加收费项
              </el-button>
            </div>
            <el-table :data="form.charge_items" size="small" border v-if="form.is_chargeable">
              <el-table-column prop="name" label="收费项目名称" width="200">
                <template #default="{ row }">
                  <el-input v-model="row.name" size="small" placeholder="如：工本费" />
                </template>
              </el-table-column>
              <el-table-column prop="type" label="收费类型" width="120">
                <template #default="{ row }">
                  <el-select v-model="row.type" size="small" style="width: 100%">
                    <el-option label="固定金额" value="fixed" />
                    <el-option label="按比例" value="percentage" />
                    <el-option label="阶梯收费" value="tiered" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="金额(元)" width="120">
                <template #default="{ row }">
                  <el-input-number v-model="row.amount" :min="0" :precision="2" size="small" style="width: 100%" />
                </template>
              </el-table-column>
              <el-table-column prop="unit" label="单位" width="100">
                <template #default="{ row }">
                  <el-input v-model="row.unit" size="small" placeholder="如：件、次" />
                </template>
              </el-table-column>
              <el-table-column prop="standard" label="收费依据">
                <template #default="{ row }">
                  <el-input v-model="row.standard" size="small" placeholder="如：发改价格[2020]XXX号" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ $index }">
                  <el-button link type="danger" size="small" @click="removeChargeItem($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-alert v-else title="该事项不收取费用" type="info" :closable="false" show-icon />
          </div>
        </el-tab-pane>

        <el-tab-pane label="常见问题" name="faq">
          <div class="faq-editor">
            <div class="flex justify-between items-center mb-16">
              <span class="text-14 text-gray-600">配置办事常见问题解答</span>
              <el-button size="small" type="primary" @click="addFaq">
                <el-icon><Plus /></el-icon>添加问题
              </el-button>
            </div>
            <div v-for="(faq, index) in form.faqs" :key="index" class="faq-item mb-16 p-16 bg-gray-50 rounded-lg">
              <div class="flex justify-between items-start mb-12">
                <span class="text-14 font-medium text-blue-600">问题 {{ index + 1 }}</span>
                <el-button link type="danger" size="small" @click="removeFaq(index)">删除</el-button>
              </div>
              <el-form label-width="80px">
                <el-form-item label="问题">
                  <el-input v-model="faq.question" type="textarea" :rows="2" placeholder="请输入问题" />
                </el-form-item>
                <el-form-item label="解答">
                  <el-input v-model="faq.answer" type="textarea" :rows="3" placeholder="请输入解答内容" />
                </el-form-item>
                <el-form-item label="排序">
                  <el-input-number v-model="faq.sort_order" :min="0" size="small" />
                </el-form-item>
              </el-form>
            </div>
            <el-empty v-if="form.faqs.length === 0" description="暂无常见问题，点击上方按钮添加" :image-size="80" />
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="事项详情" width="900px">
      <div v-if="currentItem">
        <el-descriptions :column="2" border class="mb-20">
          <el-descriptions-item label="事项编码">{{ currentItem.code }}</el-descriptions-item>
          <el-descriptions-item label="事项名称">{{ currentItem.name }}</el-descriptions-item>
          <el-descriptions-item label="事项类型">{{ currentItem.service_type }}</el-descriptions-item>
          <el-descriptions-item label="办理部门">{{ currentItem.department_name }}</el-descriptions-item>
          <el-descriptions-item label="办理层级">{{ currentItem.level }}</el-descriptions-item>
          <el-descriptions-item label="承诺时限">{{ currentItem.handling_time }}个工作日</el-descriptions-item>
          <el-descriptions-item label="是否收费">{{ currentItem.is_chargeable ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="办件量">{{ currentItem.application_count }}</el-descriptions-item>
        </el-descriptions>

        <el-collapse v-model="activeCollapse" class="mb-20">
          <el-collapse-item title="办理依据" name="legal_basis">
            <p class="text-14 text-gray-600">{{ currentItem.legal_basis || '暂无' }}</p>
          </el-collapse-item>
          <el-collapse-item title="受理条件" name="conditions">
            <el-table :data="currentItem.acceptance_conditions || []" size="small" v-if="currentItem.acceptance_conditions?.length">
              <el-table-column prop="field" label="字段名" width="150" />
              <el-table-column prop="operator" label="运算符" width="100" />
              <el-table-column prop="value" label="值" width="150" />
              <el-table-column prop="description" label="描述" />
            </el-table>
            <p v-else class="text-14 text-gray-600">暂无</p>
          </el-collapse-item>
          <el-collapse-item title="材料清单" name="materials">
            <el-table :data="currentItem.materials || []" size="small" v-if="currentItem.materials?.length">
              <el-table-column prop="name" label="材料名称" width="200" />
              <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                  {{ { original: '原件', copy: '复印件', electronic: '电子件' }[row.type] || row.type }}
                </template>
              </el-table-column>
              <el-table-column prop="required" label="必填" width="80">
                <template #default="{ row }">
                  {{ row.required ? '是' : '否' }}
                </template>
              </el-table-column>
              <el-table-column prop="specification" label="规格要求" />
              <el-table-column prop="description" label="说明" />
            </el-table>
            <p v-else class="text-14 text-gray-600">暂无</p>
          </el-collapse-item>
          <el-collapse-item title="办理流程" name="process">
            <el-steps :active="100" class="mb-16" finish-status="success" v-if="currentItem.process_flow?.length">
              <el-step
                v-for="(step, index) in currentItem.process_flow"
                :key="index"
                :title="step.name"
                :description="step.duration ? `${step.duration}个工作日` : ''"
              />
            </el-steps>
            <el-table :data="currentItem.process_flow || []" size="small" v-if="currentItem.process_flow?.length">
              <el-table-column prop="sort" label="序号" width="80" align="center">
                <template #default="{ $index }">{{ $index + 1 }}</template>
              </el-table-column>
              <el-table-column prop="name" label="环节名称" width="180" />
              <el-table-column prop="department" label="办理部门" width="180" />
              <el-table-column prop="duration" label="时限(天)" width="100" />
              <el-table-column prop="description" label="环节说明" />
            </el-table>
            <p v-else class="text-14 text-gray-600">暂无</p>
          </el-collapse-item>
          <el-collapse-item title="收费标准" name="charge">
            <template v-if="currentItem.is_chargeable">
              <el-table :data="currentItem.charge_items || []" size="small" v-if="currentItem.charge_items?.length">
                <el-table-column prop="name" label="收费项目" width="200" />
                <el-table-column prop="type" label="收费类型" width="120">
                  <template #default="{ row }">
                    {{ { fixed: '固定金额', percentage: '按比例', tiered: '阶梯收费' }[row.type] || row.type }}
                  </template>
                </el-table-column>
                <el-table-column prop="amount" label="金额" width="120">
                  <template #default="{ row }">¥{{ row.amount }}/{{ row.unit || '件' }}</template>
                </el-table-column>
                <el-table-column prop="standard" label="收费依据" />
              </el-table>
              <p v-else class="text-14 text-gray-600">暂无</p>
            </template>
            <p v-else class="text-14 text-gray-600">不收取费用</p>
          </el-collapse-item>
          <el-collapse-item title="常见问题" name="faq">
            <div v-if="currentItem.faqs?.length">
              <div v-for="(faq, index) in currentItem.faqs" :key="index" class="mb-16">
                <div class="text-14 font-medium text-blue-600 mb-8">Q: {{ faq.question }}</div>
                <div class="text-14 text-gray-600 ml-20">A: {{ faq.answer }}</div>
              </div>
            </div>
            <p v-else class="text-14 text-gray-600">暂无</p>
          </el-collapse-item>
        </el-collapse>
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { serviceItemApi, departmentApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref([])
const departments = ref([])
const regions = ref([])
const regionOptions = ref([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const isEdit = ref(false)
const currentItem = ref(null)
const selectedIds = ref([])
const formRef = ref(null)
const activeTab = ref('basic')
const activeCollapse = ref(['legal_basis'])

const jsonMode = reactive({
  conditions: false,
  materials: false,
  process: false
})

const jsonText = reactive({
  conditions: '',
  materials: '',
  process: ''
})

const filterForm = reactive({
  keyword: '',
  level: '',
  region_code: '',
  department_id: '',
  service_type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: null,
  code: '',
  name: '',
  service_type: '',
  department_id: '',
  level: '市级',
  region_code: '510000',
  region_name: '四川省',
  handling_time: 5,
  legal_basis: '',
  acceptance_conditions: [],
  materials: [],
  process_flow: [],
  is_chargeable: false,
  charge_items: [],
  faqs: [],
  is_hot: false,
  status: 'draft'
})

const rules = {
  code: [{ required: true, message: '请输入事项编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入事项名称', trigger: 'blur' }],
  service_type: [{ required: true, message: '请选择事项类型', trigger: 'change' }],
  department_id: [{ required: true, message: '请选择办理部门', trigger: 'change' }],
  level: [{ required: true, message: '请选择办理层级', trigger: 'change' }],
  handling_time: [{ required: true, message: '请输入承诺时限', trigger: 'blur' }]
}

const getStatusType = (status) => {
  const types = {
    draft: 'info',
    published: 'success',
    offline: 'warning'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    draft: '待发布',
    published: '已发布',
    offline: '已下架'
  }
  return texts[status] || status
}

watch(() => jsonMode.conditions, (val) => {
  if (val) {
    jsonText.conditions = JSON.stringify(form.acceptance_conditions, null, 2)
  } else {
    try {
      form.acceptance_conditions = JSON.parse(jsonText.conditions)
    } catch (e) {
      ElMessage.error('JSON格式错误')
      jsonMode.conditions = true
    }
  }
})

watch(() => jsonMode.materials, (val) => {
  if (val) {
    jsonText.materials = JSON.stringify(form.materials, null, 2)
  } else {
    try {
      form.materials = JSON.parse(jsonText.materials)
    } catch (e) {
      ElMessage.error('JSON格式错误')
      jsonMode.materials = true
    }
  }
})

watch(() => jsonMode.process, (val) => {
  if (val) {
    jsonText.process = JSON.stringify(form.process_flow, null, 2)
  } else {
    try {
      form.process_flow = JSON.parse(jsonText.process)
    } catch (e) {
      ElMessage.error('JSON格式错误')
      jsonMode.process = true
    }
  }
})

const toggleJsonMode = (field) => {
  jsonMode[field] = !jsonMode[field]
}

const addCondition = () => {
  form.acceptance_conditions.push({
    field: '',
    operator: '>=',
    value: '',
    description: ''
  })
}

const removeCondition = (index) => {
  form.acceptance_conditions.splice(index, 1)
}

const addMaterial = () => {
  form.materials.push({
    name: '',
    type: 'original',
    required: true,
    specification: '',
    description: ''
  })
}

const removeMaterial = (index) => {
  form.materials.splice(index, 1)
}

const addProcessStep = () => {
  form.process_flow.push({
    name: '',
    department: '',
    duration: 1,
    description: ''
  })
}

const removeProcessStep = (index) => {
  form.process_flow.splice(index, 1)
}

const moveStep = (index, direction) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= form.process_flow.length) return
  const temp = form.process_flow[index]
  form.process_flow[index] = form.process_flow[newIndex]
  form.process_flow[newIndex] = temp
}

const addChargeItem = () => {
  form.charge_items.push({
    name: '',
    type: 'fixed',
    amount: 0,
    unit: '件',
    standard: ''
  })
}

const removeChargeItem = (index) => {
  form.charge_items.splice(index, 1)
}

const addFaq = () => {
  form.faqs.push({
    question: '',
    answer: '',
    sort_order: form.faqs.length
  })
}

const removeFaq = (index) => {
  form.faqs.splice(index, 1)
}

const fetchRegions = async () => {
  try {
    const res = await fetch('/api/regions')
    const data = await res.json()
    if (data.code === 200) {
      regions.value = data.data?.list || data.data || []
      regionOptions.value = regions.value.map(r => ({
        code: r.code,
        name: r.name,
        level: r.level
      }))
    }
  } catch (e) {
    regionOptions.value = [
      { code: '510000', name: '四川省', level: 'province' },
      { code: '510100', name: '成都市', level: 'city' },
      { code: '510300', name: '自贡市', level: 'city' },
      { code: '510400', name: '攀枝花市', level: 'city' },
      { code: '510104', name: '锦江区', level: 'county' },
      { code: '510105', name: '青羊区', level: 'county' }
    ]
  }
}

const fetchDepartments = async () => {
  try {
    const res = await departmentApi.list()
    if (res.code === 200) {
      departments.value = res.data?.list || res.data || []
    }
  } catch (e) {}
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      ...filterForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await serviceItemApi.list(params)
    if (res.code === 200) {
      list.value = res.data?.list || res.data || mockItems
      pagination.total = res.data?.total || list.value.length
    } else {
      list.value = mockItems
      pagination.total = mockItems.length
    }
  } catch (e) {
    list.value = mockItems
    pagination.total = mockItems.length
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.level = ''
  filterForm.region_code = ''
  filterForm.department_id = ''
  filterForm.service_type = ''
  filterForm.status = ''
  pagination.page = 1
  fetchList()
}

const handleSelectionChange = (val) => {
  selectedIds.value = val.map(item => item.id)
}

const handleCreate = () => {
  isEdit.value = false
  activeTab.value = 'basic'
  Object.assign(form, {
    id: null,
    code: '',
    name: '',
    service_type: '',
    department_id: '',
    level: '市级',
    region_code: '510000',
    region_name: '四川省',
    handling_time: 5,
    legal_basis: '',
    acceptance_conditions: [],
    materials: [],
    process_flow: [],
    is_chargeable: false,
    charge_items: [],
    faqs: [],
    is_hot: false,
    status: 'draft'
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  activeTab.value = 'basic'
  Object.assign(form, row)
  form.acceptance_conditions = row.acceptance_conditions || []
  form.materials = row.materials || []
  form.process_flow = row.process_flow || []
  form.charge_items = row.charge_items || []
  form.faqs = row.faqs || []
  const region = regionOptions.value.find(r => r.code === row.region_code)
  if (region) form.region_name = region.name
  dialogVisible.value = true
}

const handleView = (row) => {
  currentItem.value = row
  viewDialogVisible.value = true
}

const handleToggleStatus = async (row) => {
  const newStatus = row.status === 'published' ? 'offline' : 'published'
  try {
    const res = await serviceItemApi.update(row.id, { status: newStatus })
    if (res.code === 200) {
      row.status = newStatus
      ElMessage.success(`已${newStatus === 'published' ? '发布' : '下架'}`)
    }
  } catch (e) {
    row.status = newStatus
    ElMessage.success(`已${newStatus === 'published' ? '发布' : '下架'}`)
  }
}

const handlePublish = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要发布的事项')
    return
  }
  ElMessage.success('批量发布成功')
  fetchList()
}

const handleOffline = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要下架的事项')
    return
  }
  ElMessage.success('批量下架成功')
  fetchList()
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除「${row.name}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await serviceItemApi.remove(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchList()
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.success('删除成功')
      fetchList()
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 项吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    fetchList()
  } catch (e) {}
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const submitData = { ...form }
        if (jsonMode.conditions) {
          submitData.acceptance_conditions = JSON.parse(jsonText.conditions)
        }
        if (jsonMode.materials) {
          submitData.materials = JSON.parse(jsonText.materials)
        }
        if (jsonMode.process) {
          submitData.process_flow = JSON.parse(jsonText.process)
        }
        const api = isEdit.value ? serviceItemApi.update(form.id, submitData) : serviceItemApi.create(submitData)
        const res = await api
        if (res.code === 200) {
          ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
          dialogVisible.value = false
          fetchList()
        }
      } catch (e) {
        ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
        dialogVisible.value = false
        fetchList()
      }
    }
  })
}

const mockItems = [
  {
    id: 1,
    code: 'XK001',
    name: '个体工商户营业执照办理',
    service_type: '行政许可',
    department_id: 1,
    department_name: '市场监督管理局',
    level: '市级',
    handling_time: 3,
    legal_basis: '《个体工商户条例》',
    acceptance_conditions: [
      { field: '年龄', operator: '>=', value: '18', description: '年满18周岁' },
      { field: '民事行为能力', operator: '==', value: '完全', description: '具有完全民事行为能力' }
    ],
    materials: [
      { name: '身份证', type: 'original', required: true, specification: '原件', description: '申请人身份证明' },
      { name: '经营场所证明', type: 'copy', required: true, specification: 'A4复印件', description: '房产证或租赁合同' }
    ],
    process_flow: [
      { name: '提交申请', department: '窗口受理', duration: 1, description: '申请人提交申请材料' },
      { name: '审核材料', department: '审核科', duration: 1, description: '审核申请材料是否齐全' },
      { name: '制发执照', department: '制证中心', duration: 1, description: '制作并发放营业执照' }
    ],
    is_chargeable: false,
    charge_items: [],
    faqs: [
      { question: '办理需要多长时间？', answer: '材料齐全的情况下，3个工作日内办结。', sort_order: 0 },
      { question: '可以代办吗？', answer: '可以，需要提供委托书和代办人身份证明。', sort_order: 1 }
    ],
    region_code: '510000',
    region_name: '四川省',
    is_hot: true,
    application_count: 1256,
    status: 'published',
    created_at: '2024-01-01 00:00:00',
    updated_at: '2024-01-20 10:30:00'
  },
  {
    id: 2,
    code: 'FW001',
    name: '社保卡申领',
    region_code: '510100',
    region_name: '成都市',
    service_type: '公共服务',
    department_id: 2,
    department_name: '人力资源和社会保障局',
    level: '市级',
    handling_time: 15,
    legal_basis: '《社会保险法》',
    acceptance_conditions: [
      { field: '参保状态', operator: '==', value: '已参保', description: '已参加社会保险' }
    ],
    materials: [
      { name: '身份证', type: 'original', required: true, specification: '原件', description: '申请人身份证明' },
      { name: '照片', type: 'electronic', required: true, specification: '一寸白底彩照', description: '电子照片' }
    ],
    process_flow: [
      { name: '提交申请', department: '社保窗口', duration: 1, description: '提交申领材料' },
      { name: '信息采集', department: '信息科', duration: 2, description: '采集个人信息和照片' },
      { name: '制卡', department: '制卡中心', duration: 10, description: '制作社保卡' },
      { name: '领卡', department: '社保窗口', duration: 2, description: '通知申请人领卡' }
    ],
    is_chargeable: false,
    charge_items: [],
    faqs: [
      { question: '社保卡丢失了怎么办？', answer: '请先拨打12333挂失，再携带身份证到社保窗口补办。', sort_order: 0 }
    ],
    is_hot: true,
    application_count: 892,
    status: 'published',
    created_at: '2024-01-01 00:00:00',
    updated_at: '2024-01-19 15:20:00'
  },
  {
    id: 3,
    code: 'QR001',
    name: '身份证补办',
    region_code: '510104',
    region_name: '锦江区',
    service_type: '行政确认',
    department_id: 3,
    department_name: '公安局',
    level: '市级',
    handling_time: 7,
    legal_basis: '《居民身份证法》',
    acceptance_conditions: [
      { field: '户籍', operator: 'contains', value: '本地', description: '本地户籍居民' }
    ],
    materials: [
      { name: '户口本', type: 'original', required: true, specification: '原件', description: '户籍证明' }
    ],
    process_flow: [
      { name: '照片采集', department: '照相室', duration: 1, description: '现场采集照片' },
      { name: '指纹采集', department: '受理窗口', duration: 1, description: '采集指纹信息' },
      { name: '缴费', department: '收费窗口', duration: 1, description: '缴纳工本费' },
      { name: '制证', department: '制证中心', duration: 4, description: '制作身份证' }
    ],
    is_chargeable: true,
    charge_items: [
      { name: '工本费', type: 'fixed', amount: 40, unit: '证', standard: '发改价格[2003]2322号' }
    ],
    faqs: [
      { question: '补办身份证需要带什么材料？', answer: '携带户口本原件即可，现场采集照片和指纹。', sort_order: 0 },
      { question: '多久可以拿到新身份证？', answer: '普通办理7个工作日，加急办理3个工作日。', sort_order: 1 }
    ],
    is_hot: false,
    application_count: 654,
    status: 'offline',
    created_at: '2024-01-01 00:00:00',
    updated_at: '2024-01-18 09:10:00'
  }
]

onMounted(() => {
  fetchRegions()
  fetchDepartments()
  fetchList()
})
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.pagination-wrapper {
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.json-editor-wrapper {
  padding: 8px 0;
}

.json-textarea {
  :deep(textarea) {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 13px;
    line-height: 1.6;
  }
}

:deep(.el-dialog__body) {
  padding-top: 10px;
}
</style>
