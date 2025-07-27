import { configureStore } from '@reduxjs/toolkit'
import polesReducer from './slices/polesSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    poles: polesReducer,
    ui: uiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Exportar el tipo del store para debugging
export type AppStore = typeof store