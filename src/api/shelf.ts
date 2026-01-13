import { http } from "@/utils/http";

/** 货架层信息 */
export type ShelfLayerVO = {
  /** 货架层ID */
  id: string;
  /** 层号编号（从1开始） */
  layerNo: number;
  /** 当天最大序号，用于取件码序列（每日重置） */
  todayMaxSeq: number;
  /** 最大编号上限 / 最多可存放包裹数量 */
  maxCapacity: number;
};

/** 货架信息 */
export type ShelfVO = {
  /** 货架ID */
  id: string;
  /** 所属门店ID（字符串序列化），表示该货架归属的门店 */
  storeId: string;
  /** 门店内部货架编号（整数），用于门店内货架排序或标识 */
  shelfNo: number;
  /** 货架总层数，表示该货架有多少层 */
  layerCount: number;
  /** 货架可放包裹最大宽度（cm），数值类型 */
  maxWidth: number;
  /** 货架可放包裹最大高度（cm），数值类型 */
  maxHeight: number;
  /** 货架可放包裹最大长度（cm），数值类型 */
  maxLength: number;
  /** 货架可承受最大重量（kg），数值类型 */
  maxWeight: number;
  /** 货架状态（整型）：1=正常、0=停用或维修等 */
  status: number;
  /** 货架层列表 */
  shelfLayers: ShelfLayerVO[];
};

/** 货架分页列表响应 */
export type ShelfPageResponse = {
  status: boolean;
  data: {
    list: ShelfVO[];
    total: number;
  };
  message?: string;
};

/** 货架分页查询参数 */
export type ShelfPageParams = {
  pageNum: number;
  pageSize: number;
  /** 可选的搜索参数，可根据需要扩展 */
  shelfNo?: number;
  status?: number;
  storeId?: string;
};

/** 获取货架分页列表 */
export const getShelfPage = (params: ShelfPageParams) => {
  return http.request<ShelfPageResponse>("get", "/api/shelf/query", { params });
};

/** 创建货架请求参数（可根据需要扩展） */
export type CreateShelfRequest = {
  id?: string | null;
  storeId?: string | null;
  shelfNo?: number | null;
  layerCount: number;
  maxWidth: number;
  maxHeight: number;
  maxLength: number;
  maxWeight: number;
  status: number;
  /** 货架层配置（可选） */
  shelfLayers?: Omit<ShelfLayerVO, "id">[];
};

/** 创建货架响应 */
export type CreateShelfResponse = {
  status: boolean;
  message?: string;
  data?: {
    id: string;
  };
};

/** 更新货架请求参数 */
export type UpdateShelfRequest = {
  id: string;
  storeId?: string;
  shelfNo?: number;
  layerCount?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxLength?: number;
  maxWeight?: number;
  status?: number;
};

/** 更新货架响应 */
export type UpdateShelfResponse = {
  status: boolean;
  message?: string;
};

/** 删除货架响应 */
export type DeleteShelfResponse = {
  status: boolean;
  message?: string;
};

/** 创建货架 */
export const createShelf = (data: CreateShelfRequest) => {
  return http.request<CreateShelfResponse>("post", "/api/shelf/create", {
    data
  });
};

/** 更新货架 */
export const updateShelf = (data: UpdateShelfRequest) => {
  return http.request<UpdateShelfResponse>("put", "/api/shelf/update", {
    data
  });
};

/** 删除货架 */
export const deleteShelf = (id: string) => {
  return http.request<DeleteShelfResponse>("delete", `/api/shelf/delete/${id}`);
};

/** 更新货架状态 */
export const updateShelfStatus = (data: { id: string; status: number }) => {
  return http.request<UpdateShelfResponse>("patch", "/api/shelf/status", {
    data
  });
};
