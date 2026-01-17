<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getUserInfo, type UserInfoResponse } from "@/api/user";
import { message } from "@/utils/message";
import userAvatar from "@/assets/user.jpg";

defineOptions({
  name: "Welcome"
});

// 用户信息
const userInfo = ref<UserInfoResponse["data"] | null>(null);
const loading = ref(false);
const errorMessage = ref("");

// 获取用户信息
const fetchUserInfo = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const res = await getUserInfo();
    if (res.status) {
      userInfo.value = res.data;
    } else {
      errorMessage.value = res.message || "获取用户信息失败";
      message(errorMessage.value, { type: "error" });
    }
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.message || error?.message || "请求失败";
    message(errorMessage.value, { type: "error" });
    console.error("获取用户信息失败:", error);
  } finally {
    loading.value = false;
  }
};

// 页面加载时获取用户信息
onMounted(() => {
  fetchUserInfo();
});
</script>

<template>
  <div class="welcome-container">
    <el-card class="welcome-card">
      <div class="welcome-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton animated :rows="3" />
        </div>

        <!-- 错误状态 -->
        <div v-else-if="errorMessage" class="error-container">
          <div class="error-icon">⚠️</div>
          <p class="error-message">{{ errorMessage }}</p>
          <el-button type="primary" size="small" @click="fetchUserInfo">
            重试
          </el-button>
        </div>

        <!-- 用户信息 -->
        <div v-else-if="userInfo" class="user-info">
          <el-avatar
            :src="userInfo.avatarUrl || userAvatar"
            :size="80"
            class="user-avatar"
          />
          <h1 class="welcome-title">欢迎回来，{{ userInfo.username }}</h1>
          <div class="user-details">
            <div class="detail-row">
              <div class="detail-item">
                <span class="detail-label">手机号：</span>
                <span class="detail-value">{{ userInfo.phone }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">邮箱：</span>
                <span
                  :class="['detail-value', { 'unbind-text': !userInfo.email }]"
                  >{{ userInfo.email || "未绑定" }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- 默认欢迎（无用户信息时） -->
        <div v-else class="default-welcome">
          <div class="welcome-icon">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill="#409EFF"
                stroke="#409EFF"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h1 class="welcome-title">欢迎来到 E-DOVE 控台</h1>
          <p class="welcome-subtitle">快捷方便的智能快递驿站</p>
        </div>

        <!-- 功能特性（始终显示） -->
        <div class="welcome-features">
          <div class="feature-item">
            <div class="feature-dot" />
            <span>门店信息管理</span>
          </div>
          <div class="feature-item">
            <div class="feature-dot" />
            <span>货架状态监控</span>
          </div>
          <div class="feature-item">
            <div class="feature-dot" />
            <span>数据统计分析</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.welcome-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 10px;
}

.welcome-card {
  width: 100%;
  max-width: 800px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
}

.welcome-content {
  padding: 30px 15px;
  text-align: center;
}

.welcome-icon {
  margin-bottom: 20px;
}

.welcome-icon svg {
  width: 60px;
  height: 60px;
}

.welcome-title {
  margin-bottom: 12px;
  font-size: 28px;
  font-weight: 600;
  color: #409eff;
}

.welcome-subtitle {
  margin-bottom: 24px;
  font-size: 16px;
  line-height: 1.5;
  color: #606266;
}

.welcome-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 280px;
  margin: 0 auto;
}

.feature-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.feature-item:hover {
  background-color: #e4e7ed;
}

.feature-dot {
  width: 6px;
  height: 6px;
  background-color: #409eff;
  border-radius: 50%;
}

.feature-item span {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.loading-container {
  margin-bottom: 30px;
}

.error-container {
  padding: 20px;
  margin-bottom: 30px;
  background-color: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 8px;
}

.error-icon {
  margin-bottom: 12px;
  font-size: 40px;
}

.error-message {
  margin-bottom: 16px;
  font-size: 14px;
  color: #f56c6c;
}

.user-info {
  margin-bottom: 30px;
}

.user-avatar {
  margin-bottom: 20px;
  background-color: #fff;
  border: 3px solid #fff;
}

.user-details {
  max-width: 400px;
  padding: 16px;
  margin: 0 auto;
  text-align: left;
  background-color: transparent;
  border-radius: 8px;
}

.detail-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.detail-item {
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 180px;
}

.detail-label {
  flex-shrink: 0;
  min-width: 80px;
  margin-right: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  text-align: right;
  white-space: nowrap;
}

.detail-value {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.unbind-text {
  font-weight: normal;
}

.default-welcome {
  margin-bottom: 30px;
}
</style>
