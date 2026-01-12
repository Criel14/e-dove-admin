<script setup lang="ts">
defineOptions({
  name: "Welcome"
});
</script>

<template>
  <div class="welcome-container">
    <el-card class="welcome-card">
      <div class="welcome-content">
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
  padding: 20px;
  background-color: #f5f7fa;
}

.welcome-card {
  width: 100%;
  max-width: 500px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
}

.welcome-content {
  padding: 30px 20px;
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
</style>
