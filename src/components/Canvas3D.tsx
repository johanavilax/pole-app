import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import type { Pole } from "../store/slices/polesSlice";
import { addPole, deselectAllPoles, selectPole } from "../store/slices/polesSlice";
import { setSelectedProfile } from "../store/slices/uiSlice";
import PoleInfo from "./PoleInfo";

const Canvas3D: React.FC = () => {
  const dispatch = useAppDispatch();
  const { poles, selectedPoleId } = useAppSelector((state) => state.poles);
  const { isGridVisible, selectedProfile } = useAppSelector((state) => state.ui);

  const selectedPole = poles.find((pole) => pole.id === selectedPoleId);

  // Calcular la posición central basada en los postes existentes
  const getCameraTarget = () => {
    if (poles.length === 0) {
      return [0, 2, 0]; // Posición por defecto
    }
    
    // Si hay un solo poste, centrarse en él
    if (poles.length === 1) {
      const pole = poles[0];
      return [(pole.position.x - 400) / 100, pole.height / 2, 0];
    }
    
    // Si hay múltiples postes, calcular el centro
    const avgX = poles.reduce((sum, pole) => sum + (pole.position.x - 400) / 100, 0) / poles.length;
    const avgHeight = poles.reduce((sum, pole) => sum + pole.height, 0) / poles.length;
    return [avgX, avgHeight / 2, 0];
  };

  const FloorPlane: React.FC = () => {
    return (
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#8B4513" 
          metalness={0.1} 
          roughness={0.8}
          transparent
          opacity={0.8}
        />
      </mesh>
    )
  }

  const Pole3D: React.FC<{ pole: Pole }> = ({ pole }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { profile, position, height, selected } = pole;

    const getGeometry = () => {
      const geometryMap = {
        circular: () => {
          const radius = (profile.dimensions.diameter || 0.3) / 2;
          return <cylinderGeometry args={[radius, radius, height, 16]} />;
        },
        rectangular: () => {
          const width = profile.dimensions.width || 0.3;
          const depth = profile.dimensions.height || 0.4;
          return <boxGeometry args={[width, height, depth]} />;
        },
        "i-beam": () => {
          // Para el perfil I, usamos una geometría más compleja
          const iWidth = profile.dimensions.width || 0.2;
          const iHeight = profile.dimensions.height || 0.4;
          return <boxGeometry args={[iWidth, height, iHeight]} />;
        },
        "t-beam": () => {
          // Para el perfil T, usamos una geometría simplificada
          const tWidth = profile.dimensions.width || 0.3;
          const tHeight = profile.dimensions.height || 0.3;
          return <boxGeometry args={[tWidth, height, tHeight]} />;
        },
      };

      const geometryFunction =
        geometryMap[profile.type as keyof typeof geometryMap];
      return geometryFunction ? (
        geometryFunction()
      ) : (
        <cylinderGeometry args={[0.15, 0.15, height, 8]} />
      );
    };

    return (
      <mesh
        ref={meshRef}
        position={[
          (position.x - 400) / 100, // Ajustar escala para coincidir con 2D
          height / 2, 
          0 // Mantener en el plano Z=0 para vista lateral
        ]}
        onClick={(event) => {
          event.stopPropagation();
          dispatch(selectPole(pole.id));
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!selectedProfile) {
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (!selectedProfile) {
            document.body.style.cursor = "default";
          } else {
            document.body.style.cursor = "crosshair";
          }
        }}
      >
        {getGeometry()}
        <meshStandardMaterial
          color={selected ? "#e74c3c" : "#808080"} // Gris para postes normales, rojo para seleccionados
          metalness={0.1}
          roughness={0.8}
        />
        {/* Agregar bordes negros */}
        <lineSegments>
          <edgesGeometry args={[meshRef.current?.geometry]} />
          <lineBasicMaterial color="#000000" linewidth={2} />
        </lineSegments>
        {selected && (
          <meshBasicMaterial
            wireframe
            color="#ffffff"
            transparent
            opacity={0.3}
          />
        )}
      </mesh>
    );
  };

  // Invisible plane to catch clicks for adding poles
  const ClickPlane: React.FC = () => {
    return (
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(event) => {
          if (selectedProfile) {
            event.stopPropagation();
            const { point } = event;
            // Ajustar las coordenadas para que coincidan exactamente con el 2D
            const newPosition = { 
              x: (point.x * 100) + 400, // Ajustar escala y offset
              y: 0 
            };
            dispatch(addPole({ profile: selectedProfile, position: newPosition }));
            dispatch(setSelectedProfile(null));
          } else {
            dispatch(deselectAllPoles());
          }
        }}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    );
  };

  // Set cursor style based on selected profile
  useEffect(() => {
    const canvasElement = document.querySelector('canvas');
    if (!canvasElement) return;

    if (selectedProfile) {
      canvasElement.style.cursor = 'crosshair';
      document.body.style.cursor = 'crosshair';
    } else {
      canvasElement.style.cursor = 'default';
      document.body.style.cursor = 'default';
    }

    return () => {
      document.body.style.cursor = 'default';
    };
  }, [selectedProfile]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas
        camera={{ 
          position: [0, 3, 12], // Posición más cercana para mejor vista
          fov: 60,
          up: [0, 1, 0]
        }}
        style={{ background: "#87CEEB" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />

        <ClickPlane />
        <FloorPlane />

        {isGridVisible && (
          <Grid
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            cellColor={"#6f6f6f"}
            sectionSize={5}
            sectionThickness={1}
            sectionColor={"#9d4b4b"}
            fadeDistance={30}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={true}
            position={[0, 0, 0]}
          />
        )}

        {poles.map((pole) => (
          <Pole3D key={pole.id} pole={pole} />
        ))}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          rotateSpeed={0.3}
          zoomSpeed={0.5}
          panSpeed={0.5}
          maxPolarAngle={Math.PI * 0.8}
          minPolarAngle={Math.PI * 0.1}
          minDistance={3}
          maxDistance={25}
          target={getCameraTarget() as [number, number, number]} // Centrar dinámicamente en los postes
          enableDamping={true}
          dampingFactor={0.1}
        />
      </Canvas>

      {selectedPole && <PoleInfo pole={selectedPole} />}
    </div>
  );
};

export default Canvas3D;
