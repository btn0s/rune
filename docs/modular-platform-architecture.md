# Modular Platform Architecture

> **📚 Documentation**: [← Back to Index](./README.md) | **Previous**: [← Figma to Graph Runtime](./figma-to-graph-runtime.md) | **Next**: [Studio Evolution Plan →](./studio-evolution-plan.md)

A platform-agnostic visual development system that can target multiple UI frameworks through shared core abstractions.

> **🔗 Foundation**: This extends the [Figma to Graph Runtime System](./figma-to-graph-runtime.md) to support multiple platforms beyond React.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Rune Studio (Web)                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │ Figma Importer  │ │ Graph Editor    │ │ Live Preview  │ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Core Graph Runtime                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │ Graph Engine    │ │ Platform Bridge │ │ Code Generator│ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │     │   SwiftUI   │     │   Flutter   │
│  Platform   │     │  Platform   │     │  Platform   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Core Architecture

### 1. Platform-Agnostic Core

> **🔗 Foundation**: These interfaces extend the patterns established in [Figma to Graph Runtime: Graph-React Bridge](./figma-to-graph-runtime.md#graph-react-bridge).

```typescript
// packages/rune-core/src/abstractions/IPlatform.ts
export interface IPlatform {
  // Component Management
  createComponent(definition: ComponentDefinition): PlatformComponent;
  updateComponent(id: string, properties: ComponentProperties): void;
  destroyComponent(id: string): void;
  
  // Event System
  addEventListener(componentId: string, eventType: string, handler: EventHandler): void;
  removeEventListener(componentId: string, eventType: string, handler: EventHandler): void;
  
  // Property System
  getProperty(componentId: string, propertyName: string): any;
  setProperty(componentId: string, propertyName: string, value: any): void;
  animateProperty(componentId: string, propertyName: string, targetValue: any, options: AnimationOptions): void;
  
  // Layout & Rendering
  render(): void;
  getAvailableComponents(): ComponentType[];
  getComponentProperties(componentType: string): PropertyDefinition[];
}

// packages/rune-core/src/abstractions/ComponentDefinition.ts
export interface ComponentDefinition {
  id: string;
  type: string;
  properties: ComponentProperties;
  children?: ComponentDefinition[];
  layout?: LayoutDefinition;
}

export interface ComponentProperties {
  [key: string]: any;
}

export interface PropertyDefinition {
  name: string;
  type: PropertyType;
  defaultValue?: any;
  constraints?: PropertyConstraints;
}

export type PropertyType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'color' 
  | 'image' 
  | 'url'
  | 'array'
  | 'object';
```

### 2. Platform-Specific Implementations

#### React Platform

> **🔗 Current Demo**: This React platform implementation builds on the existing graph patterns in `apps/web/app/routes/behave-graph.tsx` - see [Studio Evolution Plan: Platform Registry](./studio-evolution-plan.md#phase-2-create-platform-aware-registry).

```typescript
// packages/rune-platform-react/src/ReactPlatform.ts
export class ReactPlatform implements IPlatform {
  private components = new Map<string, ReactComponent>();
  private eventBus = new EventEmitter();
  
  createComponent(definition: ComponentDefinition): PlatformComponent {
    const ReactComponent = this.getReactComponent(definition.type);
    const component = new ReactComponent(definition);
    this.components.set(definition.id, component);
    return component;
  }
  
  updateComponent(id: string, properties: ComponentProperties): void {
    const component = this.components.get(id);
    if (component) {
      component.updateProps(properties);
    }
  }
  
  getAvailableComponents(): ComponentType[] {
    return [
      { name: 'Button', category: 'Input' },
      { name: 'Text', category: 'Display' },
      { name: 'Image', category: 'Media' },
      { name: 'Container', category: 'Layout' },
      { name: 'Input', category: 'Input' },
      { name: 'Card', category: 'Layout' }
    ];
  }
  
  private getReactComponent(type: string): React.ComponentType {
    const componentMap = {
      'Button': Button,
      'Text': Text,
      'Image': Image,
      'Container': Container,
      'Input': Input,
      'Card': Card
    };
    return componentMap[type] || Container;
  }
}

// packages/rune-platform-react/src/components/GraphAwareButton.tsx
export const Button: React.FC<GraphAwareProps<ButtonProps>> = ({
  text,
  onClick,
  disabled,
  variant,
  graphPath,
  onGraphEvent
}) => {
  const [graphState] = useGraphState(graphPath);
  const triggerAction = useGraphAction();
  
  const effectiveProps = {
    text: graphState?.text ?? text,
    disabled: graphState?.disabled ?? disabled,
    variant: graphState?.variant ?? variant
  };
  
  const handleClick = () => {
    triggerAction(`${graphPath}/click`, { timestamp: Date.now() });
    onGraphEvent?.('click', {});
    onClick?.();
  };
  
  return (
    <button 
      disabled={effectiveProps.disabled}
      className={getButtonClasses(effectiveProps.variant)}
      onClick={handleClick}
    >
      {effectiveProps.text}
    </button>
  );
};
```

#### SwiftUI Platform
```swift
// packages/rune-platform-swiftui/Sources/SwiftUIPlatform.swift
public class SwiftUIPlatform: IPlatform {
    private var components: [String: PlatformComponent] = [:]
    private let eventBus = EventBus()
    
    public func createComponent(definition: ComponentDefinition) -> PlatformComponent {
        let component = createSwiftUIComponent(definition)
        components[definition.id] = component
        return component
    }
    
    public func getAvailableComponents() -> [ComponentType] {
        return [
            ComponentType(name: "Button", category: "Input"),
            ComponentType(name: "Text", category: "Display"),
            ComponentType(name: "Image", category: "Media"),
            ComponentType(name: "VStack", category: "Layout"),
            ComponentType(name: "HStack", category: "Layout"),
            ComponentType(name: "TextField", category: "Input")
        ]
    }
    
    private func createSwiftUIComponent(_ definition: ComponentDefinition) -> PlatformComponent {
        switch definition.type {
        case "Button":
            return GraphAwareButton(definition: definition, platform: self)
        case "Text":
            return GraphAwareText(definition: definition, platform: self)
        default:
            return GraphAwareContainer(definition: definition, platform: self)
        }
    }
}

// packages/rune-platform-swiftui/Sources/Components/GraphAwareButton.swift
struct GraphAwareButton: View, PlatformComponent {
    @StateObject private var graphState = GraphState()
    let definition: ComponentDefinition
    let platform: SwiftUIPlatform
    
    var body: some View {
        Button(action: handleTap) {
            Text(effectiveText)
        }
        .disabled(effectiveDisabled)
        .buttonStyle(effectiveStyle)
        .onReceive(graphState.publisher) { state in
            // Update when graph state changes
        }
    }
    
    private var effectiveText: String {
        graphState.value(for: "text") ?? definition.properties["text"] as? String ?? "Button"
    }
    
    private var effectiveDisabled: Bool {
        graphState.value(for: "disabled") ?? definition.properties["disabled"] as? Bool ?? false
    }
    
    private func handleTap() {
        platform.triggerAction("\(definition.id)/tap", data: [:])
    }
}
```

### 3. Project Templates

```typescript
// packages/rune-cli/src/templates/ProjectTemplate.ts
export interface ProjectTemplate {
  name: string;
  platform: string;
  description: string;
  dependencies: string[];
  files: TemplateFile[];
  postInstall?: string[];
}

export const projectTemplates: ProjectTemplate[] = [
  {
    name: "React Web App",
    platform: "react",
    description: "Modern React application with Tailwind CSS",
    dependencies: [
      "@rune/core",
      "@rune/platform-react", 
      "@rune/figma-react",
      "react",
      "react-dom",
      "tailwindcss"
    ],
    files: [
      {
        path: "src/App.tsx",
        content: reactAppTemplate
      },
      {
        path: "src/components/GraphProvider.tsx", 
        content: reactGraphProviderTemplate
      }
    ],
    postInstall: ["npm install", "npm run setup"]
  },
  {
    name: "SwiftUI iOS App",
    platform: "swiftui",
    description: "Native iOS application with SwiftUI",
    dependencies: [
      "@rune/core",
      "@rune/platform-swiftui"
    ],
    files: [
      {
        path: "Sources/App.swift",
        content: swiftUIAppTemplate
      },
      {
        path: "Sources/GraphProvider.swift",
        content: swiftUIGraphProviderTemplate
      }
    ],
    postInstall: ["swift package resolve"]
  },
  {
    name: "Flutter Mobile App", 
    platform: "flutter",
    description: "Cross-platform mobile app with Flutter",
    dependencies: [
      "@rune/core",
      "@rune/platform-flutter"
    ],
    files: [
      {
        path: "lib/main.dart",
        content: flutterAppTemplate
      }
    ],
    postInstall: ["flutter pub get"]
  }
];
```

### 4. CLI Interface

```bash
# Create new project with platform selection
npx @rune/cli create my-app

? Select a platform:
❯ React (Web)
  SwiftUI (iOS/macOS) 
  Flutter (Mobile)
  Vue (Web) [Coming Soon]
  React Native (Mobile) [Coming Soon]

? Select a template:
❯ Blank Project
  E-commerce App
  Dashboard
  Social Media App
  Portfolio Site

✅ Created my-app with React platform
✅ Installed dependencies
✅ Set up Rune Studio integration

Next steps:
  cd my-app
  npm run studio    # Open visual editor
  npm run dev       # Start development server
```

### 5. Studio Integration

```typescript
// apps/web/app/studio/platform-selector.tsx
export function PlatformSelector() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('react');
  const [availablePlatforms] = useState([
    {
      id: 'react',
      name: 'React',
      description: 'Web applications with React',
      icon: ReactIcon,
      status: 'stable'
    },
    {
      id: 'swiftui', 
      name: 'SwiftUI',
      description: 'Native iOS/macOS apps',
      icon: SwiftIcon,
      status: 'beta'
    },
    {
      id: 'flutter',
      name: 'Flutter', 
      description: 'Cross-platform mobile apps',
      icon: FlutterIcon,
      status: 'alpha'
    }
  ]);
  
  return (
    <div className="platform-selector">
      <h2>Choose Your Platform</h2>
      <div className="platform-grid">
        {availablePlatforms.map(platform => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            selected={selectedPlatform === platform.id}
            onSelect={setSelectedPlatform}
          />
        ))}
      </div>
    </div>
  );
}

// apps/web/app/studio/[platform]/page.tsx
export default function PlatformStudio({ params }: { params: { platform: string } }) {
  const platform = usePlatform(params.platform);
  const availableComponents = platform.getAvailableComponents();
  
  return (
    <div className="studio-layout">
      <ComponentPalette components={availableComponents} />
      <GraphEditor platform={platform} />
      <LivePreview platform={platform} />
    </div>
  );
}
```

### 6. Cross-Platform Graph Nodes

```typescript
// packages/rune-core/src/nodes/PlatformNodes.ts

// Universal component nodes that work across platforms
export const SetComponentProperty = (platforms: string[]) =>
  platforms.map(platform => 
    makeFlowNodeDefinition({
      typeName: `${platform}/setProperty`,
      category: NodeCategory.Effect,
      label: `Set ${platform} Property`,
      in: {
        componentId: 'string',
        property: 'string', 
        value: 'any',
        flow: 'flow'
      },
      out: { flow: 'flow' },
      triggered: ({ commit, read, graph }) => {
        const platformInstance = graph.getDependency<IPlatform>(`I${platform}Platform`);
        platformInstance?.setProperty(
          read('componentId'),
          read('property'), 
          read('value')
        );
        commit('flow');
      }
    })
  );

// Platform-specific nodes
export const ReactNavigate = makeFlowNodeDefinition({
  typeName: 'react/navigate',
  category: NodeCategory.Effect,
  label: 'Navigate',
  in: {
    route: 'string',
    params: 'object',
    flow: 'flow'
  },
  out: { flow: 'flow' },
  triggered: ({ commit, read, graph }) => {
    const router = graph.getDependency<ReactRouter>('ReactRouter');
    router.navigate(read('route'), read('params'));
    commit('flow');
  }
});

export const SwiftUIPresent = makeFlowNodeDefinition({
  typeName: 'swiftui/present',
  category: NodeCategory.Effect,
  label: 'Present View',
  in: {
    viewType: 'string',
    animated: 'boolean',
    flow: 'flow'
  },
  out: { flow: 'flow' },
  triggered: ({ commit, read, graph }) => {
    const navigator = graph.getDependency<SwiftUINavigator>('SwiftUINavigator');
    navigator.present(read('viewType'), read('animated'));
    commit('flow');
  }
});
```

## Implementation Phases

> **🔗 Detailed Implementation**: For step-by-step implementation preserving current functionality, see [Studio Evolution Plan](./studio-evolution-plan.md).

### Phase 1: Core Foundation
- [ ] Platform-agnostic core interfaces
- [ ] React platform implementation
- [ ] Basic CLI with React template
- [ ] Studio platform selector

### Phase 2: SwiftUI Platform  
- [ ] SwiftUI platform implementation
- [ ] iOS/macOS project templates
- [ ] Cross-platform graph nodes
- [ ] Platform-specific preview

### Phase 3: Additional Platforms
- [ ] Flutter platform
- [ ] React Native platform
- [ ] Vue.js platform
- [ ] Platform comparison tools

### Phase 4: Advanced Features
- [ ] Cross-platform component sharing
- [ ] Platform-specific optimizations
- [ ] Advanced animation systems
- [ ] Platform analytics and insights

## Benefits

1. **Unified Workflow**: Same visual editor for all platforms
2. **Code Reuse**: Share graph logic across platforms
3. **Platform Optimization**: Each platform uses native patterns
4. **Incremental Adoption**: Start with one platform, expand later
5. **Consistent API**: Developers learn once, apply everywhere
6. **Future-Proof**: Easy to add new platforms as they emerge

This architecture allows teams to start with React and later expand to mobile platforms without losing their existing graph logic and design work. 