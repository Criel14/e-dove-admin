const Layout = () => import("@/layout/index.vue");

export default {
  path: "/",
  name: "Parcel",
  component: Layout,
  redirect: "/parcel",
  meta: {
    icon: "lets-icons:package-box-close",
    title: "包裹管理",
    rank: 0
  },
  children: [
    {
      path: "/parcel",
      name: "Parcel",
      component: () => import("@/views/parcel/index.vue"),
      meta: {
        title: "包裹管理"
      }
    }
  ]
} satisfies RouteConfigsTable;
