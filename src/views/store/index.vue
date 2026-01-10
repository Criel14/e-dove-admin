<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getMyStore } from "@/api/store";
import type { StoreInfo } from "@/api/store";

defineOptions({
  name: "Store"
});

// 加载状态
const loading = ref(false);
// 门店信息
const storeInfo = ref<StoreInfo | null>(null);
// 错误信息
const errorMessage = ref("");

// 状态映射
const statusMap: Record<number, string> = {
  1: "营业",
  2: "休息",
  3: "注销"
};

// 获取门店信息
const fetchStoreInfo = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const res = await getMyStore();
    if (res.status) {
      storeInfo.value = res.data;
    } else {
      errorMessage.value = res.message || "获取门店信息失败";
      storeInfo.value = null;
    }
  } catch (error: any) {
    // 尝试从错误响应中提取message
    errorMessage.value =
      error?.response?.data?.message || error?.message || "请求失败";
    storeInfo.value = null;
    console.error("获取门店信息失败:", error);
  } finally {
    loading.value = false;
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchStoreInfo();
});
</script>

<template>
  <div class="store-container">
    <h1 class="page-title">门店管理</h1>

    <!-- 错误提示 -->
    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      :closable="false"
      show-icon
      class="mb-4"
    />

    <!-- 加载状态 -->
    <el-skeleton v-if="loading" :rows="6" animated />

    <!-- 门店信息表格 -->
    <div v-else-if="storeInfo" class="store-info-card">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">门店信息</span>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="门店ID">
            {{ storeInfo.id }}
          </el-descriptions-item>
          <el-descriptions-item label="门店名称">
            {{ storeInfo.storeName }}
          </el-descriptions-item>

          <el-descriptions-item label="管理员手机号">
            {{ storeInfo.managerPhone }}
          </el-descriptions-item>
          <el-descriptions-item label="门店状态">
            <el-tag
              :type="
                storeInfo.status === 1
                  ? 'success'
                  : storeInfo.status === 2
                    ? 'warning'
                    : 'danger'
              "
            >
              {{ statusMap[storeInfo.status] || "未知" }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="省份">
            {{ storeInfo.addrProvince }}
          </el-descriptions-item>
          <el-descriptions-item label="城市">
            {{ storeInfo.addrCity }}
          </el-descriptions-item>

          <el-descriptions-item label="区县">
            {{ storeInfo.addrDistrict }}
          </el-descriptions-item>
          <el-descriptions-item label="详细地址">
            {{ storeInfo.addrDetail }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <!-- 无数据提示 -->
    <el-empty v-else-if="!loading" description="暂无门店信息" />
  </div>
</template>

<style scoped>
.store-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.store-info-card {
  max-width: 800px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
}
</style>
