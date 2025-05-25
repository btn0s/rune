# Figma to Graph Runtime System

> **📚 Documentation**: [← Back to Index](./README.md) | **Next**: [Modular Platform Architecture →](./modular-platform-architecture.md)

A visual development pipeline that transforms Figma designs into interactive React components enhanced with visual graph logic.

## Overview

This system enables designers and developers to:
1. Import Figma designs as React components
2. Add interactive logic using visual node graphs
3. See live runtime previews instantly
4. Export optimized components for production use

> **🔗 Related**: This document describes the single-platform (React) implementation. For multi-platform support, see [Modular Platform Architecture](./modular-platform-architecture.md).

## Architecture

### Core Pipeline
```
Figma Design → React Component → Graph Logic → Live Runtime → AI Optimization (Future)
```

> **🔗 Implementation**: See [Studio Evolution Plan](./studio-evolution-plan.md) for how this integrates with the current `behave-graph.tsx` demo.

### Key Components
- **Enhanced Figma-to-React Generator**: Converts Figma nodes to graph-aware React components
- **Graph-React Bridge**: Connects visual graphs to React component state and events
- **Visual Studio**: Integrated editor for Figma import, graph editing, and live preview
- **Runtime System**: Live execution environment for graph-enhanced components
- **Component Registry**: shadcn-style distribution system (Future)

## Phase 1: Core System (No AI)

### 1. Enhanced Figma-to-React Generator

Building on `mcp-figma-to-react` with graph integration:

```typescript
// packages/rune-figma-react/src/GraphAwareComponentGenerator.ts
export class GraphAwareComponentGenerator extends ComponentGenerator {
  async generateGraphReactComponent(
    componentName: string, 
    figmaNode: FigmaNode
  ): Promise<string> {
    const componentParts = figmaNodeToJSX(figmaNode);
    const graphProps = this.extractGraphProperties(figmaNode);
    
    return `
import React from 'react';
import { useGraphState, useGraphAction } from '@rune/behave-graph-react';

interface ${componentName}Props {
  ${componentParts.props.map(prop => `${prop.name}: ${prop.type};`).join('\n  ')}
  // Graph bindings
  graphPath?: string;
  onGraphEvent?: (event: string, data: any) => void;
}

export const ${componentName} = ({ 
  ${componentParts.props.map(p => p.name).join(', ')},
  graphPath,
  onGraphEvent
}: ${componentName}Props) => {
  // Graph state bindings
  const [graphState, setGraphState] = useGraphState(graphPath);
  const triggerAction = useGraphAction();
  
  // Merge props with graph state
  const effectiveProps = {
    ${graphProps.map(prop => `${prop.name}: graphState?.${prop.name} ?? ${prop.name}`).join(',\n    ')}
  };
  
  // Graph event handlers
  const handleInteraction = (eventType: string, data: any) => {
    triggerAction(\`\${graphPath}/\${eventType}\`, data);
    onGraphEvent?.(eventType, data);
  };
  
  return (
    ${this.enhanceJSXWithGraphBindings(componentParts.jsx, graphProps)}
  );
};`;
  }
  
  private extractGraphProperties(figmaNode: FigmaNode): GraphProperty[] {
    return [
      { name: 'isVisible', type: 'boolean', graphType: 'boolean' },
      { name: 'opacity', type: 'number', graphType: 'float' },
      { name: 'backgroundColor', type: 'string', graphType: 'color' },
      { name: 'text', type: 'string', graphType: 'string' },
      { name: 'isDisabled', type: 'boolean', graphType: 'boolean' },
      { name: 'isLoading', type: 'boolean', graphType: 'boolean' }
    ];
  }
}
```

### 2. Graph-React Bridge

```typescript
// packages/behave-graph-react/src/hooks/useGraphState.ts
export function useGraphState(componentPath?: string) {
  const engine = useGraphEngine();
  const [state, setState] = useState({});
  
  useEffect(() => {
    if (!engine || !componentPath) return;
    
    const app = engine.graph.getDependency<IApp>('IApp');
    
    // Subscribe to graph state changes for this component
    const unsubscribe = app.subscribeToComponent(componentPath, (newState) => {
      setState(newState);
    });
    
    return unsubscribe;
  }, [engine, componentPath]);
  
  return [state, (updates: any) => {
    const app = engine.graph.getDependency<IApp>('IApp');
    app.updateComponentState(componentPath, updates);
  }];
}

export function useGraphAction() {
  const engine = useGraphEngine();
  
  return useCallback((actionPath: string, data: any) => {
    const app = engine.graph.getDependency<IApp>('IApp');
    app.triggerAction(actionPath, data);
  }, [engine]);
}
```

### 3. Component-Specific Graph Nodes

```typescript
// packages/behave-graph-react/src/Nodes/ComponentNodes.ts

// Set component properties from graph
export const SetComponentProperty = makeFlowNodeDefinition({
  typeName: 'react/setProperty',
  category: NodeCategory.Effect,
  label: 'Set Component Property',
  in: {
    componentPath: 'string',
    property: 'string',
    value: 'any',
    flow: 'flow'
  },
  out: { flow: 'flow' },
  triggered: ({ commit, read, graph }) => {
    const app = graph.getDependency<IApp>('IApp');
    app.setComponentProperty(
      read('componentPath'),
      read('property'),
      read('value')
    );
    commit('flow');
  }
});

// Listen to component events
export const OnComponentEvent = makeEventNodeDefinition({
  typeName: 'react/onEvent',
  category: NodeCategory.Event,
  label: 'On Component Event',
  in: {
    componentPath: 'string',
    eventType: 'string'
  },
  out: {
    eventData: 'object',
    flow: 'flow'
  },
  init: ({ read, commit, graph }) => {
    const app = graph.getDependency<IApp>('IApp');
    const handler = (data: any) => commit('flow', { eventData: data });
    
    app.addEventListener(read('componentPath'), read('eventType'), handler);
    return { handler };
  }
});

// Animate component properties
export const AnimateComponentProperty = makeFlowNodeDefinition({
  typeName: 'react/animate',
  category: NodeCategory.Effect,
  label: 'Animate Component Property',
  in: {
    componentPath: 'string',
    property: 'string',
    targetValue: 'any',
    duration: 'float',
    easing: 'string',
    flow: 'flow'
  },
  out: { flow: 'flow' },
  triggered: ({ commit, read, graph }) => {
    const app = graph.getDependency<IApp>('IApp');
    app.animateProperty(
      read('componentPath'),
      read('property'),
      read('targetValue'),
      read('duration'),
      read('easing')
    );
    commit('flow');
  }
});
```

### 4. Visual Studio Interface

```typescript
// apps/web/app/studio/page.tsx
export function FigmaGraphStudio() {
  const [figmaComponents, setFigmaComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [graphDefinition, setGraphDefinition] = useState(null);
  
  return (
    <div className="h-screen flex">
      {/* Left Panel: Figma Import & Components */}
      <div className="w-1/4 border-r bg-gray-50">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Figma Components</h2>
          <FigmaImporter onComponentsLoaded={setFigmaComponents} />
          <ComponentList 
            components={figmaComponents}
            selectedComponent={selectedComponent}
            onSelect={setSelectedComponent}
          />
        </div>
      </div>
      
      {/* Center: Graph Editor */}
      <div className="flex-1 bg-gray-100">
        <div className="h-full">
          <GraphEditor 
            registry={registry}
            selectedComponent={selectedComponent}
            onGraphChange={setGraphDefinition}
            availableComponents={figmaComponents}
          />
        </div>
      </div>
      
      {/* Right Panel: Live Preview */}
      <div className="w-1/3 border-l bg-white">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Live Preview</h2>
          <LivePreview 
            component={selectedComponent}
            graph={graphDefinition}
          />
        </div>
      </div>
    </div>
  );
}
```

### 5. Runtime System

```typescript
// apps/web/app/studio/runtime/page.tsx
export default function RuntimePage() {
  const [components] = useLocalStorage('figma-components', []);
  const [graphs] = useLocalStorage('component-graphs', {});
  
  return (
    <GraphProvider graphDefinition={graphs}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b px-6 py-4">
          <h1 className="text-2xl font-bold">Component Runtime</h1>
          <p className="text-gray-600">Live preview of graph-enhanced components</p>
        </header>
        
        <main className="p-6">
          <div className="grid gap-6">
            {components.map(component => (
              <div key={component.id} className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">{component.name}</h3>
                <DynamicComponent
                  component={component}
                  graphPath={`components/${component.id}`}
                />
              </div>
            ))}
          </div>
        </main>
        
        {/* Graph Controls */}
        <GraphControls />
      </div>
    </GraphProvider>
  );
}

function DynamicComponent({ component, graphPath }) {
  // Dynamically render the Figma-generated component
  const ComponentClass = useMemo(() => 
    generateComponentFromDefinition(component), [component]
  );
  
  return (
    <ComponentClass 
      graphPath={graphPath}
      onGraphEvent={(event, data) => {
        console.log(`${graphPath}:${event}`, data);
      }}
    />
  );
}
```

## Workflow Examples

### Example 1: Interactive Button
1. **Import**: Figma button design → React component with `onClick` prop
2. **Graph Logic**: Add nodes for API call on click → Loading state → Success/Error handling
3. **Runtime**: Button shows loading spinner, makes API call, shows result

### Example 2: Dynamic Card
1. **Import**: Figma card design → React component with text/image props
2. **Graph Logic**: Timer node → Fetch data every 30s → Update card content
3. **Runtime**: Card automatically refreshes with new data

### Example 3: Form Validation
1. **Import**: Figma form fields → React components with value/error props
2. **Graph Logic**: Input change events → Validation logic → Error display
3. **Runtime**: Real-time form validation with visual feedback

## CLI Commands

```bash
# Import Figma components
npx @rune/figma-import --file-key="abc123" --output="./components"

# Start the studio
npm run studio

# Start the runtime
npm run studio:runtime

# Export component (future)
npx @rune/export --component="UserCard" --output="./dist"
```

## File Structure

```
packages/
├── rune-figma-react/           # Enhanced Figma-to-React generator
│   ├── src/
│   │   ├── GraphAwareComponentGenerator.ts
│   │   ├── GraphPropertyExtractor.ts
│   │   └── index.ts
│   └── package.json
├── behave-graph-react/         # Graph-React bridge
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── useGraphState.ts
│   │   │   └── useGraphAction.ts
│   │   ├── Nodes/
│   │   │   └── ComponentNodes.ts
│   │   └── index.ts
│   └── package.json
└── behave-graph-nextjs/        # NextJS-specific graph nodes
    ├── src/
    │   ├── Nodes/
    │   │   ├── NavigationNodes.ts
    │   │   ├── ApiNodes.ts
    │   │   └── StateNodes.ts
    │   └── index.ts
    └── package.json

apps/
└── web/
    ├── app/
    │   ├── studio/
    │   │   ├── page.tsx              # Main studio interface
    │   │   ├── runtime/
    │   │   │   └── page.tsx          # Runtime preview
    │   │   └── components/
    │   │       ├── FigmaImporter.tsx
    │   │       ├── ComponentList.tsx
    │   │       ├── GraphEditor.tsx
    │   │       └── LivePreview.tsx
    │   └── components/
    │       └── graph-engine/
    │           └── GraphProvider.tsx
    └── package.json
```

## Phase 2: AI Enhancement (Future)

> **🔗 Multi-Platform**: When implementing AI enhancement, see [Platform Architecture: Cross-Platform Graph Nodes](./modular-platform-architecture.md#cross-platform-graph-nodes) for platform-agnostic AI optimization.

### AI Analysis System
```typescript
// packages/rune-ai-optimizer/src/ComponentAnalyzer.ts
export class ComponentAnalyzer {
  async analyzeRuntime(componentId: string, runtimeData: RuntimeData) {
    // Analyze user interactions, performance, state changes
    // Generate optimization suggestions
    // Create improved component variants
  }
  
  async generateOptimizedComponent(analysis: ComponentAnalysis) {
    // Use AI to create production-ready component
    // Add proper TypeScript types
    // Optimize for performance and accessibility
    // Generate documentation
  }
}
```

### shadcn-Style Registry

> **🔗 Implementation**: The CLI interface described here aligns with [Platform Architecture: CLI Interface](./modular-platform-architecture.md#cli-interface) for multi-platform projects.

```bash
# AI-optimized components available via registry
npx @rune/registry add user-card
npx @rune/registry add data-table
npx @rune/registry add interactive-chart
```

## Implementation Timeline

> **🔗 Current Implementation**: See [Studio Evolution Plan](./studio-evolution-plan.md) for how these phases integrate with the existing `behave-graph.tsx` demo.

### Week 1-2: Foundation
- [ ] Enhanced Figma-to-React generator with graph hooks
- [ ] Basic Graph-React bridge (useGraphState, useGraphAction)
- [ ] Core component nodes (SetProperty, OnEvent)

### Week 3-4: Studio Interface
- [ ] Figma importer UI
- [ ] Graph editor integration
- [ ] Component list and selection

### Week 5-6: Runtime System
- [ ] Live preview panel
- [ ] Runtime page with dynamic component rendering
- [ ] Graph controls and debugging

### Week 7-8: Polish & Export
- [ ] CLI commands for import/export
- [ ] Component persistence and loading
- [ ] Documentation and examples

### Future: AI & Registry
- [ ] AI analysis of runtime behavior
- [ ] Optimized component generation
- [ ] shadcn-style component registry
- [ ] Advanced graph nodes and templates

## Benefits

1. **Instant Feedback**: See Figma → React → Graph → Runtime in real-time
2. **No AI Dependency**: Core workflow works without AI, enabling immediate productivity
3. **Progressive Enhancement**: Add AI later for optimization without breaking existing workflow
4. **Visual Programming**: Non-developers can add complex logic via graph editor
5. **Production Ready**: Generate components compatible with existing React ecosystems
6. **Extensible**: Plugin system for custom nodes and behaviors

## Success Metrics

- **Speed**: Figma to working component in under 5 minutes
- **Usability**: Non-developers can add basic interactivity
- **Quality**: Generated components pass accessibility and performance standards
- **Adoption**: Components can be easily integrated into existing projects
- **Extensibility**: Third-party nodes and templates can be added

This system provides a complete visual development pipeline that bridges design and development while maintaining the flexibility to enhance with AI capabilities in the future. 