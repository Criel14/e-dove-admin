const Layout = () => import("@/layout/index.vue");

export default {
  path: "/",
  name: "Machine",
  component: Layout,
  redirect: "/machine",
  meta: {
    icon: "solar:camera-square-broken",
    title: "驿站机器",
    rank: 5
  },
  children: [
    {
      path: "/machine",
      name: "MachinePage",
      component: () => import("@/views/machine/index.vue"),
      meta: {
        title: "驿站机器"
      }
    }
  ]
} satisfies RouteConfigsTable;
