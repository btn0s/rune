# Studio Evolution Plan

> **📚 Documentation**: [← Back to Index](./README.md) | **Previous**: [← Platform Architecture](./modular-platform-architecture.md)

How to evolve the current `behave-graph.tsx` demo into the full Rune Studio experience with project-centric architecture.

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

### Project-Centric Design

**Core Concept**: Projects are the fundamental unit, not platforms. Each project has a `rune.json` configuration that defines its platform, components, and settings.

### rune.json Configuration Schema

```json
{
  "name": "my-awesome-app",
  "version": "1.0.0",
  "description": "A visual app built with Rune",
  "rune": {
    "version": "0.1.0",
    "platform": "react",
    "studio": {
      "graphFile": "./src/app.graph.json",
      "componentsDir": "./src/components",
      "outputDir": "./src/generated"
    },
    "figma": {
      "fileKey": "abc123...",
      "nodeIds": ["1:23", "4:56"],
      "lastSync": "2024-01-15T10:30:00Z"
    },
    "platform": {
      "react": {
        "framework": "remix",
        "uiLibrary": "shadcn",
        "outputFormat": "tsx"
      }
    }
  },
  "dependencies": {
    "react": "^19.0.0",
    "@rune/runtime-react": "^0.1.0"
  }
}
```

### Project Directory Structure

```
my-project/
├── rune.json                    # Project configuration
├── src/
│   ├── app.graph.json          # Main graph definition
│   ├── components/             # Figma-imported components
│   │   ├── Button.figma.json   # Component metadata
│   │   └── Card.figma.json
│   └── generated/              # Generated code
│       ├── components/
│       └── runtime/
├── .rune/                      # Rune-specific cache/metadata
│   ├── cache/
│   └── figma-sync.json
└── package.json               # Standard npm package
```

### What We Need (Full Studio)

```typescript
// Target implementation:
✅ Project management system
✅ rune.json configuration
✅ Project-scoped persistence
✅ Platform-aware registry (React, SwiftUI, etc.)
✅ Figma import integration
✅ Component palette
✅ Multi-panel layout
✅ Live preview
✅ Project settings

// Target architecture:
const registry = createProjectRegistry(projectConfig, {
  values: {},
  nodes: {},
  dependencies: {
    ILogger: new DefaultLogger(),
    ILifecycleEventEmitter: new ManualLifecycleEventEmitter(),
    IPlatform: createPlatformInstance(projectConfig.platform),
    IFigmaImporter: new FigmaImporter(projectConfig.figma),
    IComponentRegistry: new ComponentRegistry(projectConfig.componentsDir),
  },
});
```

### Target UI Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Project Name + Platform + Settings + Export        │
├─────────────────┬─────────────────────┬─────────────────────┤
│ Left Panel      │ Center Panel        │ Right Panel         │
│                 │                     │                     │
│ ┌─────────────┐ │ ┌─────────────────┐ │ ┌─────────────────┐ │
│ │ Project     │ │ │                 │ │ │                 │ │
│ │ Components  │ │ │   Graph Editor  │ │ │  Live Preview   │ │
│ └─────────────┘ │ │   (Enhanced     │ │ │                 │ │
│ ┌─────────────┐ │ │    Flow)        │ │ │  ┌───────────┐  │ │
│ │ Figma       │ │ │                 │ │ │  │Component 1│  │ │
│ │ Importer    │ │ │                 │ │ │  └───────────┘  │ │
│ └─────────────┘ │ │                 │ │ │  ┌───────────┐  │ │
│ ┌─────────────┐ │ │                 │ │ │  │Component 2│  │ │
│ │ Component   │ │ │                 │ │ │  └───────────┘  │ │
│ │ Palette     │ │ │                 │ │ │                 │ │
│ │ - Buttons   │ │ │                 │ │ │                 │ │
│ │ - Inputs    │ │ │                 │ │ │                 │ │
│ │ - Cards     │ │ └─────────────────┘ │ └─────────────────┘ │
│ └─────────────┘ │                     │                     │
└─────────────────┴─────────────────────┴─────────────────────┘
```

## Migration Strategy

### Phase 1: Project Foundation (Revised)

**Goal**: Create project management system while preserving current demo

**Actions**:
1. **Keep** `behave-graph.tsx` as standalone demo
2. **Create** project management system with `rune.json`
3. **Build** project dashboard and creation wizard
4. **Extract** reusable components from current Flow implementation

**New Route Structure**:
```
apps/web/app/routes/
├── behave-graph.tsx              # Keep as reference/demo
├── studio/
│   ├── dashboard.tsx             # Project list/selector
│   ├── new-project.tsx           # Project creation wizard
│   ├── import-project.tsx        # Import existing project
│   ├── [projectId]/
│   │   ├── page.tsx              # Main studio interface
│   │   ├── settings.tsx          # Project settings
│   │   └── export.tsx            # Export/deploy options
│   └── components/
│       ├── ProjectManager.tsx
│       ├── FigmaImporter.tsx
│       ├── ComponentPalette.tsx
│       ├── EnhancedFlow.tsx      # Extended from current Flow
│       └── LivePreview.tsx
```

**URL Structure**:
```
/studio                          # Project dashboard
/studio/new                      # Create new project
/studio/import                   # Import existing project  
/studio/:projectId               # Main studio interface
/studio/:projectId/settings      # Project settings
/studio/:projectId/export        # Export/deploy options
```

### Phase 2: Project-Aware Registry

**Goal**: Extend current registry pattern to support project configuration

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

**New Project Registry Pattern**:
```typescript
// New studio pattern - extends current approach
const createProjectRegistry = (projectConfig: RuneConfig) => {
  const coreRegistry = registerCoreProfile({
    values: {},
    nodes: {},
    dependencies: {
      ILogger: new DefaultLogger(),
      ILifecycleEventEmitter: new ManualLifecycleEventEmitter(),
    },
  });
  
  // Add project-specific extensions
  return registerPlatformProfile(projectConfig.platform, coreRegistry, {
    dependencies: {
      IPlatform: createPlatformInstance(projectConfig.platform),
      IFigmaImporter: new FigmaImporter(projectConfig.figma),
      IProjectManager: new ProjectManager(projectConfig),
    },
  });
};
```

### Phase 3: Enhanced Flow Component

**Goal**: Extend current Flow to support project features

**Current Flow Usage**:
```typescript
// From behave-graph.tsx
<Flow
  initialGraph={currentGraph}
  registry={registry}
  examples={examples}
/>
```

**Enhanced Project Flow**:
```typescript
// New studio usage - backward compatible
<EnhancedFlow
  initialGraph={project.graph}
  registry={registry}
  examples={examples}
  // New project features
  project={currentProject}
  onGraphChange={handleGraphChange}
  onComponentSelect={handleComponentSelect}
  availableComponents={project.components}
  figmaComponents={project.figmaComponents}
  onSave={handleProjectSave}
/>
```

### Phase 4: Project Studio Interface

**Goal**: Build full studio UI around project context

**Implementation**:
```typescript
// apps/web/app/routes/studio/[projectId]/page.tsx
export default function ProjectStudio({ params }: { params: { projectId: string } }) {
  const [project, setProject] = useState<RuneProject | null>(null);
  const [projectConfig, setProjectConfig] = useState<RuneConfig | null>(null);
  
  // Load project configuration
  useEffect(() => {
    loadProject(params.projectId).then(({ project, config }) => {
      setProject(project);
      setProjectConfig(config);
    });
  }, [params.projectId]);
  
  if (!project || !projectConfig) return <ProjectLoader />;
  
  const registry = createProjectRegistry(projectConfig);
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <ProjectHeader 
        project={project}
        config={projectConfig}
        onSave={handleSave}
        onExport={handleExport}
      />
      
      <div className="flex-1 flex">
        {/* Left Panel */}
        <ProjectSidebar
          project={project}
          config={projectConfig}
          onFigmaImport={handleFigmaImport}
          onComponentSelect={handleComponentSelect}
        />
        
        {/* Center Panel - Enhanced version of current Flow */}
        <div className="flex-1">
          <EnhancedFlow
            initialGraph={project.graph}
            registry={registry}
            project={project}
            onGraphChange={handleGraphChange}
            onSave={handleProjectSave}
          />
        </div>
        
        {/* Right Panel */}
        <LivePreview
          project={project}
          config={projectConfig}
          graph={project.graph}
        />
      </div>
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

**Project Templates** (extend current):
```typescript
const projectTemplates = {
  // Preserve current examples as quick-start templates
  "Quick Start": {
    name: "Graph Editor Demo",
    platform: "react",
    graph: exampleGraph,
    isTemplate: true
  },
  "Basic Math": {
    name: "Math Operations",
    platform: "react", 
    graph: basicMathExample,
    isTemplate: true
  },
  
  // Add platform-specific templates
  "React Button Click": reactButtonTemplate,
  "React Form Validation": reactFormTemplate,
  "Component Animation": animationTemplate,
};
```

### Maintain Graph Compatibility

**Ensure** all current graph JSONs work in projects:
- Math operations
- Lifecycle events  
- Debug logging
- Flow control

**Add** project-specific nodes without breaking existing graphs:
- Component manipulation
- Project file operations
- Figma synchronization
- Platform-specific UI events

### Project Data Management

**Project Persistence**:
```typescript
interface RuneProject {
  id: string;
  name: string;
  description?: string;
  platform: string;
  graph: GraphJSON;
  components: ProjectComponent[];
  figmaComponents: FigmaComponent[];
  createdAt: Date;
  updatedAt: Date;
  config: RuneConfig;
}

interface ProjectComponent {
  id: string;
  name: string;
  type: 'figma' | 'custom' | 'template';
  figmaNodeId?: string;
  graphNodes: string[];
  metadata: Record<string, any>;
}
```

**Project Storage Strategy**:
- **Local Development**: File system with `rune.json`
- **Studio Storage**: Browser localStorage + IndexedDB
- **Cloud Sync**: Future integration with git/cloud providers

## Implementation Checklist

### Phase 1: Project Foundation ✅
- [ ] Create project management system
- [ ] Design `rune.json` schema and validation
- [ ] Build project dashboard and creation wizard
- [ ] Create project storage/persistence layer
- [ ] Extract Flow component patterns from current implementation
- [ ] Preserve `behave-graph.tsx` as standalone demo

### Phase 2: Project-Aware Registry ✅  
- [ ] Extend registry pattern for project configuration
- [ ] Create project abstraction interfaces
- [ ] Implement React platform adapter first
- [ ] Add project-specific node types
- [ ] Maintain backward compatibility with current graphs

### Phase 3: Enhanced Flow Component ✅
- [ ] Extend Flow component for project features
- [ ] Add project context and persistence
- [ ] Integrate project-aware node palette
- [ ] Add component selection/highlighting
- [ ] Preserve current graph execution patterns

### Phase 4: Project Studio UI ✅
- [ ] Build multi-panel project layout
- [ ] Add project component management panel
- [ ] Create Figma import/sync panel
- [ ] Build live preview panel
- [ ] Implement project settings interface

### Phase 5: Project Integration ✅
- [ ] Connect all panels through project state
- [ ] Add graph-to-component binding
- [ ] Implement real-time preview updates
- [ ] Add project export/save functionality
- [ ] Build project import/sharing features

### Phase 6: Platform Extensions ✅
- [ ] Add SwiftUI platform support
- [ ] Add Flutter platform support
- [ ] Create platform-specific node libraries
- [ ] Build cross-platform component templates

## Success Criteria

1. **Current functionality preserved**: `behave-graph.tsx` continues working as standalone demo
2. **Project-centric workflow**: Clear project creation, editing, and management
3. **Smooth migration path**: Existing graphs work as project templates
4. **Enhanced capabilities**: Studio adds project management without breaking existing patterns
5. **Platform extensibility**: Easy to add new platforms through project configuration
6. **Developer experience**: Clear upgrade path from demo to full project development
7. **Data persistence**: Projects save reliably and can be shared/imported

## Risk Mitigation

### Backward Compatibility
- Keep original `behave-graph.tsx` route as reference implementation
- Ensure all current examples work as project templates
- Maintain same registry initialization patterns for core functionality

### Project Data Integrity
- Implement robust project validation and error handling
- Add project backup/restore functionality
- Validate `rune.json` schema on load/save operations

### Performance
- Lazy load project data and studio panels
- Optimize graph rendering for larger project component trees
- Cache project-specific node definitions and platform adapters
- Implement efficient project switching

### Complexity Management
- Start with React platform only in Phase 1-4
- Add additional platforms incrementally in Phase 6
- Keep core graph engine unchanged
- Maintain clear separation between project management and graph execution

### User Experience
- Provide clear migration path from demo to projects
- Add helpful onboarding for project creation
- Implement intuitive project organization and discovery
- Ensure fast project loading and switching

This evolution plan ensures we build on the solid foundation of the current implementation while creating a comprehensive project-centric development experience that scales from simple demos to full application development. 