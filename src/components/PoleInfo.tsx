import React, { useState } from 'react'
import { useAppDispatch, } from '../hooks/redux'
import { deletePole, updatePoleHeight, updatePoleProfile, deselectAllPoles, type Pole } from '../store/slices/polesSlice'
import { defaultProfiles } from '../store/slices/uiSlice'

interface PoleInfoProps {
  pole: Pole
}

const PoleInfo: React.FC<PoleInfoProps> = ({ pole }) => {
  const dispatch = useAppDispatch()
  const [height, setHeight] = useState(pole.height)

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este poste?')) {
      dispatch(deletePole(pole.id))
    }
  }

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight)
    dispatch(updatePoleHeight({ poleId: pole.id, height: newHeight }))
  }

  const handleProfileChange = (profileId: string) => {
    const newProfile = defaultProfiles.find(p => p.id === profileId)
    if (newProfile) {
      dispatch(updatePoleProfile({ poleId: pole.id, profile: newProfile }))
    }
  }

  const handleClose = () => {
    dispatch(deselectAllPoles())
  }

  return (
    <div className="pole-info">
      <div className="pole-info-header">
        <h3>Información del Poste</h3>
        <button className="close-button" onClick={handleClose}>×</button>
      </div>
      
      <div className="pole-info-content">
        <p><strong>ID:</strong> {pole.id}</p>
        
        <div className="profile-control">
          <label><strong>Tipo de Perfil:</strong></label>
          <select 
            value={pole.profile.id} 
            onChange={(e) => handleProfileChange(e.target.value)}
          >
            {defaultProfiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>
        
        <p><strong>Posición:</strong> ({Math.round(pole.position.x)}, {Math.round(pole.position.y)})</p>
        
        <div className="height-control">
          <label><strong>Altura (m):</strong></label>
          <input
            type="number"
            value={height}
            onChange={(e) => handleHeightChange(Number(e.target.value))}
            min="1"
            max="20"
            step="0.5"
          />
        </div>
        
        <div className="dimensions-info">
          <strong>Dimensiones:</strong>
          {pole.profile.type === 'circular' && (
            <p>Diámetro: {pole.profile.dimensions.diameter}m</p>
          )}
          {(pole.profile.type === 'rectangular' || pole.profile.type === 'i-beam' || pole.profile.type === 't-beam') && (
            <>
              <p>Ancho: {pole.profile.dimensions.width}m</p>
              <p>Alto: {pole.profile.dimensions.height}m</p>
            </>
          )}
        </div>
        
        <button className="delete-button" onClick={handleDelete}>
          Eliminar Poste
        </button>
      </div>
    </div>
  )
}

export default PoleInfo