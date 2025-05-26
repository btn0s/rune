# Studio-Project Integration

## Overview

The Rune Studio provides real-time visual programming capabilities by connecting the graph editor with generated React projects through a WebSocket-like bridge using `postMessage` communication.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Rune Studio                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │ Component       │ │ Graph Editor    │ │ Live Preview  │ │
│  │ Palette         │ │ (Flow)          │ │ (iframe)      │ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ postMessage
┌─────────────────────────────────────────────────────────────┐
│                Generated React Project                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │ Graph Bridge    │ │ Component State │ │ Live Render   │ │
│  │ (postMessage)   │ │ Management      │ │               │ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Communication Protocol

### Studio → Project Messages

```typescript
// Graph update message
{
  type: 'GRAPH_UPDATE',
  graph: GraphJSON
}
```

### Project → Studio Messages

```typescript
// Ready signal
{
  type: 'PROJECT_READY'
}

// Component event
{
  type: 'COMPONENT_EVENT',
  componentId: string,
  eventType: string,
  data: any
}
```

## Graph Nodes for Component Control

### `project/setProperty`
Updates component properties in real-time.

**Inputs:**
- `componentId` (string) - ID of the component to update
- `property` (string) - Property name (e.g., "className", "text")
- `value` (any) - New property value

**Example:**
```json
{
  "id": "set-style",
  "type": "project/setProperty",
  "parameters": {
    "componentId": { "value": "RuneOg" },
    "property": { "value": "className" },
    "value": { "value": "bg-blue-500 p-4 rounded-lg" }
  }
}
```

### `project/onComponentEvent`
Listens to component events (clicks, changes, etc.).

**Inputs:**
- `componentId` (string) - ID of the component to listen to
- `eventType` (string) - Event type ("click", "change", etc.)

**Outputs:**
- `eventData` (object) - Event data
- `flow` (flow) - Triggered when event occurs

## Generated Project Structure

### Graph-Aware Home Route

The generated `app/routes/home.tsx` includes:

1. **State Management**
   ```typescript
   const [componentProps, setComponentProps] = useState({
     RuneOg: { className: "" }
   });
   const [graphState, setGraphState] = useState(null);
   ```

2. **Message Listener**
   ```typescript
   useEffect(() => {
     const handleMessage = (event: MessageEvent) => {
       if (event.data.type === 'GRAPH_UPDATE') {
         processGraphNodes(event.data.graph);
       }
     };
     window.addEventListener('message', handleMessage);
   }, []);
   ```

3. **Graph Processing**
   ```typescript
   const processGraphNodes = (graph) => {
     graph.nodes.forEach(node => {
       if (node.type === 'project/setProperty') {
         // Update component properties
       }
     });
   };
   ```

4. **Dynamic Component Rendering**
   ```typescript
   <RuneOg 
     className={componentProps.RuneOg?.className || ""}
     {...componentProps.RuneOg}
   />
   ```

## Usage Examples

### Example 1: Change Component Style
1. Add `lifecycle/onStart` node
2. Connect to `project/setProperty` node
3. Set componentId="RuneOg", property="className", value="bg-red-500"
4. Component updates instantly in preview

### Example 2: Interactive Button
1. Add `project/onComponentEvent` node
2. Set componentId="Button", eventType="click"
3. Connect to `debug/log` to see click events
4. Click button in preview to trigger graph

## Development Workflow

1. **Create Project**: Generate React project with Figma components
2. **Open Studio**: Navigate to `/studio/projects/{projectId}`
3. **Auto-Start**: Project automatically starts on port 3001
4. **Live Edit**: Use graph editor to control components in real-time
5. **Debug**: Use debug panel to inspect graph state and component props

## Technical Details

### Project Generator Updates
- `updateHomeRoute()` now generates graph-aware components
- Components receive props from graph state
- PostMessage bridge handles studio communication

### Studio Interface
- Three-panel layout: Components | Graph | Preview
- Real-time iframe preview of generated project
- Graph changes instantly update preview

### Performance Considerations
- Graph updates are debounced to prevent excessive re-renders
- Only changed properties trigger component updates
- Debug panel is collapsible to reduce overhead

## Future Enhancements

1. **Bidirectional Communication**: Component events trigger graph nodes
2. **Advanced Animations**: Timeline-based property animations
3. **Multi-Component Graphs**: Control multiple components simultaneously
4. **State Persistence**: Save component state between sessions
5. **Hot Reload**: Update components without full page refresh

This integration provides the foundation for visual programming with immediate feedback, enabling designers and developers to create interactive applications through graph-based logic. 