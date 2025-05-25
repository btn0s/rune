# Studio Evolution Plan

> **📚 Documentation**: [← Back to Index](./README.md) | **Previous**: [← Platform Architecture](./modular-platform-architecture.md)

How to evolve the current `behave-graph.tsx` demo into the full Rune Studio experience.

> **🔗 Context**: This document provides the implementation roadmap for both the [Figma to Graph Runtime System](./figma-to-graph-runtime.md) and [Modular Platform Architecture](./modular-platform-architecture.md).

> **🎯 Current State**: Working demo at `apps/web/app/routes/behave-graph.tsx` - see [README.md](./README.md#for-llmsai-assistants) for current system context.

## Current State Analysis

### What We Have (`apps/web/app/routes/behave-graph.tsx`)

```typescript
// Current implementation shows:
✅ Core graph engine integration
✅ Basic Flow component
✅ Example graphs (math, lifecycle)
✅ Registry with core profile
✅ Manual lifecycle management

// Current architecture:
const registry = registerCoreProfile({
  values: {},
  nodes: {},
  dependencies: {
    ILogger: new DefaultLogger(),
    ILifecycleEventEmitter: new ManualLifecycleEventEmitter(),
  },
});
```

### Current UI Structure
```
┌─────────────────────────────────────────┐
│ Logo + Title (top-left overlay)        │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │        Flow Component               │ │
│ │     (Full Screen Graph Editor)      │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Target Studio Architecture

### What We Need (Full Studio)

```typescript
// Target implementation:
✅ Platform-aware registry (React, SwiftUI, etc.)
✅ Figma import integration
✅ Component palette
✅ Multi-panel layout
✅ Live preview
✅ Platform selection
✅ Project management

// Target architecture:
const registry = registerPlatformProfile(selectedPlatform, {
  values: {},
  nodes: {},
  dependencies: {
    ILogger: new DefaultLogger(),
    ILifecycleEventEmitter: new ManualLifecycleEventEmitter(),
    IPlatform: platformInstance,
    IFigmaImporter: new FigmaImporter(),
    IComponentRegistry: new ComponentRegistry(),
  },
});
```

### Target UI Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Platform Selector + Project Controls               │
├─────────────────┬─────────────────────┬─────────────────────┤
│ Left Panel      │ Center Panel        │ Right Panel         │
│                 │                     │                     │
│ ┌─────────────┐ │ ┌─────────────────┐ │ ┌─────────────────┐ │
│ │ Figma       │ │ │                 │ │ │                 │ │
│ │ Importer    │ │ │   Graph Editor  │ │ │  Live Preview   │ │
│ └─────────────┘ │ │   (Enhanced     │ │ │                 │ │
│ ┌─────────────┐ │ │    Flow)        │ │ │  ┌───────────┐  │ │
│ │ Component   │ │ │                 │ │ │  │Component 1│  │ │
│ │ Palette     │ │ │                 │ │ │  └───────────┘  │ │
│ │             │ │ │                 │ │ │  ┌───────────┐  │ │
│ │ - Buttons   │ │ │                 │ │ │  │Component 2│  │ │
│ │ - Inputs    │ │ │                 │ │ │  └───────────┘  │ │
│ │ - Cards     │ │ └─────────────────┘ │ └─────────────────┘ │
│ └─────────────┘ │                     │                     │
└─────────────────┴─────────────────────┴─────────────────────┘
```

## Migration Strategy

### Phase 1: Preserve & Extend Current Implementation

**Goal**: Keep `behave-graph.tsx` working while building studio foundations

**Actions**:
1. **Keep** `behave-graph.tsx` as-is for reference/testing
2. **Create** new studio routes that extend the current patterns
3. **Extract** reusable components from current Flow implementation
4. **Document** current graph examples for studio templates

**File Structure**:
```
apps/web/app/routes/
├── behave-graph.tsx          # Keep as reference/demo
├── studio/
│   ├── page.tsx              # New: Platform selector
│   ├── [platform]/
│   │   └── page.tsx          # New: Platform-specific studio
│   └── components/
│       ├── FigmaImporter.tsx
│       ├── ComponentPalette.tsx
│       ├── EnhancedFlow.tsx  # Extended from current Flow
│       └── LivePreview.tsx
```

### Phase 2: Create Platform-Aware Registry

**Goal**: Extend current registry pattern to support platforms

**Current Registry Pattern**:
```typescript
// From behave-graph.tsx - keep this working
const registry = registerCoreProfile({
  values: {},
  nodes: {},
  dependencies: {
    ILogger: new DefaultLogger(),
    ILifecycleEventEmitter: new ManualLifecycleEventEmitter(),
  },
});
```

**New Platform Registry Pattern**:
```typescript
// New studio pattern - extends current approach
const createStudioRegistry = (platform: string) => {
  const coreRegistry = registerCoreProfile({
    values: {},
    nodes: {},
    dependencies: {
      ILogger: new DefaultLogger(),
      ILifecycleEventEmitter: new ManualLifecycleEventEmitter(),
    },
  });
  
  // Add platform-specific extensions
  return registerPlatformProfile(platform, coreRegistry, {
    dependencies: {
      IPlatform: createPlatformInstance(platform),
      IFigmaImporter: new FigmaImporter(),
    },
  });
};
```

### Phase 3: Enhance Flow Component

**Goal**: Extend current Flow to support studio features

**Current Flow Usage**:
```typescript
// From behave-graph.tsx
<Flow
  initialGraph={currentGraph}
  registry={registry}
  examples={examples}
/>
```

**Enhanced Studio Flow**:
```typescript
// New studio usage - backward compatible
<EnhancedFlow
  initialGraph={currentGraph}
  registry={registry}
  examples={examples}
  // New studio features
  platform={selectedPlatform}
  onGraphChange={handleGraphChange}
  onComponentSelect={handleComponentSelect}
  availableComponents={platformComponents}
  figmaComponents={importedComponents}
/>
```

### Phase 4: Add Studio Panels

**Goal**: Build studio UI around enhanced Flow component

**Implementation**:
```typescript
// apps/web/app/routes/studio/[platform]/page.tsx
export default function PlatformStudio({ params }: { params: { platform: string } }) {
  // Use same registry pattern as behave-graph.tsx
  const registry = createStudioRegistry(params.platform);
  const [currentGraph, setCurrentGraph] = useState<GraphJSON>(defaultGraph);
  
  // Extend with studio features
  const [figmaComponents, setFigmaComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  
  return (
    <div className="h-screen flex">
      {/* Left Panel */}
      <StudioSidebar
        platform={params.platform}
        onFigmaImport={setFigmaComponents}
        onComponentSelect={setSelectedComponent}
      />
      
      {/* Center Panel - Enhanced version of current Flow */}
      <div className="flex-1">
        <EnhancedFlow
          initialGraph={currentGraph}
          registry={registry}
          platform={params.platform}
          onGraphChange={setCurrentGraph}
          selectedComponent={selectedComponent}
        />
      </div>
      
      {/* Right Panel */}
      <LivePreview
        components={figmaComponents}
        graph={currentGraph}
        platform={params.platform}
      />
    </div>
  );
}
```

## Preserving Current Functionality

### Keep Working Examples

**Current Examples** (from `behave-graph.tsx`):
```typescript
const examples = {
  "Complex Demo": exampleGraph,      // Keep this
  "Basic Math": { /* ... */ },       // Keep this
};
```

**Studio Examples** (extend current):
```typescript
const studioExamples = {
  // Preserve current examples
  ...examples,
  
  // Add platform-specific examples
  "React Button Click": reactButtonExample,
  "SwiftUI Navigation": swiftUINavExample,
  "Component Animation": animationExample,
};
```

### Maintain Graph Compatibility

**Ensure** all current graph JSONs work in studio:
- Math operations
- Lifecycle events  
- Debug logging
- Flow control

**Add** platform-specific nodes without breaking existing graphs:
- Component manipulation
- Platform navigation
- UI events

## Implementation Checklist

### Phase 1: Foundation ✅
- [ ] Create studio route structure
- [ ] Extract Flow component patterns
- [ ] Preserve behave-graph.tsx functionality
- [ ] Document current examples

### Phase 2: Platform Registry ✅  
- [ ] Extend registry pattern for platforms
- [ ] Create platform abstraction interfaces
- [ ] Implement React platform first
- [ ] Maintain backward compatibility

### Phase 3: Enhanced Flow ✅
- [ ] Extend Flow component for studio features
- [ ] Add component selection/highlighting
- [ ] Integrate platform-aware node palette
- [ ] Preserve current graph execution

### Phase 4: Studio UI ✅
- [ ] Build multi-panel layout
- [ ] Add Figma import panel
- [ ] Create live preview panel
- [ ] Implement platform selector

### Phase 5: Integration ✅
- [ ] Connect all panels through shared state
- [ ] Add graph-to-component binding
- [ ] Implement real-time preview updates
- [ ] Add export/save functionality

## Success Criteria

1. **Current functionality preserved**: `behave-graph.tsx` continues working
2. **Smooth migration path**: Existing graphs work in studio
3. **Enhanced capabilities**: Studio adds value without breaking existing patterns
4. **Platform extensibility**: Easy to add new platforms
5. **Developer experience**: Clear upgrade path from demo to studio

## Risk Mitigation

### Backward Compatibility
- Keep original `behave-graph.tsx` route
- Ensure all current examples work in studio
- Maintain same registry initialization patterns

### Performance
- Lazy load studio panels
- Optimize graph rendering for larger component trees
- Cache platform-specific node definitions

### Complexity Management
- Start with React platform only
- Add platforms incrementally
- Keep core graph engine unchanged

This evolution plan ensures we build on the solid foundation of the current implementation while creating a path to the full studio experience. 