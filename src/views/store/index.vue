<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  getMyStore,
  getStorePage,
  bindStore,
  unbindStore,
  updateStore,
  updateStoreStatus,
  createStore,
  deactivateStore,
  type StoreInfo,
  type StoreListItem,
  type UpdateStoreRequest,
  type CreateStoreRequest
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

// 编辑门店相关
const editDialogVisible = ref(false);
const editForm = ref<UpdateStoreRequest>({
  id: "",
  storeName: "",
  managerUserId: "",
  managerPhone: "",
  addrProvince: "",
  addrCity: "",
  addrDistrict: "",
  addrDetail: "",
  status: 1
});
const editLoading = ref(false);

// 编辑门店状态相关
const editStatusDialogVisible = ref(false);
const editStatusForm = ref<UpdateStoreRequest>({
  id: "",
  storeName: "",
  managerUserId: "",
  managerPhone: "",
  addrProvince: "",
  addrCity: "",
  addrDistrict: "",
  addrDetail: "",
  status: 1
});
const editStatusLoading = ref(false);

// 创建门店相关
const createDialogVisible = ref(false);
const createForm = ref<CreateStoreRequest>({
  storeName: "",
  addrProvince: "",
  addrCity: "",
  addrDistrict: "",
  addrDetail: ""
});
const createLoading = ref(false);

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
const handleBindStore = async (storeId: string, status: number) => {
  // 如果门店状态为注销，不允许绑定
  if (status === 3) {
    message("已注销的门店不能绑定", { type: "warning" });
    return;
  }

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

// 打开编辑门店信息对话框
const handleOpenEditDialog = () => {
  if (!storeInfo.value) return;

  // 将当前门店信息填充到编辑表单中
  editForm.value = {
    id: storeInfo.value.id,
    storeName: storeInfo.value.storeName,
    managerUserId: storeInfo.value.managerUserId,
    managerPhone: storeInfo.value.managerPhone,
    addrProvince: storeInfo.value.addrProvince,
    addrCity: storeInfo.value.addrCity,
    addrDistrict: storeInfo.value.addrDistrict,
    addrDetail: storeInfo.value.addrDetail,
    status: storeInfo.value.status
  };

  editDialogVisible.value = true;
};

// 保存门店信息修改
const handleSaveStoreInfo = async () => {
  if (!editForm.value) return;

  editLoading.value = true;
  try {
    const res = await updateStore(editForm.value);
    if (res.status) {
      message("门店信息更新成功", { type: "success" });
      // 关闭对话框
      editDialogVisible.value = false;
      // 重新获取门店信息
      await fetchStoreInfo();
    } else {
      message(res.message || "更新失败", { type: "error" });
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "更新失败";
    message(errorMessage, { type: "error" });
    console.error("更新门店信息失败:", error);
  } finally {
    editLoading.value = false;
  }
};

// 打开编辑门店状态对话框
const handleOpenEditStatusDialog = () => {
  if (!storeInfo.value) return;

  // 将当前门店信息填充到状态编辑表单中
  editStatusForm.value = {
    id: storeInfo.value.id,
    storeName: storeInfo.value.storeName,
    managerUserId: storeInfo.value.managerUserId,
    managerPhone: storeInfo.value.managerPhone,
    addrProvince: storeInfo.value.addrProvince,
    addrCity: storeInfo.value.addrCity,
    addrDistrict: storeInfo.value.addrDistrict,
    addrDetail: storeInfo.value.addrDetail,
    status: storeInfo.value.status
  };

  editStatusDialogVisible.value = true;
};

// 保存门店状态修改
const handleSaveStoreStatus = async () => {
  if (!editStatusForm.value) return;

  editStatusLoading.value = true;
  try {
    const res = await updateStoreStatus(editStatusForm.value);
    if (res.status) {
      message("门店状态更新成功", { type: "success" });
      // 关闭对话框
      editStatusDialogVisible.value = false;
      // 重新获取门店信息
      await fetchStoreInfo();
    } else {
      message(res.message || "更新失败", { type: "error" });
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "更新失败";
    message(errorMessage, { type: "error" });
    console.error("更新门店状态失败:", error);
  } finally {
    editStatusLoading.value = false;
  }
};

// 打开创建门店对话框
const handleOpenCreateDialog = () => {
  // 重置表单
  createForm.value = {
    storeName: "",
    addrProvince: "",
    addrCity: "",
    addrDistrict: "",
    addrDetail: ""
  };
  createDialogVisible.value = true;
};

// 保存创建的门店
const handleSaveCreateStore = async () => {
  if (!createForm.value) return;

  createLoading.value = true;
  try {
    const res = await createStore(createForm.value);
    if (res.status) {
      message("门店创建成功并已自动绑定", { type: "success" });
      // 关闭对话框
      createDialogVisible.value = false;
      // 重新获取门店信息（会自动绑定并显示）
      await fetchStoreInfo();
      // 注意：创建成功后，后端会自动绑定，所以不需要再调用绑定接口
      // 直接刷新门店信息即可
    } else {
      message(res.message || "创建失败", { type: "error" });
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "创建失败";
    message(errorMessage, { type: "error" });
    console.error("创建门店失败:", error);
  } finally {
    createLoading.value = false;
  }
};

// 注销门店
const handleDeactivateStore = async () => {
  if (!storeInfo.value) return;

  try {
    await ElMessageBox.confirm(
      `确定要注销门店 "${storeInfo.value.storeName}" 吗？注销后门店状态将变为注销状态。`,
      "确认注销",
      {
        confirmButtonText: "确定注销",
        cancelButtonText: "取消",
        type: "warning",
        center: true
      }
    );

    const res = await deactivateStore(storeInfo.value.id);
    if (res.status) {
      message("门店已成功注销", { type: "success" });
      // 重新获取门店信息（状态会更新为3）
      await fetchStoreInfo();
    } else {
      message(res.message || "注销失败", { type: "error" });
    }
  } catch (error: any) {
    // 用户取消操作
    if (error === "cancel" || error === "close") {
      return;
    }
    const errorMessage =
      error?.response?.data?.message || error?.message || "注销失败";
    message(errorMessage, { type: "error" });
    console.error("注销门店失败:", error);
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
            <span class="card-title">所属门店信息</span>
            <div class="card-actions">
              <el-button
                type="primary"
                size="small"
                @click="handleOpenEditDialog"
              >
                修改信息
              </el-button>
              <el-button type="danger" size="small" @click="handleUnbindStore">
                解绑门店
              </el-button>
            </div>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="门店编号">
            {{ storeInfo.id }}
          </el-descriptions-item>
          <el-descriptions-item label="门店名称">
            {{ storeInfo.storeName }}
          </el-descriptions-item>

          <el-descriptions-item label="联系电话">
            {{ storeInfo.managerPhone }}
          </el-descriptions-item>
          <el-descriptions-item label="门店状态">
            <div class="status-container">
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
              <el-button
                type="text"
                size="small"
                class="ml-2"
                @click="handleOpenEditStatusDialog"
              >
                修改
              </el-button>
              <el-button
                v-if="storeInfo.status !== 3"
                type="text"
                size="small"
                class="ml-2 text-red-500"
                @click="handleDeactivateStore"
              >
                注销
              </el-button>
            </div>
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
            <div class="card-actions">
              <el-button
                type="success"
                size="small"
                @click="handleOpenCreateDialog"
              >
                创建门店
              </el-button>
            </div>
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
        <div class="table-container">
          <el-table
            v-loading="listLoading"
            :data="storeList"
            style="width: 100%"
            border
          >
            <el-table-column
              prop="storeName"
              label="门店名称"
              min-width="150"
            />
            <el-table-column
              prop="managerPhone"
              label="管理员手机号"
              width="120"
            />
            <el-table-column prop="addrProvince" label="省份" width="100" />
            <el-table-column prop="addrCity" label="城市" width="100" />
            <el-table-column prop="addrDistrict" label="区县" width="100" />
            <el-table-column
              prop="addrDetail"
              label="详细地址"
              min-width="180"
            />
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
                <el-tooltip
                  v-if="scope.row.status === 3"
                  content="已注销的门店不能绑定"
                  placement="top"
                >
                  <el-button type="primary" size="small" disabled>
                    绑定
                  </el-button>
                </el-tooltip>
                <el-button
                  v-else
                  type="primary"
                  size="small"
                  @click="handleBindStore(scope.row.id, scope.row.status)"
                >
                  绑定
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

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

    <!-- 编辑门店信息对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="修改门店信息"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        :model="editForm"
        label-width="90px"
        :disabled="editLoading"
        class="store-edit-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="门店名称" required>
              <el-input
                v-model="editForm.storeName"
                placeholder="请输入门店名称"
                clearable
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="管理员手机号" required>
              <el-input
                v-model="editForm.managerPhone"
                placeholder="请输入管理员手机号"
                clearable
                class="w-full"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="address-row">
          <el-col :span="8">
            <el-form-item label="省份" required>
              <el-input
                v-model="editForm.addrProvince"
                placeholder="请输入省份"
                clearable
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市" required>
              <el-input
                v-model="editForm.addrCity"
                placeholder="请输入城市"
                clearable
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="区县" required>
              <el-input
                v-model="editForm.addrDistrict"
                placeholder="请输入区县"
                clearable
                class="w-full"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="详细地址" required>
          <el-input
            v-model="editForm.addrDetail"
            placeholder="请输入详细地址"
            clearable
            class="w-full"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button :disabled="editLoading" @click="editDialogVisible = false">
            取消
          </el-button>
          <el-button
            type="primary"
            :loading="editLoading"
            @click="handleSaveStoreInfo"
          >
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑门店状态对话框 -->
    <el-dialog
      v-model="editStatusDialogVisible"
      title="修改门店状态"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        :model="editStatusForm"
        label-width="120px"
        :disabled="editStatusLoading"
      >
        <el-form-item label="门店状态" required>
          <el-select
            v-model="editStatusForm.status"
            placeholder="请选择门店状态"
            class="w-full"
          >
            <el-option :label="'营业 (1)'" :value="1" />
            <el-option :label="'休息 (2)'" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button
            :disabled="editStatusLoading"
            @click="editStatusDialogVisible = false"
          >
            取消
          </el-button>
          <el-button
            type="primary"
            :loading="editStatusLoading"
            @click="handleSaveStoreStatus"
          >
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 创建门店对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建门店"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        :model="createForm"
        label-width="90px"
        :disabled="createLoading"
        class="store-create-form"
      >
        <el-form-item label="门店名称" required>
          <el-input
            v-model="createForm.storeName"
            placeholder="请输入门店名称"
            clearable
            class="w-full"
          />
        </el-form-item>

        <el-row :gutter="20" class="address-row">
          <el-col :span="8">
            <el-form-item label="省份" required>
              <el-input
                v-model="createForm.addrProvince"
                placeholder="请输入省份"
                clearable
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市" required>
              <el-input
                v-model="createForm.addrCity"
                placeholder="请输入城市"
                clearable
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="区县" required>
              <el-input
                v-model="createForm.addrDistrict"
                placeholder="请输入区县"
                clearable
                class="w-full"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="详细地址" required>
          <el-input
            v-model="createForm.addrDetail"
            placeholder="请输入详细地址"
            clearable
            class="w-full"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button
            :disabled="createLoading"
            @click="createDialogVisible = false"
          >
            取消
          </el-button>
          <el-button
            type="primary"
            :loading="createLoading"
            @click="handleSaveCreateStore"
          >
            创建
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.store-container {
  padding: 20px;
}

.store-info-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
}

.table-container {
  overflow-x: auto;
}

.store-container :deep(.el-form-item__label) {
  white-space: nowrap;
}

.store-container :deep(.el-dialog .el-input) {
  width: 100%;
}
</style>
