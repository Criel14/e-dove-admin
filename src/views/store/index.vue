<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  getMyStore,
  getStorePage,
  bindStore,
  unbindStore,
  type StoreInfo,
  type StoreListItem
} from "@/api/store";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import Search from "~icons/ep/search";

defineOptions({
  name: "Store"
});

// 加载状态
const loading = ref(false);
// 门店信息
const storeInfo = ref<StoreInfo | null>(null);
// 错误信息
const errorMessage = ref("");

// 门店列表相关
const storeList = ref<StoreListItem[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const searchStoreName = ref("");
const listLoading = ref(false);

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
      // 如果获取门店信息失败，尝试获取门店列表（可能是未绑定门店）
      await fetchStoreList();
    }
  } catch (error: any) {
    // 尝试从错误响应中提取message
    errorMessage.value =
      error?.response?.data?.message || error?.message || "请求失败";
    storeInfo.value = null;
    console.error("获取门店信息失败:", error);
    // 尝试获取门店列表
    await fetchStoreList();
  } finally {
    loading.value = false;
  }
};

// 获取门店列表
const fetchStoreList = async () => {
  listLoading.value = true;
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      storeName: searchStoreName.value
    };
    const res = await getStorePage(params);
    if (res.status) {
      storeList.value = res.data.list;
      total.value = res.data.total;
    } else {
      message(res.message || "获取门店列表失败", { type: "error" });
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "获取门店列表失败";
    message(errorMessage, { type: "error" });
    console.error("获取门店列表失败:", error);
  } finally {
    listLoading.value = false;
  }
};

// 搜索门店
const handleSearch = () => {
  pageNum.value = 1;
  fetchStoreList();
};

// 绑定门店
const handleBindStore = async (storeId: string) => {
  try {
    const res = await bindStore(storeId);
    if (res.status) {
      message("绑定成功", { type: "success" });
      // 清除列表数据
      storeList.value = [];
      total.value = 0;
      // 重新获取门店信息（不显示loading，因为fetchStoreInfo内部会处理）
      await fetchStoreInfo();
    } else {
      message(res.message || "绑定失败", { type: "error" });
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "绑定失败";
    message(errorMessage, { type: "error" });
    console.error("绑定门店失败:", error);
  }
};

// 解绑门店
const handleUnbindStore = async () => {
  if (!storeInfo.value) return;

  try {
    await ElMessageBox.confirm(
      `确定要解绑门店 "${storeInfo.value.storeName}" 吗？解绑后您需要重新选择门店进行绑定。`,
      "确认解绑",
      {
        confirmButtonText: "确定解绑",
        cancelButtonText: "取消",
        type: "warning",
        center: true
      }
    );

    const res = await unbindStore(storeInfo.value.id);
    if (res.status) {
      message("解绑成功", { type: "success" });
      // 清除门店信息
      storeInfo.value = null;
      // 获取门店列表
      await fetchStoreList();
    } else {
      message(res.message || "解绑失败", { type: "error" });
    }
  } catch (error: any) {
    // 用户取消操作
    if (error === "cancel" || error === "close") {
      return;
    }
    const errorMessage =
      error?.response?.data?.message || error?.message || "解绑失败";
    message(errorMessage, { type: "error" });
    console.error("解绑门店失败:", error);
  }
};

// 处理分页变化
const handlePageChange = (newPage: number) => {
  pageNum.value = newPage;
  fetchStoreList();
};

// 处理分页大小变化
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  pageNum.value = 1;
  fetchStoreList();
};

// 页面加载时获取数据
onMounted(() => {
  fetchStoreInfo();
});
</script>

<template>
  <div class="store-container">
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
            <el-button type="danger" size="small" @click="handleUnbindStore">
              解绑门店
            </el-button>
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

    <!-- 门店列表（当未绑定门店时显示） -->
    <div v-else-if="!loading" class="store-list-card">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">选择门店进行绑定</span>
          </div>
        </template>

        <!-- 搜索框 -->
        <div class="search-container mb-4">
          <el-input
            v-model="searchStoreName"
            placeholder="请输入门店名称搜索"
            class="search-input"
            style="width: 300px"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </div>

        <!-- 门店列表表格 -->
        <el-table
          v-loading="listLoading"
          :data="storeList"
          style="width: 100%"
          border
        >
          <el-table-column prop="id" label="门店ID" width="100" />
          <el-table-column prop="storeName" label="门店名称" min-width="150" />
          <el-table-column
            prop="managerPhone"
            label="管理员手机号"
            width="130"
          />
          <el-table-column prop="addrProvince" label="省份" width="100" />
          <el-table-column prop="addrCity" label="城市" width="100" />
          <el-table-column prop="addrDistrict" label="区县" width="100" />
          <el-table-column prop="addrDetail" label="详细地址" min-width="200" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag
                :type="
                  scope.row.status === 1
                    ? 'success'
                    : scope.row.status === 2
                      ? 'warning'
                      : 'danger'
                "
              >
                {{ statusMap[scope.row.status] || "未知" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="handleBindStore(scope.row.id)"
              >
                绑定
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页控件 -->
        <div class="pagination-container mt-4">
          <el-pagination
            v-model:current-page="pageNum"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.store-container {
  padding: 20px;
}

.store-info-card {
  max-width: 800px;
  margin: 0 auto;
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
