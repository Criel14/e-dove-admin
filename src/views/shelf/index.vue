<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  getShelfPage,
  createShelf,
  updateShelf,
  type ShelfVO,
  type ShelfPageParams,
  type UpdateShelfRequest
} from "@/api/shelf";
import { message } from "@/utils/message";

defineOptions({
  name: "Shelf"
});

// 货架列表相关
const shelfList = ref<ShelfVO[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const listLoading = ref(false);

// 新增货架相关
const createDialogVisible = ref(false);
const createForm = ref({
  id: null as string | null,
  storeId: null as string | null,
  shelfNo: null as number | null,
  layerCount: 5,
  maxWidth: 50.0,
  maxHeight: 50.0,
  maxLength: 50.0,
  maxWeight: 50.0,
  status: 1
});
const createLoading = ref(false);

// 编辑货架相关
const editDialogVisible = ref(false);
const editForm = ref<UpdateShelfRequest>({
  id: "",
  shelfNo: 0,
  layerCount: 5,
  maxWidth: 50.0,
  maxHeight: 50.0,
  maxLength: 50.0,
  maxWeight: 50.0,
  status: 1
});
const editLoading = ref(false);

// 状态映射
const statusMap: Record<number, string> = {
  1: "正常",
  0: "停用"
};

// 状态标签类型映射
const getStatusType = (status: number) => {
  return status === 1 ? "success" : "danger";
};

// 获取货架分页列表
const fetchShelfList = async () => {
  listLoading.value = true;
  try {
    const params: ShelfPageParams = {
      pageNum: pageNum.value,
      pageSize: pageSize.value
    };

    const res = await getShelfPage(params);
    if (res.status) {
      shelfList.value = res.data.list;
      total.value = res.data.total;
    } else {
      message(res.message || "获取货架列表失败", { type: "error" });
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "获取货架列表失败";
    message(errorMessage, { type: "error" });
    console.error("获取货架列表失败:", error);
  } finally {
    listLoading.value = false;
  }
};

// 处理分页变化
const handlePageChange = (newPage: number) => {
  pageNum.value = newPage;
  fetchShelfList();
};

// 处理分页大小变化
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  pageNum.value = 1;
  fetchShelfList();
};

// 打开新增货架对话框
const handleOpenCreateDialog = () => {
  // 重置表单为默认值
  createForm.value = {
    id: null,
    storeId: null,
    shelfNo: null,
    layerCount: 5,
    maxWidth: 50.0,
    maxHeight: 50.0,
    maxLength: 50.0,
    maxWeight: 50.0,
    status: 1
  };
  createDialogVisible.value = true;
};

// 创建货架
const handleCreateShelf = async () => {
  if (!createForm.value) return;

  createLoading.value = true;
  try {
    const res = await createShelf(createForm.value);
    if (res.status) {
      message("货架创建成功", { type: "success" });
      // 关闭对话框
      createDialogVisible.value = false;
      // 重新获取列表
      await fetchShelfList();
    } else {
      message(res.message || "创建失败", { type: "error" });
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "创建失败";
    message(errorMessage, { type: "error" });
    console.error("创建货架失败:", error);
  } finally {
    createLoading.value = false;
  }
};

// 打开编辑货架对话框
const handleOpenEditDialog = (row: ShelfVO) => {
  // 填充表单数据
  editForm.value = {
    id: row.id,
    shelfNo: row.shelfNo,
    layerCount: row.layerCount,
    maxWidth: row.maxWidth,
    maxHeight: row.maxHeight,
    maxLength: row.maxLength,
    maxWeight: row.maxWeight,
    status: row.status
  };
  editDialogVisible.value = true;
};

// 更新货架
const handleUpdateShelf = async () => {
  if (!editForm.value) return;

  editLoading.value = true;
  try {
    const res = await updateShelf(editForm.value);
    if (res.status) {
      message("货架更新成功", { type: "success" });
      // 关闭对话框
      editDialogVisible.value = false;
      // 重新获取列表
      await fetchShelfList();
    } else {
      message(res.message || "更新失败", { type: "error" });
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "更新失败";
    message(errorMessage, { type: "error" });
    console.error("更新货架失败:", error);
  } finally {
    editLoading.value = false;
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchShelfList();
});
</script>

<template>
  <div class="shelf-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">货架管理</span>
          <div class="card-actions">
            <el-button
              type="success"
              size="small"
              @click="handleOpenCreateDialog"
            >
              新增
            </el-button>
          </div>
        </div>
      </template>

      <!-- 货架列表表格 -->
      <el-table
        v-loading="listLoading"
        :data="shelfList"
        style="width: 100%"
        border
        :expand-row-keys="[]"
        row-key="id"
      >
        <!-- 展开行：货架层详情 -->
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="shelf-layers-container">
              <h4 class="layer-title">
                货架层详情（共 {{ row.layerCount }} 层）
              </h4>
              <el-table
                :data="row.shelfLayers"
                border
                size="small"
                style="width: 100%"
                table-layout="fixed"
                :resizable="false"
              >
                <el-table-column
                  prop="layerNo"
                  label="层号"
                  width="80"
                  align="center"
                />
                <el-table-column
                  prop="todayMaxSeq"
                  label="当天最大序号"
                  width="120"
                  align="center"
                >
                  <template #default="{ row: layer }">
                    <el-tag :type="layer.todayMaxSeq > 0 ? 'success' : 'info'">
                      {{ layer.todayMaxSeq }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="maxCapacity"
                  label="最大容量"
                  width="100"
                  align="center"
                >
                  <template #default="{ row: layer }">
                    <el-tag type="info">
                      {{ layer.maxCapacity }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="使用率" min-width="200" align="center">
                  <template #default="{ row: layer }">
                    <div class="usage-container">
                      <el-progress
                        :percentage="
                          layer.maxCapacity > 0
                            ? Math.round(
                                (layer.todayMaxSeq / layer.maxCapacity) * 100
                              )
                            : 0
                        "
                        :status="
                          layer.todayMaxSeq >= layer.maxCapacity
                            ? 'exception'
                            : 'success'
                        "
                        :stroke-width="10"
                        :show-text="false"
                        class="usage-progress"
                      />
                      <span class="usage-text">
                        {{ layer.todayMaxSeq }}/{{ layer.maxCapacity }}
                      </span>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <!-- 货架基本信息列 -->
        <el-table-column
          prop="shelfNo"
          label="货架编号"
          width="100"
          align="center"
          sortable
        />
        <el-table-column
          prop="layerCount"
          label="总层数"
          width="80"
          align="center"
        />

        <!-- 尺寸限制列 -->
        <el-table-column label="尺寸限制" min-width="200">
          <template #default="{ row }">
            <div class="dimension-info">
              <div class="dimension-item">
                <span class="dimension-label">宽:</span>
                <span class="dimension-value">{{ row.maxWidth }}cm</span>
              </div>
              <div class="dimension-item">
                <span class="dimension-label">高:</span>
                <span class="dimension-value">{{ row.maxHeight }}cm</span>
              </div>
              <div class="dimension-item">
                <span class="dimension-label">长:</span>
                <span class="dimension-value">{{ row.maxLength }}cm</span>
              </div>
              <div class="dimension-item">
                <span class="dimension-label">重:</span>
                <span class="dimension-value">{{ row.maxWeight }}kg</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 状态列 -->
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ statusMap[row.status] || "未知" }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                type="primary"
                size="small"
                @click="handleOpenEditDialog(row)"
              >
                修改
              </el-button>
            </div>
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

      <!-- 新增货架对话框 -->
      <el-dialog
        v-model="createDialogVisible"
        title="新增货架"
        width="500px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
      >
        <el-form
          :model="createForm"
          label-width="120px"
          :disabled="createLoading"
        >
          <el-form-item label="货架编号（可选）">
            <el-input
              v-model.number="createForm.shelfNo"
              placeholder="留空则系统自动生成"
              clearable
              type="number"
            />
          </el-form-item>
          <el-form-item label="货架层数" required>
            <el-input
              v-model.number="createForm.layerCount"
              placeholder="请输入货架层数"
              clearable
              type="number"
            />
          </el-form-item>
          <el-form-item label="最大宽度(cm)" required>
            <el-input
              v-model.number="createForm.maxWidth"
              placeholder="请输入最大宽度"
              clearable
              type="number"
              step="0.1"
            />
          </el-form-item>
          <el-form-item label="最大高度(cm)" required>
            <el-input
              v-model.number="createForm.maxHeight"
              placeholder="请输入最大高度"
              clearable
              type="number"
              step="0.1"
            />
          </el-form-item>
          <el-form-item label="最大长度(cm)" required>
            <el-input
              v-model.number="createForm.maxLength"
              placeholder="请输入最大长度"
              clearable
              type="number"
              step="0.1"
            />
          </el-form-item>
          <el-form-item label="最大重量(kg)" required>
            <el-input
              v-model.number="createForm.maxWeight"
              placeholder="请输入最大重量"
              clearable
              type="number"
              step="0.1"
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
              @click="handleCreateShelf"
            >
              创建
            </el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 编辑货架对话框 -->
      <el-dialog
        v-model="editDialogVisible"
        title="修改货架"
        width="500px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
      >
        <el-form :model="editForm" label-width="120px" :disabled="editLoading">
          <el-form-item label="货架编号" required>
            <el-input
              v-model.number="editForm.shelfNo"
              placeholder="请输入货架编号"
              clearable
              type="number"
            />
          </el-form-item>
          <el-form-item label="货架层数" required>
            <el-input
              v-model.number="editForm.layerCount"
              placeholder="请输入货架层数"
              clearable
              type="number"
            />
          </el-form-item>
          <el-form-item label="最大宽度(cm)" required>
            <el-input
              v-model.number="editForm.maxWidth"
              placeholder="请输入最大宽度"
              clearable
              type="number"
              step="0.1"
            />
          </el-form-item>
          <el-form-item label="最大高度(cm)" required>
            <el-input
              v-model.number="editForm.maxHeight"
              placeholder="请输入最大高度"
              clearable
              type="number"
              step="0.1"
            />
          </el-form-item>
          <el-form-item label="最大长度(cm)" required>
            <el-input
              v-model.number="editForm.maxLength"
              placeholder="请输入最大长度"
              clearable
              type="number"
              step="0.1"
            />
          </el-form-item>
          <el-form-item label="最大重量(kg)" required>
            <el-input
              v-model.number="editForm.maxWeight"
              placeholder="请输入最大重量"
              clearable
              type="number"
              step="0.1"
            />
          </el-form-item>
          <el-form-item label="状态" required>
            <el-select
              v-model.number="editForm.status"
              placeholder="请选择状态"
              clearable
              style="width: 100%"
            >
              <el-option label="启用" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button
              :disabled="editLoading"
              @click="editDialogVisible = false"
            >
              取消
            </el-button>
            <el-button
              type="primary"
              :loading="editLoading"
              @click="handleUpdateShelf"
            >
              更新
            </el-button>
          </span>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<style scoped>
.shelf-container {
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

.card-actions {
  display: flex;
  gap: 10px;
}

.shelf-layers-container {
  padding: 20px;
  margin: 8px 0;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 5%);
}

.layer-title {
  padding-bottom: 8px;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
}

.dimension-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
}

.dimension-item {
  display: flex;
  align-items: center;
  min-width: 80px;
  padding: 4px 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.dimension-item:hover {
  background-color: #e4e7ed;
}

.dimension-label {
  margin-right: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #909399;
}

.dimension-value {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
}

.usage-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.usage-progress {
  flex: 1;
  min-width: 0;
}

.usage-text {
  min-width: 60px;
  font-size: 12px;
  color: #606266;
  text-align: right;
}
</style>
