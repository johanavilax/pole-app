import React, { createContext, useContext, useRef, type ReactNode } from 'react'

interface CanvasContextType {
  canvas2DRef: React.RefObject<HTMLCanvasElement>
  getCanvasCoordinates: (event: MouseEvent | React.MouseEvent) => { x: number; y: number } | null
  snapToGrid: (x: number, y: number, gridSize: number) => { x: number; y: number }
  clearCanvas: () => void
  exportCanvas: () => string | null
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined)



interface CanvasProviderProps {
  children: ReactNode
}

export const CanvasProvider: React.FC<CanvasProviderProps> = ({ children }) => {
  const canvas2DRef = useRef<HTMLCanvasElement>(null)

  const getCanvasCoordinates = (event: MouseEvent | React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvas2DRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  const snapToGrid = (x: number, y: number, gridSize: number): { x: number; y: number } => {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    }
  }

  const clearCanvas = () => {
    const canvas = canvas2DRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const exportCanvas = (): string | null => {
    const canvas = canvas2DRef.current
    if (!canvas) return null
    return canvas.toDataURL('image/png')
  }

  const value: CanvasContextType = {
    canvas2DRef: canvas2DRef as React.RefObject<HTMLCanvasElement>,
    getCanvasCoordinates,
    snapToGrid,
    clearCanvas,
    exportCanvas,
  }

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  )
}


// eslint-disable-next-line react-refresh/only-export-components
export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error("useCanvas must be used within a CanvasProvider");
  }
  return context;
};