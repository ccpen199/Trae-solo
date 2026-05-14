<template>
  <div class="publish-page page-container">
    <div class="header">
      <h1>发布内容</h1>
    </div>

    <div class="content">
      <div class="publish-tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.key" 
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </div>
      </div>

      <div v-if="activeTab === 'post'" class="publish-form">
        <el-form :model="postForm">
          <el-form-item label="标题">
            <el-input v-model="postForm.title" placeholder="请输入标题" />
          </el-form-item>
          <el-form-item label="内容">
            <el-input v-model="postForm.content" type="textarea" :rows="6" placeholder="分享你的生活..." />
          </el-form-item>
          <el-form-item label="图片">
            <div class="image-upload">
              <div 
                v-for="(img, index) in postForm.images" 
                :key="index" 
                class="uploaded-image"
              >
                <img :src="img" alt="" />
                <button class="remove-image" @click="removeImage(index)">×</button>
              </div>
              <div 
                v-if="postForm.images.length < 5" 
                class="upload-btn"
                @click="uploadImage"
              >
                <Plus class="plus-icon" />
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="activeTab === 'case'" class="publish-form">
        <el-form :model="caseForm">
          <el-form-item label="标题">
            <el-input v-model="caseForm.title" placeholder="请输入案例标题" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="caseForm.description" type="textarea" :rows="4" placeholder="案例描述..." />
          </el-form-item>
          <el-form-item label="面积(㎡)">
            <el-input v-model="caseForm.area" type="number" placeholder="请输入面积" />
          </el-form-item>
          <el-form-item label="风格">
            <el-select v-model="caseForm.style" placeholder="请选择风格">
              <el-option label="现代简约" value="现代简约" />
              <el-option label="北欧" value="北欧" />
              <el-option label="极简" value="极简" />
              <el-option label="中式" value="中式" />
              <el-option label="轻奢" value="轻奢" />
            </el-select>
          </el-form-item>
          <el-form-item label="预算(元)">
            <el-input v-model="caseForm.budget" type="number" placeholder="请输入预算" />
          </el-form-item>
          <el-form-item label="图片">
            <div class="image-upload">
              <div 
                v-for="(img, index) in caseForm.images" 
                :key="index" 
                class="uploaded-image"
              >
                <img :src="img" alt="" />
                <button class="remove-image" @click="removeCaseImage(index)">×</button>
              </div>
              <div 
                v-if="caseForm.images.length < 5" 
                class="upload-btn"
                @click="uploadCaseImage"
              >
                <Plus class="plus-icon" />
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <button class="submit-btn" @click="handleSubmit">发布</button>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from 'lucide-vue-next'
import BottomNav from '@/components/BottomNav.vue'
import { postAPI, caseAPI } from '@/api'
import { ElMessage } from 'element-plus'

const tabs = [
  { key: 'post', label: '好生活' },
  { key: 'case', label: '定制案例' }
]

const activeTab = ref('post')

const postForm = reactive({
  title: '',
  content: '',
  images: []
})

const caseForm = reactive({
  title: '',
  description: '',
  area: '',
  style: '',
  budget: '',
  images: []
})

function uploadImage() {
  postForm.images.push('/default-image.png')
}

function removeImage(index) {
  postForm.images.splice(index, 1)
}

function uploadCaseImage() {
  caseForm.images.push('/default-image.png')
}

function removeCaseImage(index) {
  caseForm.images.splice(index, 1)
}

async function handleSubmit() {
  if (activeTab.value === 'post') {
    if (!postForm.title) {
      ElMessage.error('请输入标题')
      return
    }
    try {
      await postAPI.create({
        title: postForm.title,
        content: postForm.content,
        images: postForm.images
      })
      ElMessage.success('发布成功')
      postForm.title = ''
      postForm.content = ''
      postForm.images = []
    } catch {
      ElMessage.error('发布失败')
    }
  } else {
    if (!caseForm.title) {
      ElMessage.error('请输入标题')
      return
    }
    try {
      await caseAPI.create({
        title: caseForm.title,
        description: caseForm.description,
        area: caseForm.area,
        style: caseForm.style,
        budget: caseForm.budget,
        images: caseForm.images
      })
      ElMessage.success('发布成功')
      caseForm.title = ''
      caseForm.description = ''
      caseForm.area = ''
      caseForm.style = ''
      caseForm.budget = ''
      caseForm.images = []
    } catch {
      ElMessage.error('发布失败')
    }
  }
}
</script>

<style scoped>
.header {
  background: white;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.content {
  padding: 12px;
}

.publish-tabs {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 12px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  font-size: 15px;
  color: #666;
}

.tab-item.active {
  background: #2563eb;
  color: white;
}

.publish-form {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.uploaded-image {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
}

.uploaded-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 16px;
}

.upload-btn {
  width: 80px;
  height: 80px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plus-icon {
  width: 24px;
  height: 24px;
  color: #ddd;
}

.submit-btn {
  width: 100%;
  height: 48px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
}
</style>