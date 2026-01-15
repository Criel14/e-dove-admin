<script setup lang="ts">
import { ref, reactive } from "vue";
import { generateParcels, type GenerateParcelRequest } from "@/api/parcel";
import { message } from "@/utils/message";

defineOptions({
  name: "DataGeneration"
});

// 弹框显示状态
const dialogVisible = ref(false);
// 加载状态
const loading = ref(false);
// 表单数据 - 使用reactive确保表单绑定正常工作
const form = reactive<GenerateParcelRequest>({
  count: 10
});

// 打开弹框
const handleOpenDialog = () => {
  form.count = 10;
  dialogVisible.value = true;
};

// 提交生成包裹
const handleGenerate = async () => {
  // 调试日志
  console.log("表单数据:", form);
  console.log("count值:", form.count, "类型:", typeof form.count);

  const count = Number(form.count);
  if (!count || count <= 0) {
    message("请输入有效的包裹数量", { type: "warning" });
    return;
  }

  loading.value = true;
  try {
    // 确保发送正确的数据格式
    const requestData = { count };
    console.log("发送的请求数据:", requestData);

    const res = await generateParcels(requestData);
    if (res.status) {
      message(`成功生成 ${count} 个包裹`, { type: "success" });
      dialogVisible.value = false;
    } else {
      message(res.message || "生成包裹失败", { type: "error" });
    }
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.message || error?.message || "请求失败";
    message(errorMsg, { type: "error" });
    console.error("生成包裹失败:", error);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="data-generation-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">数据生成</span>
        </div>
      </template>

      <div class="content">
        <p class="text-gray-400 mb-20">
          此页面用于生成模拟数据，便于开发和测试。选择以下操作批量生成测试数据：
        </p>

        <!-- 数据生成操作列表 -->
        <div class="actions-grid">
          <div class="action-item">
            <div class="action-content">
              <h3 class="action-title">包裹数据生成</h3>
              <p class="action-description">
                批量生成到达本门店的包裹数据，包括运单号、收件人信息、包裹尺寸等
              </p>
            </div>
            <div class="action-button">
              <el-button type="primary" @click="handleOpenDialog">
                生成包裹
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 生成包裹弹框 -->
    <el-dialog
      v-model="dialogVisible"
      title="生成包裹"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="form" label-width="120px" :disabled="loading">
        <el-form-item label="包裹数量" required>
          <el-input-number
            v-model="form.count"
            :min="1"
            :max="1000"
            placeholder="请输入包裹数量"
            controls-position="right"
            class="w-full"
            @change="val => console.log('count变化:', val, '类型:', typeof val)"
          />
        </el-form-item>

        <el-alert
          title="仅会生成到达本门店的包裹"
          type="info"
          :closable="false"
          show-icon
          class="mb-4"
        />
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button :disabled="loading" @click="dialogVisible = false">
            取消
          </el-button>
          <el-button type="primary" :loading="loading" @click="handleGenerate">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.data-generation-container {
  padding: 20px;
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

.content {
  padding: 0;
}

.actions-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
  margin-top: 20px;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.action-item:hover:not(.disabled) {
  border-color: #409eff;
  box-shadow: 0 2px 12px 0 rgb(64 158 255 / 10%);
}

.action-item.disabled {
  cursor: not-allowed;
  background-color: #f5f7fa;
  opacity: 0.6;
}

.action-content {
  flex: 1;
  margin-right: 20px;
}

.action-title {
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.action-description {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #606266;
}

.action-button {
  flex-shrink: 0;
}
</style>
