import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("behave-graph", "routes/behave-graph.tsx"),
] satisfies RouteConfig;
