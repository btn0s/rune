# Rune Documentation

A comprehensive visual development platform that transforms Figma designs into interactive applications across multiple platforms through visual graph programming.

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
   - **Purpose**: Migration strategy from current demo to full studio
   - **Scope**: Implementation roadmap preserving existing functionality
   - **Status**: ✅ Complete implementation plan
   - **Implements**: Both above architectures

## 🎯 Project Vision

### The Big Picture
```
Figma Design → Visual Graph Logic → Multi-Platform Apps
```

**Goal**: Enable designers and developers to create interactive applications through visual programming, starting with Figma designs and extending with graph-based logic that can target any platform.

### Key Principles
- **Visual-First**: Design drives development
- **Platform-Agnostic**: Write once, deploy everywhere
- **Graph-Powered**: Logic through visual programming
- **AI-Enhanced**: Smart optimization and code generation
- **Incremental**: Start simple, scale complexity

## 🏗️ System Architecture Overview

### Three-Layer Architecture

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

## 📚 Document Relationships

### Design Flow
1. **Start Here**: [Figma to Graph Runtime System](./figma-to-graph-runtime.md)
   - Understand the core concept and single-platform implementation
   - See the complete workflow from Figma to running React app

2. **Scale Up**: [Modular Platform Architecture](./modular-platform-architecture.md)
   - Learn how the system extends to multiple platforms
   - Understand platform abstraction and shared graph logic

3. **Build It**: [Studio Evolution Plan](./studio-evolution-plan.md)
   - Follow the implementation roadmap
   - Preserve existing functionality while building new features

### Cross-References

#### From Figma-to-Graph-Runtime → Platform Architecture
- **Section 2: AI Enhancement (Future)** → **Platform Architecture: Cross-Platform Graph Nodes**
- **Component Registry** → **Platform Architecture: Project Templates**
- **Runtime System** → **Platform Architecture: Core Abstractions**

#### From Platform Architecture → Studio Evolution
- **Studio Integration** → **Studio Evolution: Phase 4 Studio UI**
- **CLI Interface** → **Studio Evolution: Phase 1 Foundation**
- **Platform-Specific Implementations** → **Studio Evolution: Phase 2 Platform Registry**

#### From Studio Evolution → Implementation
- **Current State Analysis** → References existing `apps/web/app/routes/behave-graph.tsx`
- **Enhanced Flow Component** → Extends current `~/components/flow`
- **Platform Registry Pattern** → Implements **Platform Architecture: IPlatform**

## 🚀 Implementation Phases

### Phase 1: Foundation (Current → Studio)
**Documents**: [Studio Evolution Plan](./studio-evolution-plan.md#phase-1-preserve--extend-current-implementation)
- Preserve existing `behave-graph.tsx` demo
- Create studio route structure
- Extract reusable Flow components

### Phase 2: React Platform (Single Platform)
**Documents**: [Figma to Graph Runtime](./figma-to-graph-runtime.md#phase-1-core-system-no-ai)
- Implement Figma-to-React generator
- Build graph-React bridge
- Create component-specific nodes

### Phase 3: Platform Abstraction (Multi-Platform)
**Documents**: [Modular Platform Architecture](./modular-platform-architecture.md#core-architecture)
- Create `IPlatform` abstraction
- Implement React platform adapter
- Design cross-platform graph nodes

### Phase 4: Additional Platforms
**Documents**: [Platform Architecture: SwiftUI Platform](./modular-platform-architecture.md#swiftui-platform)
- SwiftUI implementation
- Flutter implementation
- Platform-specific optimizations

### Phase 5: AI Enhancement
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

### Platform Implementations
- **React**: `@rune/platform-react` (new)
- **SwiftUI**: `@rune/platform-swiftui` (future)
- **Flutter**: `@rune/platform-flutter` (future)

### Development Tools
- **CLI**: `@rune/cli` (new)
- **Studio**: Web-based visual editor (new)
- **Registry**: Component distribution system (future)

## 📖 Reading Guide

### For Developers
1. Start with [Studio Evolution Plan](./studio-evolution-plan.md) to understand current state
2. Read [Figma to Graph Runtime](./figma-to-graph-runtime.md) for core concepts
3. Review [Platform Architecture](./modular-platform-architecture.md) for scaling strategy

### For Designers
1. Begin with [Figma to Graph Runtime: Workflow Examples](./figma-to-graph-runtime.md#workflow-examples)
2. Understand [Studio Evolution: Target UI](./studio-evolution-plan.md#target-studio-architecture)
3. See [Platform Architecture: CLI Interface](./modular-platform-architecture.md#cli-interface)

### For Product Managers
1. Review [Project Vision](#project-vision) above
2. Study [Implementation Phases](#implementation-phases) for timeline
3. Examine [Platform Architecture: Benefits](./modular-platform-architecture.md#benefits)

### For LLMs/AI Assistants
1. **Context**: This is a visual development platform combining Figma, graph programming, and multi-platform deployment
2. **Current State**: Working graph editor demo at `apps/web/app/routes/behave-graph.tsx`
3. **Goal**: Evolution to full studio while preserving existing functionality
4. **Architecture**: Platform-agnostic core with platform-specific adapters
5. **Implementation**: Incremental phases starting with React platform

## 🎯 Success Metrics

### Technical Goals
- [ ] Figma design → Working React component in < 5 minutes
- [ ] Graph logic reusable across platforms (React, SwiftUI, Flutter)
- [ ] Studio preserves all current `behave-graph.tsx` functionality
- [ ] Platform abstraction supports 3+ UI frameworks

### User Experience Goals
- [ ] Designers can add interactivity without coding
- [ ] Developers can extend with custom nodes
- [ ] Components integrate seamlessly with existing projects
- [ ] Visual programming feels intuitive and powerful

## 🔗 External References

- **Behave Graph Core**: Foundation graph engine
- **Behave Graph Scene**: Reference implementation for 3D scene manipulation
- **MCP Figma to React**: Existing Figma import functionality
- **shadcn/ui**: Target component distribution model

---

*This documentation provides a complete roadmap for building Rune, from current demo to full multi-platform visual development studio.* 