import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import { getToken, formatToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  // API基础URL，开发环境下使用代理，所以设为空字符串，生产环境可配置实际URL
  baseURL: import.meta.env.PROD ? import.meta.env.VITE_API_URL : "",
  // 请求超时时间
  timeout: 10000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** `token`过期后，暂存待执行的请求 */
  private static requests = [];

  /** 防止重复刷新`token` */
  private static isRefreshing = false;

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前`Axios`实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 重连原始请求 */
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise(resolve => {
      PureHttp.requests.push((token: string) => {
        config.headers["Authorization"] = formatToken(token);
        resolve(config);
      });
    });
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }
        /** 请求白名单，放置一些不需要`token`的接口（通过设置请求白名单，防止`token`过期后再请求造成的死循环问题） */
        const whiteList = [
          "/auth/refresh",
          "/login",
          "/auth/sign-in",
          "/auth/otp"
        ];
        return whiteList.some(url => config.url.endsWith(url))
          ? config
          : new Promise(resolve => {
              const data = getToken();
              if (data && data.accessToken) {
                config.headers["Authorization"] = formatToken(data.accessToken);
              }
              resolve(config);
            });
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        const $config = response.config;
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }
        return response.data;
      },
      async (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);

        // 处理401未授权错误（token过期）
        if ($error.response?.status === 401) {
          const originalRequest = $error.config;
          const url = originalRequest?.url || "";

          // 排除刷新token接口本身，避免死循环
          if (url.endsWith("/auth/refresh")) {
            // 刷新token也过期，需要重新登录
            useUserStoreHook().logOut();
            // 可以跳转到登录页或提示用户重新登录
            return Promise.reject($error);
          }

          // 获取当前的refreshToken
          const tokenData = getToken();
          if (!tokenData || !tokenData.refreshToken) {
            // 没有refreshToken，需要重新登录
            useUserStoreHook().logOut();
            return Promise.reject($error);
          }

          // 如果正在刷新中，将当前请求加入队列
          if (PureHttp.isRefreshing) {
            return PureHttp.retryOriginalRequest(originalRequest);
          }

          // 开始刷新token
          PureHttp.isRefreshing = true;

          try {
            // 调用刷新token接口
            const res = await useUserStoreHook().handRefreshToken({
              refreshToken: tokenData.refreshToken
            });

            if (res?.status) {
              const newAccessToken = res.data.accessToken;
              // 更新请求头中的Authorization
              originalRequest.headers["Authorization"] =
                formatToken(newAccessToken);
              // 执行所有等待的请求
              PureHttp.requests.forEach(cb => cb(newAccessToken));
              PureHttp.requests = [];
              // 重试原始请求
              return PureHttp.axiosInstance(originalRequest);
            } else {
              // 刷新失败，需要重新登录
              useUserStoreHook().logOut();
              return Promise.reject($error);
            }
          } catch (refreshError) {
            // 刷新失败，需要重新登录
            useUserStoreHook().logOut();
            return Promise.reject(refreshError);
          } finally {
            PureHttp.isRefreshing = false;
          }
        }

        // 其他的响应异常
        return Promise.reject($error);
      }
    );
  }

  /** 通用请求工具函数 */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    // 单独处理自定义请求/响应回调
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: undefined) => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /** 单独抽离的`post`工具函数 */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  /** 单独抽离的`get`工具函数 */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }
}

export const http = new PureHttp();
