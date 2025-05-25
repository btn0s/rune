import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("behave-graph", "routes/behave-graph.tsx"),
  // Project-centric studio routes
  route("studio", "routes/studio/_index.tsx"),
  route("studio/dashboard", "routes/studio/dashboard.tsx"),
  route("studio/new", "routes/studio/new.tsx"),
  route("studio/:projectId", "routes/studio/$projectId.tsx"),
] satisfies RouteConfig;
