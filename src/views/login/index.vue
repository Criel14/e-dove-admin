<script setup lang="ts">
import Motion from "./utils/motion";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import {
  loginRules,
  registerRules,
  REGEXP_PHONE,
  REGEXP_EMAIL
} from "./utils/rule"; // 导入验证规则和正则
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
const registerFormRef = ref<FormInstance>();

// 登录方式切换（password: 账号密码登录, sms: 短信验证码登录）
const activeTab = ref<"password" | "sms">("password");

// 注册模式切换（false: 登录模式, true: 注册模式）
const isRegisterMode = ref(false);

// 短信验证码倒计时
const countdown = ref(0);
const countdownInterval = ref<NodeJS.Timeout | null>(null);
const isSending = ref(false);

// 注册验证码倒计时
const phoneOtpCountdown = ref(0);
const phoneOtpCountdownInterval = ref<NodeJS.Timeout | null>(null);
const isSendingPhoneOtp = ref(false);
const emailOtpCountdown = ref(0);
const emailOtpCountdownInterval = ref<NodeJS.Timeout | null>(null);
const isSendingEmailOtp = ref(false);

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

// 注册表单数据
const registerForm = reactive({
  username: "", // 用户名（可选）
  password: "", // 密码（可选）
  phone: "", // 手机号（必填）
  email: "", // 邮箱（可选）
  phoneOtp: "", // 手机验证码（必填）
  emailOtp: "" // 邮箱验证码（可选）
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
  if (isRegisterMode.value) {
    // 注册模式：使用注册验证规则
    return registerRules;
  } else if (activeTab.value === "password") {
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
  if (isRegisterMode.value) {
    return registerFormRef.value;
  } else {
    return activeTab.value === "password"
      ? passwordFormRef.value
      : smsFormRef.value;
  }
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

// 发送注册手机验证码
const sendRegisterPhoneOtp = async () => {
  // 验证手机号格式
  if (!registerForm.phone) {
    message("请输入手机号", { type: "warning" });
    return;
  }

  if (!REGEXP_PHONE.test(registerForm.phone)) {
    message("手机号格式不正确", { type: "warning" });
    return;
  }

  isSendingPhoneOtp.value = true;

  try {
    // 调用发送验证码接口
    const res = await useUserStoreHook().sendOtpCode({
      phoneOrEmail: registerForm.phone
    });

    if (res.status) {
      message("验证码发送成功", { type: "success" });
      // 开始倒计时60秒
      phoneOtpCountdown.value = 60;
      phoneOtpCountdownInterval.value = setInterval(() => {
        if (phoneOtpCountdown.value > 0) {
          phoneOtpCountdown.value--;
        } else {
          if (phoneOtpCountdownInterval.value) {
            clearInterval(phoneOtpCountdownInterval.value);
            phoneOtpCountdownInterval.value = null;
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
    isSendingPhoneOtp.value = false;
  }
};

// 发送注册邮箱验证码
const sendRegisterEmailOtp = async () => {
  // 验证邮箱格式
  if (!registerForm.email) {
    message("请输入邮箱", { type: "warning" });
    return;
  }

  if (!REGEXP_EMAIL.test(registerForm.email)) {
    message("邮箱格式不正确", { type: "warning" });
    return;
  }

  isSendingEmailOtp.value = true;

  try {
    // 调用发送验证码接口
    const res = await useUserStoreHook().sendOtpCode({
      phoneOrEmail: registerForm.email
    });

    if (res.status) {
      message("验证码发送成功", { type: "success" });
      // 开始倒计时60秒
      emailOtpCountdown.value = 60;
      emailOtpCountdownInterval.value = setInterval(() => {
        if (emailOtpCountdown.value > 0) {
          emailOtpCountdown.value--;
        } else {
          if (emailOtpCountdownInterval.value) {
            clearInterval(emailOtpCountdownInterval.value);
            emailOtpCountdownInterval.value = null;
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
    isSendingEmailOtp.value = false;
  }
};

// 统一登录/注册方法
const onLogin = async () => {
  console.log(
    "onLogin called, isRegisterMode:",
    isRegisterMode.value,
    "activeTab:",
    activeTab.value
  ); // 调试信息
  const formEl = currentFormRef.value;
  if (!formEl) return;

  // 验证表单
  await formEl.validate(async (valid, fields) => {
    console.log("表单验证结果:", valid, "字段错误:", fields); // 调试信息
    if (valid) {
      loading.value = true;

      try {
        if (isRegisterMode.value) {
          // 注册逻辑
          const registerParams = {
            username: registerForm.username.trim() || undefined,
            password: registerForm.password.trim() || undefined,
            phone: registerForm.phone.trim(),
            email: registerForm.email.trim() || undefined,
            avatarUrl: null as string | null, // TODO: 头像地址暂时固定为null
            phoneOtp: registerForm.phoneOtp.trim(),
            emailOtp: registerForm.emailOtp.trim() || undefined
          };

          console.log("发送注册请求，参数:", registerParams);
          // 调用注册接口
          const res = await useUserStoreHook().register(registerParams);

          if (res.status) {
            // 注册成功，自动登录，获取后端路由并跳转
            await initRouter();
            disabled.value = true;

            await router.push(getTopMenu(true).path);
            message("注册成功", { type: "success" });
            disabled.value = false;
          } else {
            // 显示后端返回的错误信息，如果没有则显示默认错误
            message(res.message || "注册失败", { type: "error" });
          }
        } else {
          // 登录逻辑
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
        }
      } catch (error: any) {
        // 尝试从错误响应中提取message
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          (isRegisterMode.value ? "注册失败" : "登录失败");
        message(errorMessage, { type: "error" });
        console.error(isRegisterMode.value ? "注册失败:" : "登录失败:", error);
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
  if (phoneOtpCountdownInterval.value) {
    clearInterval(phoneOtpCountdownInterval.value);
    phoneOtpCountdownInterval.value = null;
  }
  if (emailOtpCountdownInterval.value) {
    clearInterval(emailOtpCountdownInterval.value);
    emailOtpCountdownInterval.value = null;
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

          <!-- 登录模式 -->
          <template v-if="!isRegisterMode">
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

            <!-- 切换到注册链接 -->
            <Motion :delay="300">
              <div class="text-center mt-4 text-sm text-gray-600">
                没有账户？
                <a
                  href="javascript:void(0);"
                  class="!text-blue-500 !hover:text-blue-700 cursor-pointer"
                  @click="isRegisterMode = true"
                >
                  免费注册
                </a>
              </div>
            </Motion>
          </template>

          <!-- 注册模式 -->
          <template v-else>
            <!-- 注册表单 -->
            <Motion :delay="50">
              <el-form
                ref="registerFormRef"
                :model="registerForm"
                :rules="dynamicRules"
                size="large"
              >
                <!-- 用户名（可选） -->
                <el-form-item prop="username">
                  <el-input
                    v-model="registerForm.username"
                    clearable
                    placeholder="用户名（可选）"
                    :prefix-icon="useRenderIcon(User)"
                    @keyup.enter="immediateDebounce"
                  />
                  <div class="text-xs text-gray-500 mt-1">
                    可选，如果不填写系统将使用默认用户名
                  </div>
                </el-form-item>

                <!-- 密码（可选） -->
                <el-form-item prop="password">
                  <el-input
                    v-model="registerForm.password"
                    clearable
                    show-password
                    placeholder="密码（可选，至少6位）"
                    :prefix-icon="useRenderIcon(Lock)"
                    @keyup.enter="immediateDebounce"
                  />
                  <div class="text-xs text-gray-500 mt-1">
                    可选，如果不填写将使用手机验证码作为登录方式
                  </div>
                </el-form-item>

                <!-- 手机号（必填） -->
                <el-form-item prop="phone">
                  <el-input
                    v-model="registerForm.phone"
                    clearable
                    placeholder="手机号（必填）"
                    :prefix-icon="useRenderIcon(Phone)"
                    @keyup.enter="immediateDebounce"
                  />
                </el-form-item>

                <!-- 手机验证码（必填） -->
                <el-form-item prop="phoneOtp">
                  <el-input
                    v-model="registerForm.phoneOtp"
                    clearable
                    placeholder="手机验证码（必填）"
                    :prefix-icon="useRenderIcon(Message)"
                    maxlength="6"
                    @keyup.enter="immediateDebounce"
                  >
                    <template #append>
                      <el-button
                        :disabled="phoneOtpCountdown > 0 || isSendingPhoneOtp"
                        :loading="isSendingPhoneOtp"
                        @click="sendRegisterPhoneOtp"
                      >
                        {{
                          phoneOtpCountdown > 0
                            ? `&nbsp;&nbsp;&nbsp;${phoneOtpCountdown}秒后重试&nbsp;&nbsp;&nbsp;`
                            : "&nbsp;&nbsp;&nbsp;获取验证码&nbsp;&nbsp;&nbsp;"
                        }}
                      </el-button>
                    </template>
                  </el-input>
                </el-form-item>

                <!-- 邮箱（可选） -->
                <el-form-item prop="email">
                  <el-input
                    v-model="registerForm.email"
                    clearable
                    placeholder="邮箱（可选）"
                    :prefix-icon="useRenderIcon(User)"
                    @keyup.enter="immediateDebounce"
                  />
                </el-form-item>

                <!-- 邮箱验证码（可选） -->
                <el-form-item prop="emailOtp">
                  <el-input
                    v-model="registerForm.emailOtp"
                    clearable
                    placeholder="邮箱验证码（可选）"
                    :prefix-icon="useRenderIcon(Message)"
                    maxlength="6"
                    @keyup.enter="immediateDebounce"
                  >
                    <template #append>
                      <el-button
                        :disabled="emailOtpCountdown > 0 || isSendingEmailOtp"
                        :loading="isSendingEmailOtp"
                        @click="sendRegisterEmailOtp"
                      >
                        {{
                          emailOtpCountdown > 0
                            ? `&nbsp;&nbsp;&nbsp;${emailOtpCountdown}秒后重试&nbsp;&nbsp;&nbsp;`
                            : "&nbsp;&nbsp;&nbsp;获取验证码&nbsp;&nbsp;&nbsp;"
                        }}
                      </el-button>
                    </template>
                  </el-input>
                </el-form-item>
              </el-form>
            </Motion>

            <!-- 注册按钮 -->
            <Motion :delay="250">
              <el-button
                class="w-full mt-4!"
                size="default"
                type="primary"
                :loading="loading"
                :disabled="disabled"
                @click="onLogin"
              >
                注册
              </el-button>
            </Motion>

            <!-- 切换到登录链接 -->
            <Motion :delay="300">
              <div class="text-center mt-4 text-sm text-gray-600">
                已有账户？
                <a
                  href="javascript:void(0);"
                  class="!text-blue-500 !hover:text-blue-700 cursor-pointer"
                  @click="isRegisterMode = false"
                >
                  前去登录
                </a>
              </div>
            </Motion>
          </template>
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
