<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import {
  getParcelPage,
  parcelIn,
  parcelOut,
  type ParcelInfo,
  type ParcelPageRequest
} from "@/api/parcel";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import Search from "~icons/ep/search";
import JsBarcode from "jsbarcode";

defineOptions({
  name: "Parcel"
});

// 加载状态
const loading = ref(false);
// 包裹列表
const parcelList = ref<ParcelInfo[]>([]);
// 总数
const total = ref(0);
// 分页参数
const pageNum = ref(1);
const pageSize = ref(10);
// 搜索参数
const searchParams = ref<ParcelPageRequest>({
  pageNum: 1,
  pageSize: 20
});
// 状态映射
const statusMap: Record<
  number,
  { label: string; type: "info" | "success" | "warning" | "danger" | "primary" }
> = {
  0: { label: "未入库", type: "primary" },
  1: { label: "已入库", type: "warning" },
  2: { label: "已取出", type: "success" },
  3: { label: "滞留", type: "danger" },
  4: { label: "退回", type: "danger" }
};
// 时间类型选项
const timeTypeOptions = [
  { label: "入库时间", value: "inTime" },
  { label: "出库时间", value: "outTime" }
];

// 获取包裹列表
const fetchParcelList = async () => {
  loading.value = true;
  try {
    const params = {
      ...searchParams.value,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    };
    const res = await getParcelPage(params);
    if (res.status) {
      parcelList.value = res.data.list;
      total.value = res.data.total;
    } else {
      message(res.message || "获取包裹列表失败", { type: "error" });
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "获取包裹列表失败";
    message(errorMessage, { type: "error" });
    console.error("获取包裹列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pageNum.value = 1;
  fetchParcelList();
};

// 分页变化
const handlePageChange = (newPage: number) => {
  pageNum.value = newPage;
  fetchParcelList();
};

// 分页大小变化
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  pageNum.value = 1;
  fetchParcelList();
};

// 格式化入库时间
const formatInTime = (dateTime: string | null) => {
  if (!dateTime) return "(未入库)";
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 格式化出库时间
const formatOutTime = (dateTime: string | null) => {
  if (!dateTime) return "(未出库)";
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 页面加载时获取数据
onMounted(() => {
  fetchParcelList();
});

// 详细信息弹窗相关
const detailDialogVisible = ref(false);
const currentParcel = ref<ParcelInfo | null>(null);
const barcodeSvgRef = ref<SVGSVGElement | null>(null);
const barcodePopoverVisible = ref(false);

// 显示包裹详细信息
const showDetail = (parcel: ParcelInfo) => {
  currentParcel.value = parcel;
  detailDialogVisible.value = true;
};

const handleShowBarcode = async () => {
  if (!currentParcel.value?.trackingNumber) return;
  barcodePopoverVisible.value = true;
  await nextTick();
  if (barcodeSvgRef.value) {
    JsBarcode(barcodeSvgRef.value, currentParcel.value.trackingNumber, {
      format: "CODE128",
      displayValue: true,
      fontSize: 14,
      height: 60,
      margin: 10
    });
  }
};

// 包裹入库
const handleParcelIn = async (parcel: ParcelInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要将运单号为 "${parcel.trackingNumber}" 的包裹入库吗？`,
      "确认入库",
      {
        confirmButtonText: "确定入库",
        cancelButtonText: "取消",
        type: "warning",
        center: true
      }
    );

    const res = await parcelIn({ trackingNumber: parcel.trackingNumber });
    if (res.status) {
      message("包裹入库成功", { type: "success" });
      // 重新获取包裹列表
      await fetchParcelList();
    } else {
      message(res.message || "入库失败", { type: "error" });
    }
  } catch (error: any) {
    // 用户取消操作
    if (error === "cancel" || error === "close") {
      return;
    }
    const errorMessage =
      error?.response?.data?.message || error?.message || "入库失败";
    message(errorMessage, { type: "error" });
    console.error("包裹入库失败:", error);
  }
};

// 包裹出库
const handleParcelOut = async (parcel: ParcelInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要将运单号为 "${parcel.trackingNumber}" 的包裹出库吗？<br/>收件人手机号：${parcel.recipientPhone}`,
      "确认出库",
      {
        confirmButtonText: "确定出库",
        cancelButtonText: "取消",
        type: "warning",
        center: true,
        dangerouslyUseHTMLString: true
      }
    );

    const res = await parcelOut({
      trackingNumber: parcel.trackingNumber,
      recipientPhone: parcel.recipientPhone
    });
    if (res.status) {
      message("包裹出库成功", { type: "success" });
      // 重新获取包裹列表
      await fetchParcelList();
    } else {
      message(res.message || "出库失败", { type: "error" });
    }
  } catch (error: any) {
    // 用户取消操作
    if (error === "cancel" || error === "close") {
      return;
    }
    const errorMessage =
      error?.response?.data?.message || error?.message || "出库失败";
    message(errorMessage, { type: "error" });
    console.error("包裹出库失败:", error);
  }
};
</script>

<template>
  <div class="parcel-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">包裹管理</span>
          <div class="card-actions">
            <el-button type="primary" :icon="Search" @click="handleSearch">
              搜索
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="search-container mb-1">
        <el-form :model="searchParams" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="运单号">
                <el-input
                  v-model="searchParams.trackingNumber"
                  placeholder="请输入运单号"
                  clearable
                  @keyup.enter="handleSearch"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="收件人手机号">
                <el-input
                  v-model="searchParams.recipientPhone"
                  placeholder="请输入收件人手机号"
                  clearable
                  @keyup.enter="handleSearch"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="包裹状态">
                <el-select
                  v-model="searchParams.status"
                  placeholder="请选择包裹状态"
                  clearable
                  class="w-full"
                >
                  <el-option label="全部" :value="undefined" />
                  <el-option
                    v-for="(status, key) in statusMap"
                    :key="key"
                    :label="status.label"
                    :value="Number(key)"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="时间类型">
                <el-select
                  v-model="searchParams.timeType"
                  placeholder="请选择时间类型"
                  clearable
                  class="w-full"
                >
                  <el-option
                    v-for="option in timeTypeOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="开始时间">
                <el-date-picker
                  v-model="searchParams.startTime"
                  type="date"
                  placeholder="请选择开始日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  class="w-full"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="结束时间">
                <el-date-picker
                  v-model="searchParams.endTime"
                  type="date"
                  placeholder="请选择结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  class="w-full"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 包裹列表表格 -->
      <div class="table-container">
        <el-table
          v-loading="loading"
          :data="parcelList"
          style="width: 100%"
          border
          stripe
        >
          <el-table-column
            prop="trackingNumber"
            label="运单号"
            width="150"
            fixed="left"
          />
          <el-table-column
            prop="recipientPhone"
            label="收件人手机号"
            width="130"
            fixed="left"
          />
          <el-table-column prop="status" label="包裹状态" width="120">
            <template #default="scope">
              <el-tag
                :type="statusMap[scope.row.status]?.type || 'info'"
                size="small"
              >
                {{ statusMap[scope.row.status]?.label || "未知" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="inTime" label="入库时间">
            <template #default="scope">
              <div v-if="!scope.row.inTime">
                <el-tag size="small" plain type="info"> (未入库) </el-tag>
              </div>
              <div v-else>
                {{ formatInTime(scope.row.inTime) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="outTime" label="出库时间">
            <template #default="scope">
              <div v-if="!scope.row.outTime">
                <el-tag size="small" plain type="info">(未出库)</el-tag>
              </div>
              <div v-else>
                {{ formatOutTime(scope.row.outTime) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="查看" width="70" fixed="right">
            <template #default="scope">
              <div class="detail-button-container">
                <el-button
                  type="primary"
                  size="small"
                  @click="showDetail(scope.row)"
                >
                  详细
                </el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="scope">
              <div class="operation-buttons">
                <el-button
                  type="success"
                  size="small"
                  :disabled="scope.row.status === 1 || scope.row.status === 2"
                  @click="handleParcelIn(scope.row)"
                >
                  入库
                </el-button>
                <el-button
                  type="warning"
                  size="small"
                  :disabled="scope.row.status === 2"
                  @click="handleParcelOut(scope.row)"
                >
                  出库
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页控件 -->
      <div class="pagination-container mt-4">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>

      <!-- 包裹详细信息弹窗 -->
      <el-dialog
        v-model="detailDialogVisible"
        title="包裹详细信息"
        width="800px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
      >
        <div v-if="currentParcel" class="detail-container">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="包裹ID">
              {{ currentParcel.id }}
            </el-descriptions-item>
            <el-descriptions-item label="运单号">
              <div class="tracking-number-row">
                <span>{{ currentParcel.trackingNumber }}</span>
                <el-popover
                  v-model:visible="barcodePopoverVisible"
                  placement="right"
                  width="360"
                  trigger="click"
                  popper-class="barcode-popper"
                  @show="handleShowBarcode"
                >
                  <div class="barcode-container">
                    <svg ref="barcodeSvgRef" />
                  </div>
                  <template #reference>
                    <el-button
                      size="small"
                      type="primary"
                      text
                      class="barcode-btn"
                    >
                      条形码
                    </el-button>
                  </template>
                </el-popover>
              </div>
            </el-descriptions-item>

            <el-descriptions-item label="收件人手机号">
              {{ currentParcel.recipientPhone }}
            </el-descriptions-item>
            <el-descriptions-item label="包裹状态">
              <el-tag
                :type="statusMap[currentParcel.status]?.type || 'info'"
                size="small"
              >
                {{ statusMap[currentParcel.status]?.label || "未知" }}
              </el-tag>
            </el-descriptions-item>

            <el-descriptions-item label="收件地址">
              {{
                currentParcel.recipientAddrProvince +
                currentParcel.recipientAddrCity +
                currentParcel.recipientAddrDistrict +
                currentParcel.recipientAddrDetail
              }}
            </el-descriptions-item>
            <el-descriptions-item label="取件码">
              <div v-if="!currentParcel.pickCode">
                <el-tag size="small" plain type="info">(未入库)</el-tag>
              </div>
              <div v-else>
                {{ currentParcel.pickCode }}
              </div>
            </el-descriptions-item>

            <el-descriptions-item label="门店ID">
              {{ currentParcel.storeId }}
            </el-descriptions-item>
            <el-descriptions-item label="包裹尺寸">
              宽: {{ currentParcel.width }}cm × 高: {{ currentParcel.height }}cm
              × 长: {{ currentParcel.length }}cm
            </el-descriptions-item>

            <el-descriptions-item label="包裹重量">
              {{ currentParcel.weight }}kg
            </el-descriptions-item>
            <el-descriptions-item label="入库时间">
              <div v-if="!currentParcel.inTime">
                <el-tag size="small" plain type="info">(未入库)</el-tag>
              </div>
              <div v-else>
                {{ formatInTime(currentParcel.inTime) }}
              </div>
            </el-descriptions-item>

            <el-descriptions-item label="出库时间">
              <div v-if="!currentParcel.outTime">
                <el-tag size="small" plain type="info">(未出库)</el-tag>
              </div>
              <div v-else>
                {{ formatOutTime(currentParcel.outTime) }}
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div v-else class="empty-detail">未找到包裹信息</div>

        <template #footer>
          <span class="dialog-footer">
            <el-button @click="detailDialogVisible = false">关闭</el-button>
          </span>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<style scoped>
.parcel-container {
  padding: 20px;
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

.search-container {
  padding: 20px;
  background-color: #f9fafc;
  border-radius: 8px;
}

.table-container {
  overflow-x: auto;
}

.tracking-number-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.barcode-btn.el-button.is-text {
  padding: 4px 8px;
  background: rgb(64 158 255 / 12%);
  border-radius: 6px;
}

.barcode-btn.el-button.is-text:hover {
  background: rgb(64 158 255 / 20%);
}

.barcode-container {
  display: flex;
  justify-content: center;
  padding: 8px;
  background: #fff;
  border: 1px solid #eef1f6;
  border-radius: 8px;
}

.parcel-container :deep(.barcode-popper) {
  padding: 12px;
  border-radius: 10px;
  box-shadow: 0 12px 32px rgb(0 0 0 / 12%);
}

.operation-buttons {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  justify-content: center;
}

.detail-button-container {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
}
</style>
