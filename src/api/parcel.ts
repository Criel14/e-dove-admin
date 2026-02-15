import { http } from "@/utils/http";

/** 包裹信息 */
export type ParcelInfo = {
  /** 包裹唯一 ID */
  id: string;
  /** 快递运单号 */
  trackingNumber: string;
  /** 收件人手机号 */
  recipientPhone: string;
  /** 收件人省 */
  recipientAddrProvince: string;
  /** 收件人市 */
  recipientAddrCity: string;
  /** 收件人区/县 */
  recipientAddrDistrict: string;
  /** 详细地址 */
  recipientAddrDetail: string;
  /** 包裹宽度（cm） */
  width: number;
  /** 包裹高度（cm） */
  height: number;
  /** 包裹长度（cm） */
  length: number;
  /** 包裹重量（kg） */
  weight: number;
  /** 送至门店 ID */
  storeId: number;
  /** 取件码，格式为货架编号-货架层编号-取件码，例如 3-1-3001 */
  pickCode: string;
  /** 包裹状态，0=未入库，1=已入库，2=已取出，3=滞留，4=退回 */
  status: number;
  /** 入库时间 */
  inTime: string | null;
  /** 出库/取件时间 */
  outTime: string | null;
};

/** 包裹分页列表响应 */
export type ParcelPageResponse = {
  status: boolean;
  data: {
    list: ParcelInfo[];
    total: number;
  };
  message?: string;
};

/** 包裹分页查询请求参数 */
export type ParcelPageRequest = {
  pageNum: number;
  pageSize: number;
  status?: number;
  trackingNumber?: string;
  recipientPhone?: string;
  timeType?: "inTime" | "outTime";
  startTime?: string;
  endTime?: string;
};

/** 获取包裹分页列表 */
export const getParcelPage = (params: ParcelPageRequest) => {
  return http.request<ParcelPageResponse>("get", "/api/parcel/admin/info", {
    params
  });
};

/** 生成包裹请求参数 */
export type GenerateParcelRequest = {
  count: number;
};

/** 生成包裹响应 */
export type GenerateParcelResponse = {
  status: boolean;
  message?: string;
};

/** 生成包裹 */
export const generateParcels = (data: GenerateParcelRequest) => {
  return http.request<GenerateParcelResponse>("post", "/api/parcel/generate", {
    params: data
  });
};

/** 包裹入库请求参数 */
export type ParcelInRequest = {
  trackingNumber: string;
};

/** 包裹入库响应 */
export type ParcelInResponse = {
  status: boolean;
  message?: string;
};

/** 包裹入库 */
export const parcelIn = (data: ParcelInRequest) => {
  return http.request<ParcelInResponse>("post", "/api/parcel/in", {
    data
  });
};

/** 包裹出库请求参数 */
export type ParcelOutRequest = {
  trackingNumber: string;
  recipientPhone: string;
};

/** 包裹出库响应 */
export type ParcelOutResponse = {
  status: boolean;
  message?: string;
};

/** 包裹出库 */
export const parcelOut = (data: ParcelOutRequest) => {
  return http.request<ParcelOutResponse>("post", "/api/parcel/out", {
    data
  });
};

export type MachineParcelOutRequest = {
  identityCode: string;
  trackingNumber: string;
};

export type MachineParcelOutResponse = {
  status: boolean;
  data: {
    remaining: number;
  };
  message?: string;
};

export const machineParcelOut = (data: MachineParcelOutRequest) => {
  return http.request<MachineParcelOutResponse>("post", "/api/parcel/out", {
    data
  });
};
