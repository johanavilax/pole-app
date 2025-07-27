import React, { useState } from 'react'
import { useAppSelector, useAppDispatch } from '../hooks/redux'
import { setViewMode, setSelectedProfile, toggleGrid, toggleSnapToGrid } from '../store/slices/uiSlice'
import { clearAllPoles } from '../store/slices/polesSlice'
import { defaultProfiles } from '../store/slices/uiSlice'

const Toolbar: React.FC = () => {
  const dispatch = useAppDispatch()
  const { viewMode, selectedProfile, isGridVisible, snapToGrid } = useAppSelector(state => state.ui)
  const { poles } = useAppSelector(state => state.poles)
  
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const handleProfileSelect = (profile: typeof defaultProfiles[0]) => {
    dispatch(setSelectedProfile(profile))
    setOpenDropdown(null)
  }

  const handleViewModeChange = (mode: '2d' | '3d') => {
    dispatch(setViewMode(mode))
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all poles?')) {
      dispatch(clearAllPoles())
    }
  }

  const getProfileIcon = (type: string): string => {
    switch (type) {
      case 'circular': return '●'
      case 'rectangular': return '▭'
      case 'i-beam': return 'I'
      case 't-beam': return 'T'
      default: return '●'
    }
  }

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown)
  }

  const lampOptions = [
    { id: 'led-street', name: 'LED Street Light', icon: '💡' },
    { id: 'halogen', name: 'Halogen Light', icon: '🔆' },
    { id: 'solar', name: 'Solar Light', icon: '☀️' },
    { id: 'decorative', name: 'Decorative Light', icon: '✨' }
  ]

  const accessoryOptions = [
    { id: 'transformer', name: 'Transformer', icon: '⚡' },
    { id: 'cable', name: 'Cable', icon: '🔌' },
    { id: 'bracket', name: 'Bracket', icon: '🔧' },
    { id: 'sensor', name: 'Motion Sensor', icon: '👁️' }
  ]

  return (
    <div className="toolbar">
      {/* Poles Dropdown */}
      <div className="toolbar-section dropdown-section">
        <button 
          className={`dropdown-toggle ${openDropdown === 'poles' ? 'active' : ''}`}
          onClick={() => toggleDropdown('poles')}
        >
          Poles ▼
        </button>
        {openDropdown === 'poles' && (
          <div className="dropdown-menu">
            {defaultProfiles.map(profile => (
              <button
                key={profile.id}
                className={`dropdown-item ${
                  selectedProfile?.id === profile.id ? 'selected' : ''
                }`}
                onClick={() => handleProfileSelect(profile)}
              >
                <span>{getProfileIcon(profile.type)}</span>
                <span>{profile.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lamps Dropdown */}
      <div className="toolbar-section dropdown-section">
        <button 
          className={`dropdown-toggle ${openDropdown === 'lamps' ? 'active' : ''}`}
          onClick={() => toggleDropdown('lamps')}
        >
          Lamps ▼
        </button>
        {openDropdown === 'lamps' && (
          <div className="dropdown-menu">
            {lampOptions.map(lamp => (
              <button
                key={lamp.id}
                className="dropdown-item"
                onClick={() => {
                  console.log('Selected lamp:', lamp.name)
                  setOpenDropdown(null)
                }}
              >
                <span>{lamp.icon}</span>
                <span>{lamp.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Accessories Dropdown */}
      <div className="toolbar-section dropdown-section">
        <button 
          className={`dropdown-toggle ${openDropdown === 'accessories' ? 'active' : ''}`}
          onClick={() => toggleDropdown('accessories')}
        >
          Accessories ▼
        </button>
        {openDropdown === 'accessories' && (
          <div className="dropdown-menu">
            {accessoryOptions.map(accessory => (
              <button
                key={accessory.id}
                className="dropdown-item"
                onClick={() => {
                  console.log('Selected accessory:', accessory.name)
                  setOpenDropdown(null)
                }}
              >
                <span>{accessory.icon}</span>
                <span>{accessory.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* View Mode */}
      <div className="toolbar-section">
        <span className="toolbar-label">View:</span>
        <button
          className={`view-toggle ${viewMode === '2d' ? 'active' : ''}`}
          onClick={() => handleViewModeChange('2d')}
        >
          2D
        </button>
        <button
          className={`view-toggle ${viewMode === '3d' ? 'active' : ''}`}
          onClick={() => handleViewModeChange('3d')}
        >
          3D
        </button>
      </div>

      {/* Options */}
      <div className="toolbar-section">
        <span className="toolbar-label">Options:</span>
        <button
          className={`option-button ${isGridVisible ? 'active' : ''}`}
          onClick={() => dispatch(toggleGrid())}
        >
          Grid
        </button>
        <button
          className={`option-button ${snapToGrid ? 'active' : ''}`}
          onClick={() => dispatch(toggleSnapToGrid())}
        >
          Snap
        </button>
      </div>

      {/* Poles Count and Clear */}
      <div className="toolbar-section">
        <span className="toolbar-label">Poles: {poles.length}</span>
        <button
          className="clear-button"
          onClick={handleClearAll}
          disabled={poles.length === 0}
        >
          Clear All
        </button>
      </div>
    </div>
  )
}

export default Toolbar