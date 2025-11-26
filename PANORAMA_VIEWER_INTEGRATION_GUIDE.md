# Panorama Viewer Integration Guide

## Overview

This guide documents the integration issues and fixes for the Panorama Viewer component (`panorama-viewer2.tsx`) with the global graph store and properties panel. The main problem was inaccurate yaw/pitch handling, quantization errors, and lack of synchronization between user interactions, global state updates, and UI components.

## Key Issues Resolved

1. **Inaccurate Yaw/Pitch Handling**: Manual polling with rounding/thresholding caused stepped, laggy rotation. Replaced with event-driven updates using precise floats.
2. **Global State Synchronization**: Viewer didn't react to properties panel slider changes. Added direct store subscriptions.
3. **Unit Inconsistencies**: View360 library uses degrees for events but radians internally. Ensured all internal state uses degrees.
4. **Feedback Loops**: Implemented grace periods and source checking to prevent infinite loops between viewer and store.

## Architecture

- **Panorama Viewer**: Handles View360 library, hotspot calculations, and user interactions.
- **Global Store**: Manages panorama yaw/pitch state, updated by viewer and properties panel.
- **Properties Panel**: Provides UI sliders to adjust free-view rotation, updates global store.

## Key Files and Components

### 1. `components/editor/panorama-viewer2.tsx`

**Purpose**: Main panorama viewer component using View360 library.

**Key Features**:

- Subscribes to global store for yaw/pitch changes.
- Listens to `viewChange` events for precise user interaction updates.
- Calculates hotspots based on current yaw (free-view rotation).
- Prevents feedback loops with grace periods.

**Critical Code Sections**:

- `calculateHotspots`: Uses `currentYaw` (degrees) to position hotspots relative to free-view.
- `onViewChange`: Converts event pitch from radians to degrees, updates store.
- Global state effect: Applies normalized/clamped yaw/pitch to camera.
- Props effect: Syncs initial values from parent.

**Dependencies**: View360 library, graph store.

### 2. `stores/graph-store.ts`

**Purpose**: Zustand store for graph data and UI state.

**Relevant State**:

- `panoramaYaw`, `panoramaPitch`: Current free-view rotation (degrees).
- `panoramaLastUpdateSource`: Tracks who last updated (e.g., "viewer", "panel").
- `setPanoramaRotation`: Updates yaw/pitch with source.

**Key Methods**:

- `setPanoramaRotation(yaw, pitch, source)`: Sets state and timestamp.

### 3. `components/editor/properties-panel.tsx`

**Purpose**: UI panel for editing node/area properties, including free-view rotation slider.

**Relevant Code**:

- Free View Rotation slider: Updates `graphStore.setPanoramaRotation(nextYaw, panoramaPitch ?? 0, "panel")`.
- Uses `graphStore.panoramaPitch` for current pitch value.

## Synchronization Flow

1. **User drags in viewer**: `viewChange` event → Update local state → Debounced store update ("viewer").
2. **Slider in properties panel**: `onValueChange` → Update store ("panel").
3. **Store changes**: Viewer subscribes → Apply to camera and hotspots.
4. **Props from parent**: Sync initial values, avoid conflicts with grace periods.

## Common Pitfalls

- **Unit Mismatch**: Always use degrees for store/state, convert radians only for math.
- **Loop Prevention**: Check `panoramaSource` and timestamps.
- **Clamping**: Always clamp pitch to [-90, 90], normalize yaw to [0, 360).
- **Event Handling**: View360 `viewChange` provides yaw (degrees), pitch (radians) — convert accordingly.

## Testing

- Drag in viewer: Should update store and properties panel.
- Move slider: Should update viewer and hotspots.
- Switch nodes: Should reset to initial values without loops.

## Future Improvements

- Add pitch slider to properties panel.
- Optimize hotspot recalculation.
- Handle VR mode integration.
