<template>
  <div id="app" class="app-container">
    <router-view />
    <el-dialog
      v-model="carSelectorVisible"
      title="选择车型"
      width="100%"
      fullscreen
      :destroy-on-close="true"
      class="car-selector-dialog"
    >
      <CarSelector 
        v-model:selectedModel="selectedCarModel"
        @confirm="onCarSelected"
        @close="carSelectorVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import { useRouter } from 'vue-router'
import CarSelector from '@/components/CarSelector.vue'

const router = useRouter()
const carSelectorVisible = ref(false)
const selectedCarModel = ref(null)

const openCarSelector = () => {
  carSelectorVisible.value = true
}

const closeCarSelector = () => {
  carSelectorVisible.value = false
}

const onCarSelected = (model) => {
  selectedCarModel.value = model
  carSelectorVisible.value = false
}

provide('openCarSelector', openCarSelector)
provide('closeCarSelector', closeCarSelector)
provide('selectedCarModel', selectedCarModel)
</script>

<style>
.app-container {
  width: 100%;
  height: 100%;
  max-width: 750px;
  margin: 0 auto;
  background-color: #fff;
  position: relative;
}

.app-container .el-dialog {
  margin: 0 !important;
}

.car-selector-dialog :deep(.el-dialog) {
  height: 100vh;
  margin: 0 !important;
  border-radius: 0;
}

.car-selector-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid #eee;
  padding: 16px;
}

.car-selector-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: calc(100vh - 60px);
  overflow-y: auto;
}
</style>
