import { http } from "@/utils/http";

/** 门店信息 */
export type StoreInfo = {
  /** 门店ID */
  id: number;
  /** 门店管理员用户ID（不需要显示） */
  managerUserId: number;
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

/** 获取当前用户所属门店信息 */
export const getMyStore = () => {
  // GET "/store/my" 接口，不需要请求参数
  return http.request<StoreInfoResponse>("get", "/store/my");
};
