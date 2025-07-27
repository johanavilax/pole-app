import React, { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../hooks/redux";
import { useCanvas } from "../contexts/CanvasContext";
import {
  addPole,
  selectPole,
  deselectAllPoles,
  type Pole,
} from "../store/slices/polesSlice";
import { setSelectedProfile } from "../store/slices/uiSlice";
import PoleInfo from "./PoleInfo";

const Canvas2D: React.FC = () => {
  const dispatch = useAppDispatch();
  const { canvas2DRef } = useCanvas();
  const { poles, selectedPoleId } = useAppSelector((state) => state.poles);
  const { selectedProfile, isGridVisible, gridSize } = useAppSelector(
    (state) => state.ui
  );

  const selectedPole = poles.find((pole) => pole.id === selectedPoleId);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Define the SnapPoint type
  type SnapPoint = {
    x: number;
    y: number;
    type: "ground" | "pole-top";
    poleId?: string;
  };

  // Required states for zoom and pan
  const [snapPoints, setSnapPoints] = useState<SnapPoint[]>([]);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Set cursor style based on selected profile
  useEffect(() => {
    const canvas = canvas2DRef.current;
    if (!canvas) return;

    if (selectedProfile) {
      canvas.style.cursor = "crosshair";
    } else {
      canvas.style.cursor = "default";
    }
  }, [selectedProfile, canvas2DRef]);

  // Calculate snap points when profile is selected
  useEffect(() => {
    if (!selectedProfile) {
      setSnapPoints([]);
      return;
    }

    const canvas = canvas2DRef.current;
    if (!canvas) return;

    const points: Array<{
      x: number;
      y: number;
      type: "ground" | "pole-top";
      poleId?: string;
    }> = [];

    const floorY = (canvas.height - 50) / zoom;
    
    // Add ground snap points
    for (let x = 50 / zoom; x < (canvas.width - 50) / zoom; x += 50 / zoom) {
      points.push({ x, y: floorY, type: "ground" });
    }

    // Add pole top snap points
    poles.forEach((pole) => {
      // Correct snap point calculation considering pole Y position
      const poleTopY = floorY - (pole.height * 100) - (pole.position.y * 100);
      points.push({
        x: pole.position.x,
        y: poleTopY,
        type: "pole-top",
        poleId: pole.id,
      });
    });

    setSnapPoints(points);
  }, [selectedProfile, poles, canvas2DRef, zoom]);

  useEffect(() => {
    const canvas = canvas2DRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left - pan.x) / zoom
      const y = (event.clientY - rect.top - pan.y) / zoom
      
      if (isPanning) {
        const deltaX = event.clientX - lastPanPoint.x
        const deltaY = event.clientY - lastPanPoint.y
        setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }))
        setLastPanPoint({ x: event.clientX, y: event.clientY })
        return
      }
      
      if (selectedProfile) {
        setMousePosition({ x, y });
      } else {
        setMousePosition(null);
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 1 || (event.button === 0 && event.ctrlKey)) { // Middle click or Ctrl+click
        setIsPanning(true)
        setLastPanPoint({ x: event.clientX, y: event.clientY })
        canvas.style.cursor = 'grabbing'
        event.preventDefault()
      }
    }

    const handleMouseUp = (event: MouseEvent) => {
      console.log(event)
      if (isPanning) {
        setIsPanning(false)
        canvas.style.cursor = selectedProfile ? 'crosshair' : 'default'
      }
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor))
      
      // Zoom towards mouse point
      const zoomRatio = newZoom / zoom
      setPan(prev => ({
        x: mouseX - (mouseX - prev.x) * zoomRatio,
        y: mouseY - (mouseY - prev.y) * zoomRatio
      }))
      
      setZoom(newZoom)
    }

    const handleClick = (event: MouseEvent) => {
      if (isPanning) return
      
      if (selectedProfile) {
        const rect = canvas.getBoundingClientRect()
        const x = (event.clientX - rect.left - pan.x) / zoom
        const y = (event.clientY - rect.top - pan.y) / zoom
        
        // Find closest snap point
        let closestSnap: SnapPoint | null = null
        let minDistance = 30 // Fixed distance, not adjusted by zoom
        
        snapPoints.forEach(point => {
          const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)
          if (distance < minDistance) {
            minDistance = distance
            closestSnap = point
          }
        })

        if (closestSnap) {
          let newPosition: { x: number, y: number }
          
          if ((closestSnap as SnapPoint).type === 'ground') {
            newPosition = { x: (closestSnap as SnapPoint).x, y: 0 }
          } else {
            const basePole = poles.find(p => p.id === (closestSnap as SnapPoint).poleId)
            if (basePole) {
              newPosition = { 
                x: basePole.position.x, 
                y: basePole.height
              }
            } else {
              newPosition = { x: (closestSnap as SnapPoint).x, y: 0 }
            }
          }
          
          dispatch(addPole({ profile: selectedProfile, position: newPosition }))
          dispatch(setSelectedProfile(null))
        }
      } else {
        // Handle pole selection with zoom
        const rect = canvas.getBoundingClientRect()
        const x = (event.clientX - rect.left - pan.x) / zoom
        const y = (event.clientY - rect.top - pan.y) / zoom
        
        let clickedPole = null
        for (const pole of poles) {
          const poleLeft = pole.position.x - 10
          const poleRight = pole.position.x + 10
          const poleTop = (canvas.height - 50) / zoom - (pole.height * 100) - (pole.position.y * 100)
          const poleBottom = (canvas.height - 50) / zoom - (pole.position.y * 100)
          
          if (x >= poleLeft && x <= poleRight && y >= poleTop && y <= poleBottom) {
            clickedPole = pole
            break
          }
        }
        
        if (clickedPole) {
          dispatch(selectPole(clickedPole.id))
        } else {
          dispatch(deselectAllPoles())
        }
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mouseup", handleMouseUp)
    canvas.addEventListener("wheel", handleWheel, { passive: false })
    canvas.addEventListener("click", handleClick)

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mouseup", handleMouseUp)
      canvas.removeEventListener("wheel", handleWheel)
      canvas.removeEventListener("click", handleClick)
    };
  }, [selectedProfile, snapPoints, poles, dispatch, canvas2DRef, zoom, pan, isPanning, lastPanPoint])

  useEffect(() => {
    const canvas = canvas2DRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawCanvas = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();

      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw floor line inside transformations
      drawFloorLine(ctx);

      if (isGridVisible) {
        drawGrid(ctx);
      }

      // Draw snap points when profile is selected
      if (selectedProfile && snapPoints.length > 0) {
        drawSnapPoints(ctx);
      }

      // Draw preview pole at mouse position
      if (selectedProfile && mousePosition) {
        drawPreviewPole(ctx);
      }

      poles.forEach((pole) => {
        drawPole2D(ctx, pole);
      });

      ctx.restore();

      // Draw zoom controls (outside transformation)
      drawZoomControls(ctx);
    };

    const drawZoomControls = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(10, canvas.height - 80, 120, 70)
      
      ctx.fillStyle = 'white'
      ctx.font = '12px Arial'
      ctx.fillText(`Zoom: ${(zoom * 100).toFixed(0)}%`, 15, canvas.height - 60)
      ctx.fillText('Wheel: Zoom', 15, canvas.height - 45)
      ctx.fillText('Ctrl+Click: Pan', 15, canvas.height - 30)
      ctx.fillText('Middle Click: Pan', 15, canvas.height - 15)
    }

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawCanvas();
    };

    const drawSnapPoints = (ctx: CanvasRenderingContext2D) => {
      snapPoints.forEach((point) => {
        ctx.save();
    
        if (point.type === "ground") {
          // Ground snap points - green circles
          ctx.fillStyle = "#27ae60";
          ctx.strokeStyle = "#2ecc71";
        } else {
          // Pole-top snap points - blue circles
          ctx.fillStyle = "#3498db";
          ctx.strokeStyle = "#2980b9";
        }
    
        const radius = Math.max(4, 8 / zoom); // Adjust radius by zoom
        const crossSize = Math.max(2, 4 / zoom); // Adjust cross by zoom
        
        ctx.lineWidth = Math.max(1, 2 / zoom);
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    
        // Add small cross in center
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(0.5, 1 / zoom);
        ctx.beginPath();
        ctx.moveTo(point.x - crossSize, point.y);
        ctx.lineTo(point.x + crossSize, point.y);
        ctx.moveTo(point.x, point.y - crossSize);
        ctx.lineTo(point.x, point.y + crossSize);
        ctx.stroke();
    
        ctx.restore();
      });
    };

    const drawPreviewPole = (ctx: CanvasRenderingContext2D) => {
      if (!mousePosition || !selectedProfile) return;

      // Find closest snap point
      let closestSnap: SnapPoint | null = null;
      let minDistance = 30;

      snapPoints.forEach((point) => {
        const distance = Math.sqrt(
          (mousePosition.x - point.x) ** 2 + (mousePosition.y - point.y) ** 2
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestSnap = point;
        }
      });

      if (closestSnap) {
        ctx.save();
        ctx.globalAlpha = 0.5;

        const previewHeight = 6; // Default height
        let baseY = (closestSnap as SnapPoint).y;

        if ((closestSnap as SnapPoint).type === "pole-top") {
          // Preview pole stacked on top of existing pole - add verification
          const basePole = poles.find((p) => p.id === closestSnap?.poleId);
          if (basePole) {
            baseY = (closestSnap as SnapPoint).y;
          }
        }

        // Draw preview pole
        ctx.strokeStyle = "#e74c3c";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo((closestSnap as SnapPoint).x, baseY);
        ctx.lineTo((closestSnap as SnapPoint).x, baseY - previewHeight * 100);
        ctx.stroke();

        // Highlight the snap point
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc((closestSnap as SnapPoint).x, baseY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    };

    const drawFloorLine = (ctx: CanvasRenderingContext2D) => {
      const floorY = (ctx.canvas.height - 50 - pan.y) / zoom;
      const viewXStart = -pan.x / zoom;
      const viewWidth = ctx.canvas.width / zoom;

      ctx.strokeStyle = "#8B4513";
      ctx.lineWidth = 6 / zoom;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(viewXStart, floorY);
      ctx.lineTo(viewXStart + viewWidth, floorY);
      ctx.stroke();

      // Add ground texture pattern
      ctx.strokeStyle = "#654321";
      ctx.lineWidth = 2 / zoom;
      const textureSpacing = 20;
      const startX = Math.floor(viewXStart / textureSpacing) * textureSpacing;
      for (let x = startX; x < viewXStart + viewWidth; x += textureSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, floorY + 2);
        ctx.lineTo(x + 10, floorY + 8);
        ctx.stroke();
      }

      // Add "GROUND LEVEL" label
      ctx.fillStyle = "#8B4513";
      ctx.font = `bold ${14 / zoom}px Arial`;
      ctx.fillText("GROUND LEVEL", viewXStart + 10 / zoom, floorY - 15 / zoom);
    };

    const drawGrid = (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 1 / zoom;

      const viewXStart = -pan.x / zoom;
      const viewYStart = -pan.y / zoom;
      const viewWidth = ctx.canvas.width / zoom;
      const viewHeight = ctx.canvas.height / zoom;

      const startX = Math.floor(viewXStart / gridSize) * gridSize;
      const startY = Math.floor(viewYStart / gridSize) * gridSize;

      for (let x = startX; x < viewXStart + viewWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, viewYStart);
        ctx.lineTo(x, viewYStart + viewHeight);
        ctx.stroke();
      }

      for (let y = startY; y < viewYStart + viewHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(viewXStart, y);
        ctx.lineTo(viewXStart + viewWidth, y);
        ctx.stroke();
      }
    };

    // In the drawPole2D function:
    const drawPole2D = (ctx: CanvasRenderingContext2D, pole: Pole) => {
    const { position, profile, selected, height } = pole;
    const floorY = ctx.canvas.height - 50;
    const scale = 100;
    
    ctx.save();
    // Correct position considering both X and Y
    ctx.translate(position.x, floorY - (position.y * scale));
    
    // Calculate line thickness based on profile dimensions
    let lineWidth = 2;
    
    switch (profile.type) {
      case "circular":
        lineWidth = Math.max(
          2,
          ((profile.dimensions.diameter || 0.3) * scale) / 10
        );
        break;
      case "rectangular":
        lineWidth = Math.max(
          2,
          Math.max(
            ((profile.dimensions.width || 0.3) * scale) / 10,
            ((profile.dimensions.height || 0.4) * scale) / 10
          )
        );
        break;
      case "i-beam":
      case "t-beam":
        lineWidth = Math.max(
          2,
          ((profile.dimensions.width || 0.2) * scale) / 10
        );
        break;
    }
    
    // Draw gray fill first
    ctx.strokeStyle = selected ? "#e74c3c" : "#808080"; // Gray for normal poles
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -height * scale);
    ctx.stroke();
    
    // Draw black borders
    ctx.strokeStyle = "#000000"; // Black borders
    ctx.lineWidth = 1;
    
    // Left border
    ctx.beginPath();
    ctx.moveTo(-lineWidth / 2, 0);
    ctx.lineTo(-lineWidth / 2, -height * scale);
    ctx.stroke();
    
    // Right border
    ctx.beginPath();
    ctx.moveTo(lineWidth / 2, 0);
    ctx.lineTo(lineWidth / 2, -height * scale);
    ctx.stroke();
    
    // Top border
    ctx.beginPath();
    ctx.moveTo(-lineWidth / 2, -height * scale);
    ctx.lineTo(lineWidth / 2, -height * scale);
    ctx.stroke();
    
    // Bottom border
    ctx.beginPath();
    ctx.moveTo(-lineWidth / 2, 0);
    ctx.lineTo(lineWidth / 2, 0);
    ctx.stroke();
    
    // If selected, add additional information
    if (selected) {
      // Draw marker at base
      ctx.fillStyle = "#e74c3c";
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    
      // Draw marker at top
      ctx.beginPath();
      ctx.arc(0, -height * scale, 4, 0, Math.PI * 2);
      ctx.fill();
    
      // Add information labels
      ctx.fillStyle = "#2c3e50";
      ctx.font = "12px Arial";
      ctx.textAlign = "left";
    
      // Height label
      ctx.fillText(`${height}m`, 10, (-height * scale) / 2);
    
      // Profile type label
      ctx.fillText(`${profile.type}`, 10, -height * scale - 10);
    
      // Dimension line to show height
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
    
      // Horizontal line at top
      ctx.beginPath();
      ctx.moveTo(5, -height * scale);
      ctx.lineTo(50, -height * scale);
      ctx.stroke();
    
      // Horizontal line at base
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(50, 0);
      ctx.stroke();
    
      // Vertical dimension line
      ctx.beginPath();
      ctx.moveTo(45, 0);
      ctx.lineTo(45, -height * scale);
      ctx.stroke();
    
      ctx.setLineDash([]); // Reset dashed line
    }
    
    ctx.restore();
    };
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [
    poles,
    selectedProfile,
    isGridVisible,
    gridSize,
    snapPoints,
    mousePosition,
    zoom,
    pan
  ]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvas2DRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      {selectedPole && <PoleInfo pole={selectedPole} />}

      {/* Instructions overlay when profile is selected */}
      {selectedProfile && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            fontSize: "12px",
          }}
        >
          <div>🟢 Green points: Ground anchor</div>
          <div>🔵 Blue points: Pole top anchor</div>
          <div>Move cursor close to a point to anchor</div>
        </div>
      )}
    </div>
  );
};

export default Canvas2D;
