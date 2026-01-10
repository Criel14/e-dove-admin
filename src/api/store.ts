import { http } from "@/utils/http";

/** 门店信息 */
export type StoreInfo = {
  /** 门店ID */
  id: string;
  /** 门店管理员用户ID（不需要显示） */
  managerUserId: string;
  /** 门店管理员手机号 */
  managerPhone: string;
  /** 门店名称 */
  storeName: string;
  /** 省份 */
  addrProvince: string;
  /** 城市 */
  addrCity: string;
  /** 区县 */
  addrDistrict: string;
  /** 详细地址 */
  addrDetail: string;
  /** 门店状态：1=营业、2=休息、3=注销 */
  status: number;
};

/** 门店信息响应 */
export type StoreInfoResponse = {
  status: boolean;
  data: StoreInfo;
  message?: string;
};

/** 门店列表项 */
export type StoreListItem = {
  id: string;
  managerUserId: string;
  managerPhone: string;
  storeName: string;
  addrProvince: string;
  addrCity: string;
  addrDistrict: string;
  addrDetail: string;
  status: number;
};

/** 门店分页列表响应 */
export type StorePageResponse = {
  status: boolean;
  data: {
    list: StoreListItem[];
    total: number;
  };
  message?: string;
};

/** 绑定门店请求参数 */
export type BindStoreRequest = {
  storeId: string;
};

/** 绑定门店响应 */
export type BindStoreResponse = {
  status: boolean;
  message?: string;
};

/** 解绑门店响应 */
export type UnbindStoreResponse = {
  status: boolean;
  message?: string;
};

/** 获取当前用户所属门店信息 */
export const getMyStore = () => {
  // GET "/store/my" 接口，不需要请求参数
  return http.request<StoreInfoResponse>("get", "/api/store/my");
};

/** 获取门店分页列表 */
export const getStorePage = (params: {
  pageNum: number;
  pageSize: number;
  storeName?: string;
}) => {
  return http.request<StorePageResponse>("get", "/api/store/page", { params });
};

/** 绑定门店 */
export const bindStore = (storeId: string) => {
  return http.request<BindStoreResponse>("post", "/api/store/bind", {
    data: { storeId }
  });
};

/** 解绑门店 */
export const unbindStore = (storeId: string) => {
  return http.request<UnbindStoreResponse>("post", "/api/store/unbind", {
    data: { storeId }
  });
};
