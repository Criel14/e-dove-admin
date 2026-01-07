export default {
  path: "/admin",
  redirect: "/admin",
  meta: {
    icon: "ic:round-list",
    title: "管理页面",
    rank: 9
  },
  children: [
    {
      path: "/admin/store",
      name: "store",
      component: () => import("@/views/admin/store.vue"),
      meta: {
        title: "门店管理"
      }
    },
    {
      path: "/admin/shelf",
      name: "shelf",
      component: () => import("@/views/admin/shelf.vue"),
      meta: {
        title: "货架管理"
      }
    },
    {
      path: "/admin/parcel",
      name: "parcel",
      component: () => import("@/views/admin/parcel.vue"),
      meta: {
        title: "包裹管理"
      }
    }
  ]
} satisfies RouteConfigsTable;
