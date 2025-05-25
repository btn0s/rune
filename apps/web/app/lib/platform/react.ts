import type {
  IReactPlatform,
  ComponentDefinition,
  ComponentInstance,
  ComponentProperty,
  EventHandler,
  PlatformEvent,
} from "./types";

export class ReactPlatform implements IReactPlatform {
  name = "react";
  version = "18.0.0";

  private components = new Map<string, ComponentInstance>();
  private eventHandlers = new Map<string, Map<string, EventHandler[]>>();
  private nextId = 1;

  async initialize(): Promise<void> {
    // Initialize React platform
    console.log("React platform initialized");
  }

  async cleanup(): Promise<void> {
    // Cleanup React platform
    this.components.clear();
    this.eventHandlers.clear();
  }

  async createComponent(definition: ComponentDefinition): Promise<string> {
    const id = definition.id || `react-component-${this.nextId++}`;

    const instance: ComponentInstance = {
      id,
      definition,
      properties: this.getDefaultProperties(definition.properties),
      children: definition.children?.map((child) => child.id) || [],
    };

    this.components.set(id, instance);
    return id;
  }

  async updateComponent(
    id: string,
    properties: Record<string, any>
  ): Promise<void> {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component ${id} not found`);
    }

    component.properties = { ...component.properties, ...properties };
    this.components.set(id, component);

    // Trigger re-render if component is mounted
    this.notifyComponentUpdate(id);
  }

  async deleteComponent(id: string): Promise<void> {
    const component = this.components.get(id);
    if (!component) return;

    // Remove event handlers
    this.eventHandlers.delete(id);

    // Remove component
    this.components.delete(id);
  }

  async getComponent(id: string): Promise<ComponentInstance | null> {
    return this.components.get(id) || null;
  }

  async setProperty(
    componentId: string,
    property: string,
    value: any
  ): Promise<void> {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Component ${componentId} not found`);
    }

    component.properties[property] = value;
    this.notifyComponentUpdate(componentId);
  }

  async getProperty(componentId: string, property: string): Promise<any> {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Component ${componentId} not found`);
    }

    return component.properties[property];
  }

  async addEventListener(
    componentId: string,
    event: string,
    handler: EventHandler
  ): Promise<void> {
    if (!this.eventHandlers.has(componentId)) {
      this.eventHandlers.set(componentId, new Map());
    }

    const componentHandlers = this.eventHandlers.get(componentId)!;
    if (!componentHandlers.has(event)) {
      componentHandlers.set(event, []);
    }

    componentHandlers.get(event)!.push(handler);
  }

  async removeEventListener(
    componentId: string,
    event: string,
    handler: EventHandler
  ): Promise<void> {
    const componentHandlers = this.eventHandlers.get(componentId);
    if (!componentHandlers) return;

    const eventHandlers = componentHandlers.get(event);
    if (!eventHandlers) return;

    const index = eventHandlers.indexOf(handler);
    if (index > -1) {
      eventHandlers.splice(index, 1);
    }
  }

  async navigate(route: string, params?: Record<string, any>): Promise<void> {
    // React Router navigation
    if (typeof window !== "undefined" && window.history) {
      const url = params
        ? `${route}?${new URLSearchParams(params).toString()}`
        : route;
      window.history.pushState({}, "", url);
    }
  }

  // React-specific methods
  async renderComponent(
    componentId: string,
    container: HTMLElement
  ): Promise<void> {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Component ${componentId} not found`);
    }

    // This would integrate with React's rendering system
    // For now, we'll create a placeholder
    container.innerHTML = `<div data-component-id="${componentId}">
      ${component.definition.name} (${component.definition.type})
    </div>`;
  }

  async updateProps(
    componentId: string,
    props: Record<string, any>
  ): Promise<void> {
    await this.updateComponent(componentId, props);
  }

  async getReactElement(
    componentId: string
  ): Promise<React.ReactElement | null> {
    const component = this.components.get(componentId);
    if (!component) return null;

    // This would return the actual React element
    // For now, return null as this requires React integration
    return null;
  }

  // Helper methods
  private getDefaultProperties(
    properties: ComponentProperty[]
  ): Record<string, any> {
    const defaults: Record<string, any> = {};

    for (const prop of properties) {
      if (prop.defaultValue !== undefined) {
        defaults[prop.name] = prop.defaultValue;
      }
    }

    return defaults;
  }

  private notifyComponentUpdate(componentId: string): void {
    // Emit update event
    this.emitEvent({
      type: "component:update",
      componentId,
      timestamp: Date.now(),
    });
  }

  private emitEvent(event: PlatformEvent): void {
    const componentHandlers = this.eventHandlers.get(event.componentId);
    if (!componentHandlers) return;

    const eventHandlers = componentHandlers.get(event.type);
    if (!eventHandlers) return;

    eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error("Error in event handler:", error);
      }
    });
  }

  // Public method to trigger events (for graph nodes)
  public triggerEvent(
    componentId: string,
    eventType: string,
    data?: any
  ): void {
    this.emitEvent({
      type: eventType,
      componentId,
      data,
      timestamp: Date.now(),
    });
  }

  // Get all components (for debugging/inspection)
  public getAllComponents(): ComponentInstance[] {
    return Array.from(this.components.values());
  }
}
