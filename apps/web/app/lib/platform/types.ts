// Platform abstraction interfaces for multi-platform support

export interface IPlatform {
  name: string;
  version: string;

  // Component management
  createComponent(definition: ComponentDefinition): Promise<string>;
  updateComponent(id: string, properties: Record<string, any>): Promise<void>;
  deleteComponent(id: string): Promise<void>;
  getComponent(id: string): Promise<ComponentInstance | null>;

  // Property management
  setProperty(componentId: string, property: string, value: any): Promise<void>;
  getProperty(componentId: string, property: string): Promise<any>;

  // Event handling
  addEventListener(
    componentId: string,
    event: string,
    handler: EventHandler
  ): Promise<void>;
  removeEventListener(
    componentId: string,
    event: string,
    handler: EventHandler
  ): Promise<void>;

  // Navigation (platform-specific)
  navigate?(route: string, params?: Record<string, any>): Promise<void>;

  // Lifecycle
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

export interface ComponentDefinition {
  id: string;
  name: string;
  type: string;
  properties: ComponentProperty[];
  children?: ComponentDefinition[];
  metadata?: Record<string, any>;
}

export interface ComponentInstance {
  id: string;
  definition: ComponentDefinition;
  properties: Record<string, any>;
  parent?: string;
  children: string[];
}

export interface ComponentProperty {
  name: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "color"
    | "image"
    | "object"
    | "array";
  defaultValue?: any;
  required?: boolean;
  description?: string;
  options?: any[]; // For enum-like properties
}

export type EventHandler = (event: PlatformEvent) => void;

export interface PlatformEvent {
  type: string;
  componentId: string;
  data?: any;
  timestamp: number;
}

// Platform-specific interfaces
export interface IReactPlatform extends IPlatform {
  // React-specific methods
  renderComponent(componentId: string, container: HTMLElement): Promise<void>;
  updateProps(componentId: string, props: Record<string, any>): Promise<void>;
  getReactElement(componentId: string): Promise<React.ReactElement | null>;
}

export interface ISwiftUIPlatform extends IPlatform {
  // SwiftUI-specific methods
  presentView(viewType: string, animated: boolean): Promise<void>;
  dismissView(animated: boolean): Promise<void>;
}

export interface IFlutterPlatform extends IPlatform {
  // Flutter-specific methods
  pushRoute(route: string, args?: any): Promise<void>;
  popRoute(): Promise<void>;
}

// Platform factory
export interface PlatformFactory {
  createPlatform(type: string, config: any): IPlatform;
  getSupportedPlatforms(): string[];
}
