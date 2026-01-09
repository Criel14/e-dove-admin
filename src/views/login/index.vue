<script setup lang="ts">
import Motion from "./utils/motion";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { loginRules, REGEXP_PHONE, REGEXP_EMAIL } from "./utils/rule"; // 导入验证规则和正则
import { ref, reactive, toRaw, computed, onUnmounted } from "vue"; // 添加computed和onUnmounted
import { debounce } from "@pureadmin/utils";
import { useNav } from "@/layout/hooks/useNav";
import { useEventListener } from "@vueuse/core";
import type { FormInstance } from "element-plus";
import { useLayout } from "@/layout/hooks/useLayout";
import { useUserStoreHook } from "@/store/modules/user";
import { initRouter, getTopMenu } from "@/router/utils";
import { bg, logoUrl, illustration } from "./utils/static";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import Lock from "~icons/ri/lock-fill";
import User from "~icons/ri/user-3-fill";
import Phone from "~icons/ri/phone-fill"; // 手机图标
import Message from "~icons/ri/message-3-fill"; // 消息图标

defineOptions({
  name: "Login"
});

const router = useRouter();
const loading = ref(false);
const disabled = ref(false);
// 表单refs
const passwordFormRef = ref<FormInstance>();
const smsFormRef = ref<FormInstance>();

// 登录方式切换（password: 账号密码登录, sms: 短信验证码登录）
const activeTab = ref<"password" | "sms">("password");

// 短信验证码倒计时
const countdown = ref(0);
const countdownInterval = ref<NodeJS.Timeout | null>(null);
const isSending = ref(false);

const { initStorage } = useLayout();
initStorage();

const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { title } = useNav();

// 表单数据
const ruleForm = reactive({
  // 账号密码登录字段
  account: "", // 邮箱或手机号
  password: "",

  // 短信登录字段
  phone: "", // 手机号
  smsCode: "" // 短信验证码
});

// 计算属性：判断账号输入的是手机号还是邮箱
const accountType = computed(() => {
  const account = ruleForm.account.trim();
  if (REGEXP_PHONE.test(account)) {
    return "phone";
  } else if (REGEXP_EMAIL.test(account)) {
    return "email";
  }
  return "unknown";
});

// 计算属性：动态验证规则
const dynamicRules = computed(() => {
  if (activeTab.value === "password") {
    // 账号密码登录：只验证account和password
    return {
      account: loginRules.account,
      password: loginRules.password
    };
  } else {
    // 短信验证码登录：只验证phone和smsCode
    return {
      phone: loginRules.phone,
      smsCode: loginRules.smsCode
    };
  }
});

// 计算属性：当前活动的表单ref
const currentFormRef = computed(() => {
  return activeTab.value === "password"
    ? passwordFormRef.value
    : smsFormRef.value;
});

// 发送短信验证码
const sendSmsCode = async () => {
  // 验证手机号格式
  if (!ruleForm.phone) {
    message("请输入手机号", { type: "warning" });
    return;
  }

  if (!REGEXP_PHONE.test(ruleForm.phone)) {
    message("手机号格式不正确", { type: "warning" });
    return;
  }

  isSending.value = true;

  try {
    // 调用发送验证码接口
    // 注意：后端要求参数为 { phoneOrEmail: "手机号" }
    const res = await useUserStoreHook().sendOtpCode({
      phoneOrEmail: ruleForm.phone
    });

    if (res.status) {
      message("验证码发送成功", { type: "success" });
      // 开始倒计时60秒
      countdown.value = 60;
      countdownInterval.value = setInterval(() => {
        if (countdown.value > 0) {
          countdown.value--;
        } else {
          if (countdownInterval.value) {
            clearInterval(countdownInterval.value);
            countdownInterval.value = null;
          }
        }
      }, 1000);
    } else {
      message(res.message || "验证码发送失败", { type: "error" });
    }
  } catch (error: any) {
    // 尝试从错误响应中提取message
    const errorMessage =
      error?.response?.data?.message || error?.message || "验证码发送失败";
    message(errorMessage, { type: "error" });
    console.error("发送验证码失败:", error);
  } finally {
    isSending.value = false;
  }
};

// 统一登录方法
const onLogin = async () => {
  console.log("onLogin called, activeTab:", activeTab.value); // 调试信息
  const formEl = currentFormRef.value;
  if (!formEl) return;

  // 验证表单
  await formEl.validate(async (valid, fields) => {
    console.log("表单验证结果:", valid, "字段错误:", fields); // 调试信息
    if (valid) {
      loading.value = true;

      try {
        // 构建登录参数
        let loginParams: {
          phone?: string;
          email?: string;
          password?: string;
          phoneOtp?: string;
        } = {};

        if (activeTab.value === "password") {
          // 账号密码登录
          if (accountType.value === "phone") {
            // 手机号+密码登录
            loginParams = {
              phone: ruleForm.account.trim(),
              password: ruleForm.password
            };
          } else if (accountType.value === "email") {
            // 邮箱+密码登录
            loginParams = {
              email: ruleForm.account.trim(),
              password: ruleForm.password
            };
          } else {
            message("请输入正确的邮箱或手机号", { type: "warning" });
            loading.value = false;
            return;
          }
        } else {
          // 短信验证码登录
          loginParams = {
            phone: ruleForm.phone.trim(),
            phoneOtp: ruleForm.smsCode
          };
        }

        console.log("发送登录请求，参数:", loginParams); // 调试信息
        // 调用登录接口
        const res = await useUserStoreHook().loginByUsername(loginParams);

        if (res.status) {
          // 登录成功，获取后端路由并跳转
          await initRouter();
          disabled.value = true;

          await router.push(getTopMenu(true).path);
          message("登录成功", { type: "success" });
          disabled.value = false;
        } else {
          // 显示后端返回的错误信息，如果没有则显示默认错误
          message(res.message || "登录失败", { type: "error" });
        }
      } catch (error: any) {
        // 尝试从错误响应中提取message
        const errorMessage =
          error?.response?.data?.message || error?.message || "登录失败";
        message(errorMessage, { type: "error" });
        console.error("登录失败:", error);
      } finally {
        loading.value = false;
      }
    } else {
      // 验证失败，显示具体的错误信息
      console.log("表单验证失败，详细信息:", fields);
      if (fields) {
        // 显示第一个错误信息
        const firstError = Object.values(fields)[0];
        if (firstError && firstError[0]?.message) {
          message(firstError[0].message, { type: "warning" });
        }
      }
    }
  });
};

const immediateDebounce: any = debounce(() => onLogin(), 1000, true);

// 回车键登录
useEventListener(document, "keydown", ({ code }) => {
  if (
    ["Enter", "NumpadEnter"].includes(code) &&
    !disabled.value &&
    !loading.value
  )
    immediateDebounce();
});

// 组件卸载时清理定时器
onUnmounted(() => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
    countdownInterval.value = null;
  }
});
</script>

<template>
  <div class="select-none">
    <img :src="bg" class="wave" alt="登录背景图" />
    <div class="flex-c absolute right-5 top-3">
      <!-- 主题 -->
      <el-switch
        v-model="dataTheme"
        inline-prompt
        :active-icon="dayIcon"
        :inactive-icon="darkIcon"
        @change="dataThemeChange"
      />
    </div>
    <div class="login-container">
      <div class="img">
        <component :is="toRaw(illustration)" />
      </div>
      <div class="login-box">
        <div class="login-form">
          <avatar class="avatar" />
          <Motion>
            <h2 class="outline-hidden">{{ title }}</h2>
          </Motion>

          <!-- 登录方式切换选项卡 -->
          <Motion :delay="50">
            <el-tabs v-model="activeTab" class="login-tabs" stretch>
              <!-- 账号密码登录 -->
              <el-tab-pane label="账号密码登录" name="password">
                <el-form
                  ref="passwordFormRef"
                  :model="ruleForm"
                  :rules="dynamicRules"
                  size="large"
                >
                  <el-form-item prop="account">
                    <el-input
                      v-model="ruleForm.account"
                      clearable
                      placeholder="邮箱 / 手机号"
                      :prefix-icon="useRenderIcon(User)"
                      @keyup.enter="immediateDebounce"
                    />
                    <div class="text-xs text-gray-500 mt-1">
                      {{
                        accountType === "phone"
                          ? "手机号登录"
                          : accountType === "email"
                            ? "邮箱登录"
                            : ""
                      }}
                    </div>
                  </el-form-item>

                  <el-form-item prop="password">
                    <el-input
                      v-model="ruleForm.password"
                      clearable
                      show-password
                      placeholder="密码"
                      :prefix-icon="useRenderIcon(Lock)"
                      @keyup.enter="immediateDebounce"
                    />
                  </el-form-item>
                </el-form>
              </el-tab-pane>

              <!-- 短信验证码登录 -->
              <el-tab-pane label="短信验证码登录" name="sms">
                <el-form
                  ref="smsFormRef"
                  :model="ruleForm"
                  :rules="dynamicRules"
                  size="large"
                >
                  <el-form-item prop="phone">
                    <el-input
                      v-model="ruleForm.phone"
                      clearable
                      placeholder="手机号"
                      :prefix-icon="useRenderIcon(Phone)"
                      @keyup.enter="immediateDebounce"
                    />
                  </el-form-item>

                  <el-form-item prop="smsCode">
                    <el-input
                      v-model="ruleForm.smsCode"
                      clearable
                      placeholder="短信验证码"
                      :prefix-icon="useRenderIcon(Message)"
                      maxlength="6"
                      @keyup.enter="immediateDebounce"
                    >
                      <template #append>
                        <el-button
                          :disabled="countdown > 0 || isSending"
                          :loading="isSending"
                          @click="sendSmsCode"
                        >
                          {{
                            countdown > 0
                              ? `&nbsp;&nbsp;&nbsp;${countdown}秒后重试&nbsp;&nbsp;&nbsp;`
                              : "&nbsp;&nbsp;&nbsp;获取验证码&nbsp;&nbsp;&nbsp;"
                          }}
                        </el-button>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-form>
              </el-tab-pane>
            </el-tabs>
          </Motion>

          <!-- 登录按钮 -->
          <Motion :delay="250">
            <el-button
              class="w-full mt-4!"
              size="default"
              type="primary"
              :loading="loading"
              :disabled="disabled"
              @click="onLogin"
            >
              登录
            </el-button>
          </Motion>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("@/style/login.css");
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append, .el-input-group__prepend) {
  padding: 0;
}

/* 登录选项卡样式 */
.login-tabs {
  margin-top: 20px;
}

.login-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: var(--el-border-color-light);
}

.login-tabs :deep(.el-tabs__item) {
  height: 48px;
  padding: 0 20px;
  font-size: 16px;
  line-height: 48px;
}

.login-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
}

.login-tabs :deep(.el-tabs__content) {
  padding: 20px 0;
}

/* 验证码按钮样式 */
:deep(.el-input-group__append) {
  .el-button {
    height: 40px;
    padding: 0 12px;
    font-size: 14px;
    line-height: 40px;
  }
}

/* 账号类型提示 */
.text-xs {
  font-size: 12px;
}
</style>
