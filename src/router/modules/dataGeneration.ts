const { VITE_HIDE_HOME } = import.meta.env;
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/",
  name: "DataGeneration",
  component: Layout,
  redirect: "/data-generation",
  meta: {
    icon: "material-symbols:data-table-outline-rounded",
    title: "数据生成",
    rank: 4
  },
  children: [
    {
      path: "/data-generation",
      name: "data-generation",
      component: () => import("@/views/data-generation/index.vue"),
      meta: {
        title: "数据生成",
        showLink: VITE_HIDE_HOME === "true" ? false : true
      }
    }
  ]
} satisfies RouteConfigsTable;
