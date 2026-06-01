<template>
  <div class="search-page">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item class="keyword-item">
          <el-input
            v-model="searchForm.keyword"
            placeholder="输入关键词进行全文搜索..."
            size="large"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="searchForm.tags" multiple filterable allow-create placeholder="选择标签">
            <el-option v-for="tag in allTags" :key="tag.id" :label="tag.name" :value="tag.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-input v-model="searchForm.source" placeholder="来源URL或标题" clearable />
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" />
        </el-form-item>
        <el-form-item label="关联条目">
          <el-select v-model="searchForm.related_to" filterable placeholder="选择关联条目" clearable>
            <el-option v-for="entry in entryList" :key="entry.id" :label="entry.title || '无标题'" :value="entry.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" @click="handleSearch">搜索</el-button>
          <el-button size="large" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="result-card" v-loading="loading">
      <div class="result-header">
        <h3>搜索结果 <span v-if="total > 0">({{ total }} 条)</span></h3>
      </div>
      <div v-if="results.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无搜索结果" />
      </div>
      <div v-else class="result-list">
        <div v-for="item in results" :key="item.id" class="result-item" @click="viewDetail(item.id)">
          <div class="result-title">
            <el-icon><Document /></el-icon>
            <span v-html="highlightText(item.title)"></span>
            <el-tag v-if="item.is_private" type="warning" size="small" class="ml-2">私密</el-tag>
            <el-tag :type="getTypeTagType(item.entry_type)" size="small" class="ml-2">{{ getTypeName(item.entry_type) }}</el-tag>
          </div>

          <div class="result-fields">
            <el-tag v-if="isTitleMatch(item)" type="primary" size="small" effect="plain">
              <el-icon><Search /></el-icon> 标题命中
            </el-tag>
            <el-tag v-if="isContentMatch(item)" type="success" size="small" effect="plain">
              <el-icon><Document /></el-icon> 内容命中
            </el-tag>
            <el-tag v-if="isTagMatch(item)" type="warning" size="small" effect="plain">
              <el-icon><PriceTag /></el-icon> 标签命中
            </el-tag>
            <el-tag v-if="isSourceMatch(item)" type="info" size="small" effect="plain">
              <el-icon><Link /></el-icon> 来源命中
            </el-tag>
            <el-tag v-if="hasRelatedMatch(item)" type="success" size="small" effect="plain">
              <el-icon><Connection /></el-icon> 关联命中
            </el-tag>
          </div>

          <div class="result-tags">
            <el-tag v-for="tag in item.tags" :key="tag.id" :color="tag.color" size="small" class="mr-1" :class="{ 'tag-match': isKeywordInTag(tag.name) }">
              {{ tag.name }}
            </el-tag>
          </div>

          <div v-if="item.highlight && (item.highlight.title || item.highlight.content || item.highlight.source)" class="result-highlight">
            <div class="highlight-header">
              <el-icon color="#e6a23c"><Warning /></el-icon>
              <span class="highlight-title">命中片段详情</span>
              <el-tag size="small" type="warning">{{ getMatchFields(item).join('、') }}</el-tag>
            </div>
            <div class="highlight-sections">
              <div v-if="item.highlight.title" class="highlight-section">
                <div class="highlight-field">标题：</div>
                <div class="highlight-text" v-html="highlightText(item.highlight.title)"></div>
              </div>
              <div v-if="item.highlight.content" class="highlight-section">
                <div class="highlight-field">内容：</div>
                <div class="highlight-text" v-html="highlightText(item.highlight.content)"></div>
              </div>
              <div v-if="item.highlight.source" class="highlight-section">
                <div class="highlight-field">来源：</div>
                <div class="highlight-text" v-html="highlightText(item.highlight.source)"></div>
              </div>
            </div>
          </div>
          <div v-else-if="item.highlight && typeof item.highlight === 'string'" class="result-highlight">
            <div class="highlight-header">
              <el-icon color="#e6a23c"><Warning /></el-icon>
              <span class="highlight-title">命中片段</span>
            </div>
            <div class="highlight-sections">
              <div class="highlight-section">
                <div class="highlight-field">内容：</div>
                <div class="highlight-text" v-html="highlightText(item.highlight)"></div>
              </div>
            </div>
          </div>
          <div v-else class="result-content">
            {{ truncate(item.content, 150) }}
          </div>

          <div v-if="item.source_url || item.source_title" class="result-source">
            <el-icon><Link /></el-icon>
            <span class="source-label">来源：</span>
            <div class="source-content">
              <div class="source-title">{{ item.source_title || '无标题来源' }}</div>
              <a v-if="item.source_url" :href="item.source_url" target="_blank" class="source-link" @click.stop>
                {{ item.source_url }}
              </a>
            </div>
          </div>

          <div v-if="item.related_entries && item.related_entries.length > 0" class="result-related">
            <div class="related-header">
              <el-icon color="#22c55e"><Connection /></el-icon>
              <span class="related-title">关联节点路径</span>
              <el-tag size="small" type="success">{{ item.relation_count || 0 }} 条关联</el-tag>
            </div>
            <div class="related-path">
              <span class="path-node current">当前条目</span>
              <span class="path-arrow">↔</span>
              <template v-for="(rel, idx) in item.related_entries.slice(0, 4)" :key="rel.id">
                <span class="path-node" :class="{ 'match': isKeywordInText(rel.title) }">
                  {{ rel.title || '无标题' }}
                </span>
                <span v-if="idx < Math.min(item.related_entries.length, 4) - 1" class="path-arrow">↔</span>
              </template>
              <span v-if="item.related_entries.length > 4" class="path-more">
                +{{ item.related_entries.length - 4 }} 个节点
              </span>
            </div>
            <div v-if="hasRelatedMatch(item)" class="related-match-tip">
              <el-icon color="#22c55e"><Check /></el-icon>
              <span>关联节点包含关键词：{{ getRelatedMatchText(item) }}</span>
            </div>
          </div>

          <div class="result-meta">
            <span>版本: v{{ item.version }}</span>
            <span>修改: {{ formatDate(item.last_modified_at) }}</span>
            <span v-if="item.relation_count > 0">关联: {{ item.relation_count }}</span>
          </div>
        </div>
      </div>
      <el-pagination
        class="pagination"
        :current-page="page"
        :page-size="limit"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Document, Warning, Link, Connection, PriceTag, Check } from '@element-plus/icons-vue'
import { searchEntries, listTags, listEntries } from '@/api'

const router = useRouter()
const loading = ref(false)
const results = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const allTags = ref([])
const entryList = ref([])

const searchForm = ref({
  keyword: '',
  tags: [],
  source: '',
  dateRange: [],
  related_to: null
})

function getTypeName(type) {
  const map = { note: '笔记', web_clipping: '网页剪藏', handwritten: '手写摘录', file: '文件' }
  return map[type] || type
}

function getTypeTagType(type) {
  const map = { note: '', web_clipping: 'primary', handwritten: 'success', file: 'info' }
  return map[type] || ''
}

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

function truncate(str, len) {
  if (!str) return ''
  return str.length > len ? str.substring(0, len) + '...' : str
}

function highlightText(text) {
  if (!text || !searchForm.value.keyword) return text || ''
  const keyword = searchForm.value.keyword
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

function isTitleMatch(item) {
  if (!searchForm.value.keyword) return false
  return item.title && item.title.toLowerCase().includes(searchForm.value.keyword.toLowerCase())
}

function isContentMatch(item) {
  if (!searchForm.value.keyword) return false
  const hl = item.highlight
  if (hl && typeof hl === 'object' && (hl.content || hl.title || hl.source)) return true
  return item.content && item.content.toLowerCase().includes(searchForm.value.keyword.toLowerCase())
}

function isTagMatch(item) {
  if (!searchForm.value.keyword) return false
  const keyword = searchForm.value.keyword.toLowerCase()
  return item.tags && item.tags.some(t => t.name.toLowerCase().includes(keyword))
}

function isSourceMatch(item) {
  if (!searchForm.value.keyword) return false
  const keyword = searchForm.value.keyword.toLowerCase()
  return (item.source_title && item.source_title.toLowerCase().includes(keyword)) ||
         (item.source_url && item.source_url.toLowerCase().includes(keyword))
}

function hasRelatedMatch(item) {
  if (!searchForm.value.keyword || !item.related_entries) return false
  const keyword = searchForm.value.keyword.toLowerCase()
  return item.related_entries.some(rel => rel.title && rel.title.toLowerCase().includes(keyword))
}

function isKeywordInTag(tagName) {
  if (!searchForm.value.keyword || !tagName) return false
  return tagName.toLowerCase().includes(searchForm.value.keyword.toLowerCase())
}

function isKeywordInText(text) {
  if (!searchForm.value.keyword || !text) return false
  return text.toLowerCase().includes(searchForm.value.keyword.toLowerCase())
}

function getMatchFields(item) {
  const fields = []
  if (isTitleMatch(item)) fields.push('标题')
  if (isContentMatch(item)) fields.push('内容')
  if (isTagMatch(item)) fields.push('标签')
  if (isSourceMatch(item)) fields.push('来源')
  if (hasRelatedMatch(item)) fields.push('关联节点')
  return fields.length > 0 ? fields : ['内容']
}

function getRelatedMatchText(item) {
  if (!item.related_entries) return ''
  const keyword = searchForm.value.keyword.toLowerCase()
  const matches = item.related_entries
    .filter(rel => rel.title && rel.title.toLowerCase().includes(keyword))
    .map(rel => rel.title)
  return matches.slice(0, 2).join('、') + (matches.length > 2 ? ' 等' : '')
}

async function handleSearch() {
  loading.value = true
  try {
    const params = { skip: (page.value - 1) * limit.value, limit: limit.value }
    if (searchForm.value.keyword) params.keyword = searchForm.value.keyword
    if (searchForm.value.tags && searchForm.value.tags.length > 0) params.tags = searchForm.value.tags
    if (searchForm.value.source) params.source = searchForm.value.source
    if (searchForm.value.dateRange && searchForm.value.dateRange.length === 2) {
      params.start_date = searchForm.value.dateRange[0].toISOString()
      params.end_date = searchForm.value.dateRange[1].toISOString()
    }
    if (searchForm.value.related_to) params.related_to = searchForm.value.related_to

    const result = await searchEntries(params)
    results.value = result.results
    total.value = result.total
  } catch (e) {
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  searchForm.value = {
    keyword: '',
    tags: [],
    source: '',
    dateRange: [],
    related_to: null
  }
  page.value = 1
  handleSearch()
}

function handlePageChange(p) {
  page.value = p
  handleSearch()
}

function viewDetail(id) {
  router.push(`/entries/${id}`)
}

async function loadTags() {
  try {
    allTags.value = await listTags()
  } catch (e) {
    console.error('Load tags failed:', e)
  }
}

async function loadEntries() {
  try {
    const result = await listEntries({ limit: 100 })
    entryList.value = result.results
  } catch (e) {
    console.error('Load entries failed:', e)
  }
}

onMounted(() => {
  loadTags()
  loadEntries()
  handleSearch()
})
</script>

<style scoped>
.search-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
}
.keyword-item {
  flex: 1;
  min-width: 300px;
}
.keyword-item .el-input {
  width: 100%;
}
.result-header {
  margin-bottom: 15px;
}
.result-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.result-item {
  padding: 15px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.result-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-color: #409eff;
}
.result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}
.result-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.result-fields .el-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}
.result-tags {
  margin-bottom: 10px;
}
.tag-match {
  border: 2px solid #f59e0b !important;
  font-weight: 500;
}
.result-highlight {
  padding: 15px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 8px;
  margin-bottom: 12px;
  border-left: 4px solid #f59e0b;
}
.highlight-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.highlight-title {
  font-weight: 600;
  color: #92400e;
  flex: 1;
}
.highlight-sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.highlight-section {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
}
.highlight-field {
  font-weight: 600;
  color: #92400e;
  min-width: 60px;
}
.highlight-text {
  flex: 1;
  color: #1f2937;
  line-height: 1.6;
}
.result-content {
  color: #666;
  margin-bottom: 10px;
  line-height: 1.6;
}
.result-source {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
  padding: 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}
.source-label {
  color: #1e40af;
  font-weight: 500;
}
.source-content {
  flex: 1;
}
.source-title {
  font-weight: 500;
  color: #1e3a8a;
  margin-bottom: 3px;
}
.source-link {
  color: #2563eb;
  text-decoration: none;
  font-size: 12px;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}
.source-link:hover {
  text-decoration: underline;
}
.result-related {
  padding: 12px;
  background: linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%);
  border-radius: 8px;
  border-left: 4px solid #22c55e;
  margin-bottom: 10px;
}
.related-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.related-title {
  font-weight: 600;
  color: #166534;
  flex: 1;
}
.related-path {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}
.path-node {
  padding: 3px 10px;
  background: white;
  border-radius: 12px;
  font-size: 12px;
  color: #166534;
  border: 1px solid #86efac;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.path-node.current {
  background: #166534;
  color: white;
  border-color: #166534;
  font-weight: 500;
}
.path-node.match {
  background: #fef08a;
  border-color: #facc15;
  color: #854d0e;
  font-weight: 500;
}
.path-arrow {
  color: #22c55e;
  font-weight: bold;
  padding: 0 2px;
}
.path-more {
  color: #166534;
  font-size: 12px;
  margin-left: 4px;
}
.related-match-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  font-size: 12px;
  color: #166534;
}
.result-meta {
  display: flex;
  gap: 20px;
  color: #999;
  font-size: 12px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
}
.pagination {
  margin-top: 20px;
  justify-content: center;
}
.empty-state {
  padding: 40px;
}
.mr-1 {
  margin-right: 4px;
}
.ml-2 {
  margin-left: 8px;
}
:deep(.search-highlight) {
  background: #fef08a;
  padding: 1px 4px;
  border-radius: 3px;
  color: #dc2626;
  font-weight: 500;
}
</style>
