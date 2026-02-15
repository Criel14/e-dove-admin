<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { machineParcelOut } from "@/api/parcel";
import { message } from "@/utils/message";
import type {
  BrowserMultiFormatReader,
  IScannerControls
} from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

defineOptions({
  name: "Machine"
});

const IDENTITY_PREFIX = "ESU";
const TRACKING_PREFIXES = [
  "SF",
  "YT",
  "ZTO",
  "STO",
  "YD",
  "JD",
  "DBL",
  "EMS",
  "JT"
];
const REPEAT_SCAN_GAP_MS = 350;
const CANDIDATE_EXPIRE_MS = 1500;
const STABLE_HIT_THRESHOLD = 2;
const LONG_IDENTITY_SINGLE_HIT_LENGTH = 18;
const NON_ALNUM_REGEX = /[^A-Z0-9]/g;

const videoRef = ref<HTMLVideoElement | null>(null);
const cameraReady = ref(false);
const scanning = ref(false);
const submitting = ref(false);
const mirrorMode = ref(true);
const manualDialogVisible = ref(false);
const identityCode = ref("");
const trackingNumber = ref("");
const manualIdentityCode = ref("");
const manualTrackingNumber = ref("");
const statusText = ref("请将身份码和包裹条码放入镜头内");

let codeReader: BrowserMultiFormatReader | null = null;
let scanControls: IScannerControls | null = null;
let lastScanText = "";
let lastScanAt = 0;
let lastSubmittedPair = "";
let identityCandidate = { code: "", hits: 0, lastAt: 0 };
let trackingCandidate = { code: "", hits: 0, lastAt: 0 };

const canSubmit = computed(() => {
  return Boolean(identityCode.value && trackingNumber.value);
});

const normalizeCode = (value: string) => value.trim().toUpperCase();

const sanitizeCode = (value: string) => {
  return normalizeCode(value).replace(NON_ALNUM_REGEX, "");
};

const isLikelyIdentityCode = (code: string) => {
  return (
    code.startsWith(IDENTITY_PREFIX) && code.length >= 9 && code.length <= 40
  );
};

const isLikelyTrackingCode = (code: string) => {
  return (
    TRACKING_PREFIXES.some(prefix => code.startsWith(prefix)) &&
    code.length >= 8 &&
    code.length <= 32
  );
};

const getIdentityHitThreshold = (code: string) => {
  return code.length >= LONG_IDENTITY_SINGLE_HIT_LENGTH
    ? 1
    : STABLE_HIT_THRESHOLD;
};

const classifyCode = (value: string) => {
  const code = sanitizeCode(value);
  if (!code) return null;
  if (isLikelyIdentityCode(code)) {
    return { type: "identity" as const, code };
  }
  if (isLikelyTrackingCode(code)) {
    return { type: "tracking" as const, code };
  }
  return null;
};

const updateStatusText = () => {
  if (identityCode.value && trackingNumber.value) {
    statusText.value = submitting.value ? "正在出库..." : "识别完成，准备出库";
    return;
  }
  if (!identityCode.value && trackingNumber.value) {
    statusText.value = "请出示身份码";
    return;
  }
  if (identityCode.value && !trackingNumber.value) {
    statusText.value = "请放入包裹";
    return;
  }
  statusText.value = "请将身份码和包裹条码放入镜头内";
};

const resetCandidates = () => {
  identityCandidate = { code: "", hits: 0, lastAt: 0 };
  trackingCandidate = { code: "", hits: 0, lastAt: 0 };
};

const clearCodes = () => {
  identityCode.value = "";
  trackingNumber.value = "";
  resetCandidates();
  updateStatusText();
};

const submitOut = async () => {
  if (!canSubmit.value || submitting.value) return;

  const pair = `${identityCode.value}__${trackingNumber.value}`;
  if (pair === lastSubmittedPair) return;

  submitting.value = true;
  lastSubmittedPair = pair;
  updateStatusText();

  try {
    const res = await machineParcelOut({
      identityCode: identityCode.value,
      trackingNumber: trackingNumber.value
    });
    if (res.status) {
      message(`出库成功，剩${res.data.remaining}个包裹`, { type: "success" });
      clearCodes();
      return;
    }
    message(res.message || "出库失败", { type: "error" });
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "出库失败";
    message(errorMessage, { type: "error" });
  } finally {
    submitting.value = false;
    setTimeout(() => {
      lastSubmittedPair = "";
    }, 600);
    updateStatusText();
  }
};

const applyDetectedCode = (text: string) => {
  const parsed = classifyCode(text);
  if (!parsed) return;

  const now = Date.now();
  if (parsed.type === "identity") {
    if (
      identityCandidate.code === parsed.code &&
      now - identityCandidate.lastAt <= CANDIDATE_EXPIRE_MS
    ) {
      identityCandidate.hits += 1;
    } else {
      identityCandidate = { code: parsed.code, hits: 1, lastAt: now };
    }
    identityCandidate.lastAt = now;
    if (
      identityCandidate.hits >= getIdentityHitThreshold(identityCandidate.code)
    ) {
      identityCode.value = identityCandidate.code;
    }
  }

  if (parsed.type === "tracking") {
    if (
      trackingCandidate.code === parsed.code &&
      now - trackingCandidate.lastAt <= CANDIDATE_EXPIRE_MS
    ) {
      trackingCandidate.hits += 1;
    } else {
      trackingCandidate = { code: parsed.code, hits: 1, lastAt: now };
    }
    trackingCandidate.lastAt = now;
    if (trackingCandidate.hits >= STABLE_HIT_THRESHOLD) {
      trackingNumber.value = trackingCandidate.code;
    }
  }

  updateStatusText();
  if (identityCode.value && trackingNumber.value) {
    submitOut();
  }
};

const fillFromManualInput = () => {
  const id = sanitizeCode(manualIdentityCode.value);
  const tracking = sanitizeCode(manualTrackingNumber.value);

  if (id) {
    if (!isLikelyIdentityCode(id)) {
      message("身份码格式不正确（需 ESU 开头）", { type: "warning" });
      return;
    }
    identityCode.value = id;
  }

  if (tracking) {
    if (!isLikelyTrackingCode(tracking)) {
      message("运单号格式不正确（前缀不匹配）", { type: "warning" });
      return;
    }
    trackingNumber.value = tracking;
  }

  resetCandidates();
  updateStatusText();
};

const submitFromManualInput = () => {
  fillFromManualInput();
  if (!identityCode.value) {
    message("请先输入身份码", { type: "warning" });
    return;
  }
  if (!trackingNumber.value) {
    message("请先输入运单号", { type: "warning" });
    return;
  }
  submitOut();
};

const clearManualInput = () => {
  manualIdentityCode.value = "";
  manualTrackingNumber.value = "";
};

const openManualDialog = () => {
  manualDialogVisible.value = true;
};

const stopCamera = () => {
  scanning.value = false;
  cameraReady.value = false;
  if (scanControls) {
    scanControls.stop();
    scanControls = null;
  }
  codeReader = null;
};

const startCamera = async () => {
  if (!videoRef.value || scanning.value) return;

  try {
    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODABAR,
      BarcodeFormat.ITF
    ]);

    codeReader = new BrowserMultiFormatReader(hints);
    scanControls = await codeReader.decodeFromConstraints(
      {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      },
      videoRef.value,
      result => {
        const text = sanitizeCode(result?.getText?.() || "");
        if (!text) return;
        const now = Date.now();
        if (text === lastScanText && now - lastScanAt < REPEAT_SCAN_GAP_MS) {
          return;
        }
        lastScanText = text;
        lastScanAt = now;
        applyDetectedCode(text);
      }
    );

    scanning.value = true;
    cameraReady.value = true;
    updateStatusText();
  } catch (error: any) {
    const errorMessage = error?.message || "无法启动扫码，请检查摄像头权限设置";
    message(errorMessage, { type: "error" });
    stopCamera();
  }
};

const resetOne = (type: "identity" | "tracking") => {
  if (type === "identity") {
    identityCode.value = "";
    identityCandidate = { code: "", hits: 0, lastAt: 0 };
  }
  if (type === "tracking") {
    trackingNumber.value = "";
    trackingCandidate = { code: "", hits: 0, lastAt: 0 };
  }
  updateStatusText();
};

onMounted(() => {
  startCamera();
});

onBeforeUnmount(() => {
  stopCamera();
});
</script>

<template>
  <div class="machine-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">驿站机器</span>
          <div class="card-actions">
            <el-button
              size="small"
              text
              type="primary"
              @click="openManualDialog"
            >
              调试录入
            </el-button>
            <el-switch
              v-model="mirrorMode"
              size="small"
              inline-prompt
              active-text="镜像"
              inactive-text="正常"
            />
            <el-button
              v-if="!cameraReady"
              type="primary"
              size="small"
              @click="startCamera"
            >
              开启摄像头
            </el-button>
            <el-button v-else type="danger" size="small" @click="stopCamera">
              关闭摄像头
            </el-button>
            <el-button size="small" @click="clearCodes">清空识别</el-button>
          </div>
        </div>
      </template>

      <div class="machine-content">
        <div class="camera-panel">
          <video
            ref="videoRef"
            class="camera-video"
            :class="{ mirror: mirrorMode }"
            playsinline
            muted
          />
          <div class="camera-mask">
            <span>将身份码与包裹条码放入框内</span>
          </div>
        </div>

        <div class="result-panel">
          <el-alert
            :title="statusText"
            :type="canSubmit ? 'success' : 'warning'"
            :closable="false"
            show-icon
          />

          <div class="code-row">
            <div class="code-item">
              <div class="code-label">身份码（ESU）</div>
              <div class="code-value">{{ identityCode || "未识别" }}</div>
              <el-button
                size="small"
                text
                type="primary"
                @click="resetOne('identity')"
              >
                重扫身份码
              </el-button>
            </div>
            <div class="code-item">
              <div class="code-label">
                运单号（SF/YT/ZTO/STO/YD/JD/DBL/EMS/JT）
              </div>
              <div class="code-value">{{ trackingNumber || "未识别" }}</div>
              <el-button
                size="small"
                text
                type="primary"
                @click="resetOne('tracking')"
              >
                重扫包裹码
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog
      v-model="manualDialogVisible"
      title="调试录入"
      width="460px"
      :close-on-click-modal="false"
    >
      <div class="manual-panel">
        <el-input
          v-model="manualIdentityCode"
          placeholder="输入身份码（如 ESU123123123）"
          clearable
        />
        <el-input
          v-model="manualTrackingNumber"
          placeholder="输入运单号（如 SF123456789）"
          clearable
        />
      </div>

      <template #footer>
        <span class="manual-actions">
          <el-button size="small" @click="clearManualInput">清空输入</el-button>
          <el-button size="small" @click="fillFromManualInput">填充</el-button>
          <el-button
            type="primary"
            size="small"
            :loading="submitting"
            @click="submitFromManualInput"
          >
            手动出库
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.machine-container {
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

.machine-content {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
}

.camera-panel {
  position: relative;
  min-height: 420px;
  overflow: hidden;
  background: #0f172a;
  border-radius: 10px;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-video.mirror {
  transform: scaleX(-1);
}

.camera-mask {
  position: absolute;
  right: 16px;
  bottom: 16px;
  left: 16px;
  display: flex;
  justify-content: center;
  padding: 10px 12px;
  color: #fff;
  background: rgb(0 0 0 / 45%);
  border-radius: 8px;
}

.result-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.code-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.code-item {
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.code-label {
  margin-bottom: 6px;
  font-size: 13px;
  color: #6b7280;
}

.code-value {
  min-height: 24px;
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  word-break: break-all;
}

.manual-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.manual-actions {
  display: flex;
  gap: 8px;
}

@media (width <= 1024px) {
  .machine-content {
    grid-template-columns: 1fr;
  }

  .camera-panel {
    min-height: 300px;
  }
}
</style>
