import { http } from "@/utils/http";

// 原有类型定义（用于模拟接口，保持兼容性）
export type UserResult = {
  status: boolean;
  data: {
    /** 头像 */
    avatar: string;
    /** 用户名 */
    username: string;
    /** 昵称 */
    nickname: string;
    /** 当前登录用户的角色 */
    roles: Array<string>;
    /** 按钮级别权限 */
    permissions: Array<string>;
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
  message?: string; // 错误消息
};

export type RefreshTokenResult = {
  status: boolean;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

// 新的类型定义（用于实际后端接口）
export type SignInResult = {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 用户ID */
  userId: string;
  /** 用户名 */
  username: string;
  /** 角色列表（TODO: 后端暂未实现，预留字段） */
  roleNames: string[];
  /** 权限代码列表（TODO: 后端暂未实现，预留字段） */
  permissionCodes: string[];
};

export type SignInResponse = {
  status: boolean;
  data: SignInResult;
  message?: string; // 错误消息
};

export type OtpResponse = {
  status: boolean;
  message?: string;
};

/** 统一登录接口（支持邮箱/手机号+密码 或 手机号+验证码） */
export const signIn = (data?: {
  phone?: string;
  email?: string;
  password?: string;
  phoneOtp?: string;
}) => {
  // 注意：后端接口地址是 "/auth/sign-in"
  // 参数说明：
  // - phone: 手机号（短信登录时必填，账号密码登录时可选）
  // - email: 邮箱（账号密码登录时可选）
  // - password: 密码（账号密码登录时必填）
  // - phoneOtp: 短信验证码（短信登录时必填）
  // 后端会根据哪些字段为空来判断登录方式
  return http.request<SignInResponse>("post", "/auth/sign-in", { data });
};

/** 发送短信验证码 */
export const sendOtp = (data: { phoneOrEmail: string }) => {
  // 注意：后端接口地址是 "/auth/otp"
  // 参数：phoneOrEmail - 手机号或邮箱（根据后端需求，目前只需要手机号）
  // 响应：没有数据，只有成功状态
  return http.request<OtpResponse>("post", "/auth/otp", { data });
};

/** 原有登录接口（保持兼容，可能用于模拟数据） */
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", "/login", { data });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", "/auth/refresh", { data });
};

/** 注册接口 */
export const register = (data?: {
  username?: string;
  password?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string | null;
  phoneOtp?: string;
  emailOtp?: string;
}) => {
  // 注意：后端接口地址是 "/auth/register"
  // 参数说明：
  // - username: 用户名（可选）
  // - password: 密码（可选）
  // - phone: 手机号（必填）
  // - email: 邮箱（可选）
  // - avatarUrl: 头像地址（可选，TODO: 暂时固定为null）
  // - phoneOtp: 手机验证码（必填）
  // - emailOtp: 邮箱验证码（可选）
  // 响应数据与登录接口相同（注册成功后自动登录）
  return http.request<SignInResponse>("post", "/auth/register", { data });
};
