import { commandRegistry } from "./index";

// ─── Get Local Components ─────────────────────────────────────────────────────

commandRegistry.set("get_local_components", async () => {
  const components = figma.root.findAllWithCriteria({
    types: ["COMPONENT"],
  });

  return {
    count: components.length,
    components: components.map((component) => ({
      id: component.id,
      name: component.name,
      key: (component as ComponentNode).key,
      description: (component as ComponentNode).description || "",
      parent: component.parent
        ? { id: component.parent.id, name: component.parent.name }
        : undefined,
    })),
  };
});
