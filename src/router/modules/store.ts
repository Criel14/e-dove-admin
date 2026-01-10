const Layout = () => import("@/layout/index.vue");

export default {
  path: "/",
  name: "Store",
  component: Layout,
  redirect: "/store",
  meta: {
    icon: "ic:outline-store",
    title: "门店管理",
    rank: 0
  },
  children: [
    {
      path: "/store",
      name: "Store",
      component: () => import("@/views/store/index.vue"),
      meta: {
        title: "门店管理"
      }
    }
  ]
} satisfies RouteConfigsTable;
