import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 密码正则（密码长度大于等于6位即可） */
export const REGEXP_PWD = /^.{6,}$/;

/** 手机号正则（中国大陆手机号） */
export const REGEXP_PHONE = /^1[3-9]\d{9}$/;

/** 邮箱正则 */
export const REGEXP_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** 验证码正则（6位数字） */
export const REGEXP_SMS_CODE = /^\d{6}$/;

/** 登录校验 */
const loginRules = reactive<FormRules>({
  // 账号（邮箱或手机号） - 用于账号密码登录
  account: [
    {
      required: true,
      message: "请输入邮箱或手机号",
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error("请输入邮箱或手机号"));
        } else if (REGEXP_PHONE.test(value) || REGEXP_EMAIL.test(value)) {
          callback();
        } else {
          callback(new Error("请输入正确的邮箱或手机号"));
        }
      },
      trigger: "blur"
    }
  ],

  // 密码验证（账号密码登录使用）
  password: [
    {
      validator: (rule, value, callback) => {
        // 当使用账号密码登录时才验证密码
        if (value === "") {
          callback(new Error("请输入密码"));
        } else if (!REGEXP_PWD.test(value)) {
          callback(new Error("密码长度应大于等于6位"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],

  // 手机号验证（仅短信登录使用）
  phone: [
    {
      required: true,
      message: "请输入手机号",
      trigger: "blur"
    },
    {
      pattern: REGEXP_PHONE,
      message: "请输入正确的手机号",
      trigger: "blur"
    }
  ],

  // 短信验证码验证
  smsCode: [
    {
      required: true,
      message: "请输入验证码",
      trigger: "blur"
    },
    {
      pattern: REGEXP_SMS_CODE,
      message: "验证码为6位数字",
      trigger: "blur"
    }
  ]
});

export { loginRules };
