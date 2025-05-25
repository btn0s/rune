# Rune Documentation

A comprehensive visual development platform that transforms Figma designs into interactive applications across multiple platforms through visual graph programming and project-based workflows.

## 📋 Documentation Index

### Core Architecture Documents

1. **[Figma to Graph Runtime System](./figma-to-graph-runtime.md)**
   - **Purpose**: Complete system design for Figma → React → Graph → Runtime pipeline
   - **Scope**: Single-platform (React) implementation with AI enhancement roadmap
   - **Status**: ✅ Complete design specification

2. **[Modular Platform Architecture](./modular-platform-architecture.md)**
   - **Purpose**: Multi-platform extension supporting React, SwiftUI, Flutter, etc.
   - **Scope**: Platform-agnostic core with platform-specific adapters
   - **Status**: ✅ Complete architecture specification
   - **Extends**: Figma to Graph Runtime System

3. **[Studio Evolution Plan](./studio-evolution-plan.md)**
   - **Purpose**: Migration strategy from current demo to full project-centric studio
   - **Scope**: Implementation roadmap preserving existing functionality
   - **Status**: ✅ Complete implementation plan with project management
   - **Implements**: Both above architectures with project-first approach

## 🎯 Project Vision

### The Big Picture
```
Figma Design → Project Configuration → Visual Graph Logic → Multi-Platform Apps
```

**Goal**: Enable designers and developers to create interactive applications through visual programming, starting with Figma designs and extending with graph-based logic that can target any platform, all organized within manageable projects.

### Key Principles
- **Project-First**: Projects are the fundamental unit of organization
- **Visual-First**: Design drives development
- **Platform-Agnostic**: Write once, deploy everywhere
- **Graph-Powered**: Logic through visual programming
- **AI-Enhanced**: Smart optimization and code generation
- **Incremental**: Start simple, scale complexity

## 🏗️ System Architecture Overview

### Project-Centric Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Rune Studio (Web)                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │ Project Manager │ │ Graph Editor    │ │ Live Preview  │ │
│  │ + Figma Import  │ │ + Component     │ │ + Platform    │ │
│  │                 │ │   Palette       │ │   Output      │ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Core Graph Runtime                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │ Graph Engine    │ │ Platform Bridge │ │ Code Generator│ │
│  │ (@behave-graph) │ │ (IPlatform)     │ │ (AI-Enhanced) │ │
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

## 📁 Project Configuration System

### rune.json Schema

Each Rune project is defined by a `rune.json` configuration file:

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

## 📚 Document Relationships

### Design Flow
1. **Start Here**: [Studio Evolution Plan](./studio-evolution-plan.md)
   - Understand the project-centric approach and implementation roadmap
   - See how current demo evolves into full studio

2. **Core Concepts**: [Figma to Graph Runtime System](./figma-to-graph-runtime.md)
   - Learn the fundamental workflow from Figma to running app
   - Understand single-platform implementation details

3. **Scale Up**: [Modular Platform Architecture](./modular-platform-architecture.md)
   - See how projects extend to multiple platforms
   - Understand platform abstraction and shared graph logic

### Cross-References

#### From Studio Evolution → Core Runtime
- **Project Configuration** → **Runtime System: Component Registry**
- **Project Templates** → **Runtime System: Example Graphs**
- **Project Persistence** → **Runtime System: Graph JSON Format**

#### From Studio Evolution → Platform Architecture
- **Project Platform Selection** → **Platform Architecture: IPlatform Interface**
- **Project Component Management** → **Platform Architecture: Cross-Platform Components**
- **Project Export/Deploy** → **Platform Architecture: CLI Interface**

#### From Core Runtime → Platform Architecture
- **Single Platform Implementation** → **Multi-Platform Extension**
- **React-Specific Nodes** → **Cross-Platform Node Abstractions**
- **Component Generation** → **Platform-Specific Code Generation**

## 🚀 Implementation Phases

### Phase 1: Project Foundation (Current → Studio)
**Documents**: [Studio Evolution Plan](./studio-evolution-plan.md#phase-1-project-foundation-revised)
- Create project management system with `rune.json`
- Build project dashboard and creation wizard
- Preserve existing `behave-graph.tsx` demo
- Extract reusable Flow components

### Phase 2: Project-Aware Registry (Single Platform)
**Documents**: [Studio Evolution Plan](./studio-evolution-plan.md#phase-2-project-aware-registry)
- Extend registry pattern for project configuration
- Implement React platform adapter
- Add project-specific node types
- Create project persistence layer

### Phase 3: Enhanced Flow Component (Project Integration)
**Documents**: [Studio Evolution Plan](./studio-evolution-plan.md#phase-3-enhanced-flow-component)
- Extend Flow component for project features
- Add project context and persistence
- Integrate project-aware node palette
- Build component selection/highlighting

### Phase 4: Project Studio UI (Full Interface)
**Documents**: [Studio Evolution Plan](./studio-evolution-plan.md#phase-4-project-studio-interface)
- Build multi-panel project layout
- Add project component management
- Create Figma import/sync panel
- Implement live preview panel

### Phase 5: Project Integration (Complete Workflow)
**Documents**: [Studio Evolution Plan](./studio-evolution-plan.md#phase-5-project-integration)
- Connect all panels through project state
- Add graph-to-component binding
- Implement real-time preview updates
- Build project export/save functionality

### Phase 6: Platform Extensions (Multi-Platform)
**Documents**: [Modular Platform Architecture](./modular-platform-architecture.md)
- Add SwiftUI platform support
- Add Flutter platform support
- Create platform-specific node libraries
- Build cross-platform component templates

### Phase 7: AI Enhancement (Future)
**Documents**: [Figma to Graph Runtime: Phase 2](./figma-to-graph-runtime.md#phase-2-ai-enhancement-future)
- Component analysis and optimization
- shadcn-style registry
- Advanced code generation

## 🔧 Technical Stack

### Core Technologies
- **Graph Engine**: `@rune/behave-graph-core` (existing)
- **Scene System**: `@rune/behave-graph-scene` (reference for patterns)
- **Figma Integration**: `mcp-figma-to-react` (existing, to be enhanced)
- **Web Studio**: React + Remix + Tailwind CSS
- **Project Management**: File system + IndexedDB storage

### Platform Implementations
- **React**: `@rune/platform-react` (new)
- **SwiftUI**: `@rune/platform-swiftui` (future)
- **Flutter**: `@rune/platform-flutter` (future)

### Development Tools
- **CLI**: `@rune/cli` (new)
- **Studio**: Web-based visual editor with project management (new)
- **Registry**: Component distribution system (future)

## 📖 Reading Guide

### For Developers
1. Start with [Studio Evolution Plan](./studio-evolution-plan.md) to understand project-centric approach
2. Read [Figma to Graph Runtime](./figma-to-graph-runtime.md) for core concepts
3. Review [Platform Architecture](./modular-platform-architecture.md) for scaling strategy

### For Designers
1. Begin with [Studio Evolution: Project Workflow](./studio-evolution-plan.md#project-data-management)
2. Understand [Figma to Graph Runtime: Workflow Examples](./figma-to-graph-runtime.md#workflow-examples)
3. See [Platform Architecture: CLI Interface](./modular-platform-architecture.md#cli-interface)

### For Product Managers
1. Review [Project Vision](#project-vision) above
2. Study [Implementation Phases](#implementation-phases) for timeline
3. Examine [Platform Architecture: Benefits](./modular-platform-architecture.md#benefits)

### For LLMs/AI Assistants
1. **Context**: This is a visual development platform combining Figma, graph programming, and multi-platform deployment with project-based organization
2. **Current State**: Working graph editor demo at `apps/web/app/routes/behave-graph.tsx`
3. **Goal**: Evolution to full project-centric studio while preserving existing functionality
4. **Architecture**: Project-first approach with platform-agnostic core and platform-specific adapters
5. **Implementation**: Incremental phases starting with project management, then React platform

## 🎯 Success Metrics

### Technical Goals
- [ ] Project creation → Working React component in < 5 minutes
- [ ] Graph logic reusable across platforms (React, SwiftUI, Flutter)
- [ ] Studio preserves all current `behave-graph.tsx` functionality
- [ ] Platform abstraction supports 3+ UI frameworks
- [ ] Projects save/load reliably with `rune.json` configuration

### User Experience Goals
- [ ] Designers can create and manage projects without coding
- [ ] Developers can extend projects with custom nodes
- [ ] Components integrate seamlessly with existing projects
- [ ] Visual programming feels intuitive and powerful
- [ ] Project sharing and collaboration is straightforward

### Project Management Goals
- [ ] Clear project organization and discovery
- [ ] Reliable project persistence and backup
- [ ] Smooth project import/export workflow
- [ ] Efficient project switching and multi-project support

## 🔗 External References

- **Behave Graph Core**: Foundation graph engine
- **Behave Graph Scene**: Reference implementation for 3D scene manipulation
- **MCP Figma to React**: Existing Figma import functionality
- **shadcn/ui**: Target component distribution model

---

*This documentation provides a complete roadmap for building Rune, from current demo to full multi-platform visual development studio with comprehensive project management.* 