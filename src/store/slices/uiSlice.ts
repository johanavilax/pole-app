import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { PoleProfile } from './polesSlice'

interface UIState {
  viewMode: '2d' | '3d'
  selectedProfile: PoleProfile | null
  isGridVisible: boolean
  snapToGrid: boolean
  gridSize: number
  zoom: number
  pan: { x: number; y: number }
}

const defaultProfiles: PoleProfile[] = [
  {
    id: 'circular',
    name: 'Circular',
    type: 'circular',
    dimensions: { diameter: 0.3, thickness: 0.01 }
  },
  {
    id: 'rectangular',
    name: 'Rectangular',
    type: 'rectangular',
    dimensions: { width: 0.3, height: 0.4, thickness: 0.01 }
  },
  {
    id: 'i-beam',
    name: 'I-Beam',
    type: 'i-beam',
    dimensions: { width: 0.2, height: 0.4, thickness: 0.01 }
  },
  {
    id: 't-beam',
    name: 'T-Beam',
    type: 't-beam',
    dimensions: { width: 0.3, height: 0.3, thickness: 0.01 }
  }
]

const initialState: UIState = {
  viewMode: '2d',
  selectedProfile: null,
  isGridVisible: true,
  snapToGrid: true,
  gridSize: 50,
  zoom: 1,
  pan: { x: 0, y: 0 }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setViewMode: (state, action: PayloadAction<'2d' | '3d'>) => {
      state.viewMode = action.payload
    },
    
    setSelectedProfile: (state, action: PayloadAction<PoleProfile | null>) => {
      state.selectedProfile = action.payload
    },
    
    toggleGrid: (state) => {
      state.isGridVisible = !state.isGridVisible
    },
    
    toggleSnapToGrid: (state) => {
      state.snapToGrid = !state.snapToGrid
    },
    
    setGridSize: (state, action: PayloadAction<number>) => {
      state.gridSize = action.payload
    },
    
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = Math.max(0.1, Math.min(5, action.payload))
    },
    
    zoomIn: (state) => {
      state.zoom = Math.max(0.1, Math.min(5, state.zoom * 1.2))
    },
    
    zoomOut: (state) => {
      state.zoom = Math.max(0.1, Math.min(5, state.zoom / 1.2))
    },
    
    resetZoom: (state) => {
      state.zoom = 1
      state.pan = { x: 0, y: 0 }
    },
    
    setPan: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.pan = action.payload
    }
  },
})

export const {
  setViewMode,
  setSelectedProfile,
  toggleGrid,
  toggleSnapToGrid,
  setGridSize,
  setZoom,
  zoomIn,
  zoomOut,
  resetZoom,
  setPan
} = uiSlice.actions

export { defaultProfiles }
export default uiSlice.reducer