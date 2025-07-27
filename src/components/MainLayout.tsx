import React from 'react'
import { useAppSelector } from '../hooks/redux'
import Toolbar from './Toolbar'
import Canvas2D from './Canvas2D'
import Canvas3D from './Canvas3D'

const MainLayout: React.FC = () => {
  const viewMode = useAppSelector(state => state.ui.viewMode)

  return (
    <>
      <Toolbar />
      <div className="canvas-container">
        {viewMode === '2d' ? <Canvas2D /> : <Canvas3D />}
      </div>
    </>
  )
}

export default MainLayout