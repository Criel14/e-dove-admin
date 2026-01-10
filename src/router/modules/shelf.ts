const Layout = () => import("@/layout/index.vue");

export default {
  path: "/",
  name: "Shelf",
  component: Layout,
  redirect: "/shelf",
  meta: {
    icon: "lsicon:shelf-outline",
    title: "货架管理",
    rank: 0
  },
  children: [
    {
      path: "/shelf",
      name: "Shelf",
      component: () => import("@/views/shelf/index.vue"),
      meta: {
        title: "货架管理"
      }
    }
  ]
} satisfies RouteConfigsTable;
