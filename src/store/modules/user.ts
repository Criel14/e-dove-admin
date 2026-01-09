import { defineStore } from "pinia";
import {
  type userType,
  store,
  router,
  resetRouter,
  routerArrays,
  storageLocal
} from "../utils";
import {
  type UserResult,
  type RefreshTokenResult,
  type SignInResponse,
  type OtpResponse,
  getLogin,
  refreshTokenApi,
  signIn,
  sendOtp
} from "@/api/user";
import { useMultiTagsStoreHook } from "./multiTags";
import { type DataInfo, setToken, removeToken, userKey } from "@/utils/auth";

export const useUserStore = defineStore("pure-user", {
  state: (): userType => ({
    // 头像
    avatar: storageLocal().getItem<DataInfo<number>>(userKey)?.avatar ?? "",
    // 用户名
    username: storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? "",
    // 昵称
    nickname: storageLocal().getItem<DataInfo<number>>(userKey)?.nickname ?? "",
    // 页面级别权限
    roles: storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [],
    // 按钮级别权限
    permissions:
      storageLocal().getItem<DataInfo<number>>(userKey)?.permissions ?? [],
    // 是否勾选了登录页的免登录
    isRemembered: false,
    // 登录页的免登录存储几天，默认7天
    loginDay: 7
  }),
  actions: {
    /** 存储头像 */
    SET_AVATAR(avatar: string) {
      this.avatar = avatar;
    },
    /** 存储用户名 */
    SET_USERNAME(username: string) {
      this.username = username;
    },
    /** 存储昵称 */
    SET_NICKNAME(nickname: string) {
      this.nickname = nickname;
    },
    /** 存储角色 */
    SET_ROLES(roles: Array<string>) {
      this.roles = roles;
    },
    /** 存储按钮级别权限 */
    SET_PERMS(permissions: Array<string>) {
      this.permissions = permissions;
    },
    /** 存储是否勾选了登录页的免登录 */
    SET_ISREMEMBERED(bool: boolean) {
      this.isRemembered = bool;
    },
    /** 设置登录页的免登录存储几天 */
    SET_LOGINDAY(value: number) {
      this.loginDay = Number(value);
    },
    /** 登入（兼容新旧接口） */
    async loginByUsername(data: {
      phone?: string;
      email?: string;
      password?: string;
      phoneOtp?: string;
      username?: string; // 兼容旧参数
    }) {
      // 判断是否是旧版调用（包含username字段，没有phone和email字段）
      const hasUsername = data.username && !data.phone && !data.email;

      if (hasUsername) {
        // 旧版模拟登录，调用mock接口
        return new Promise<UserResult>((resolve, reject) => {
          getLogin(data)
            .then(data => {
              if (data?.status) setToken(data.data);
              resolve(data);
            })
            .catch(error => {
              reject(error);
            });
        });
      } else {
        // 新版统一登录接口
        return new Promise<SignInResponse>((resolve, reject) => {
          signIn(data)
            .then(response => {
              if (response?.status) {
                // 将后端返回的用户信息转换为token存储格式
                // 注意：setToken需要expires字段，但后端未返回，这里设置为0表示会话cookie
                // 如果需要持久化登录，可以设置一个未来的时间戳（如24小时后）
                const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期
                const tokenData = {
                  accessToken: response.data.accessToken,
                  refreshToken: response.data.refreshToken,
                  expires: expires, // 设置为Date对象，setToken会将其转换为时间戳
                  // 用户信息字段
                  username: response.data.username,
                  avatar: "", // 后端未返回头像，留空
                  nickname: "", // 后端未返回昵称，留空
                  roles: response.data.roleNames || [],
                  permissions: response.data.permissionCodes || []
                };
                setToken(tokenData);

                // 更新store中的用户信息
                this.SET_USERNAME(response.data.username);
                this.SET_ROLES(response.data.roleNames || []);
                this.SET_PERMS(response.data.permissionCodes || []);
              }
              resolve(response);
            })
            .catch(error => {
              reject(error);
            });
        });
      }
    },

    /** 发送短信/邮箱验证码 */
    async sendOtpCode(data: { phoneOrEmail: string }) {
      return new Promise<OtpResponse>((resolve, reject) => {
        sendOtp(data)
          .then(response => {
            resolve(response);
          })
          .catch(error => {
            reject(error);
          });
      });
    },
    /** 前端登出（不调用接口） */
    logOut() {
      this.username = "";
      this.roles = [];
      this.permissions = [];
      removeToken();
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    },
    /** 刷新`token` */
    async handRefreshToken(data) {
      return new Promise<RefreshTokenResult>((resolve, reject) => {
        refreshTokenApi(data)
          .then(data => {
            if (data) {
              setToken(data.data);
              resolve(data);
            }
          })
          .catch(error => {
            reject(error);
          });
      });
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
