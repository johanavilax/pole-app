import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface PoleProfile {
  id: string
  name: string
  type: 'circular' | 'rectangular' | 'i-beam' | 't-beam'
  dimensions: {
    width?: number
    height?: number
    diameter?: number
    thickness?: number
  }
}

export interface Pole {
  id: string
  profile: PoleProfile
  position: { x: number, y: number }
  height: number
  selected: boolean
}

interface PolesState {
  poles: Pole[]
  selectedPoleId: string | null
}

const initialState: PolesState = {
  poles: [],
  selectedPoleId: null,
}

const polesSlice = createSlice({
  name: 'poles',
  initialState,
  reducers: {
    addPole: (state, action: PayloadAction<{ profile: PoleProfile; position: { x: number; y: number } }>) => {
      const { profile, position } = action.payload
      const newPole: Pole = {
        id: `pole-${Date.now()}`,
        profile,
        position,
        height: 6,
        selected: false,
      }
      state.poles.push(newPole)
    },
    
    selectPole: (state, action: PayloadAction<string>) => {
      const poleId = action.payload
      state.poles.forEach(pole => {
        pole.selected = pole.id === poleId
      })
      state.selectedPoleId = poleId
    },
    
    deselectAllPoles: (state) => {
      state.poles.forEach(pole => {
        pole.selected = false
      })
      state.selectedPoleId = null
    },
    
    deletePole: (state, action: PayloadAction<string>) => {
      const poleId = action.payload
      state.poles = state.poles.filter(pole => pole.id !== poleId)
      if (state.selectedPoleId === poleId) {
        state.selectedPoleId = null
      }
    },
    
    updatePoleHeight: (state, action: PayloadAction<{ poleId: string; height: number }>) => {
      const { poleId, height } = action.payload
      const pole = state.poles.find(p => p.id === poleId)
      if (pole) {
        pole.height = height
      }
    },
    
    updatePolePosition: (state, action: PayloadAction<{ poleId: string; position: { x: number; y: number } }>) => {
      const { poleId, position } = action.payload
      const pole = state.poles.find(p => p.id === poleId)
      if (pole) {
        pole.position = position
      }
    },
    
    updatePoleProfile: (state, action: PayloadAction<{ poleId: string; profile: PoleProfile }>) => {
      const { poleId, profile } = action.payload
      const pole = state.poles.find(p => p.id === poleId)
      if (pole) {
        pole.profile = profile
      }
    },
    
    clearAllPoles: (state) => {
      state.poles = []
      state.selectedPoleId = null
    },
  },
})

export const {
  addPole,
  selectPole,
  deselectAllPoles,
  deletePole,
  updatePoleHeight,
  updatePolePosition,
  updatePoleProfile, // Agregar esta nueva acción
  clearAllPoles,
} = polesSlice.actions

export default polesSlice.reducer