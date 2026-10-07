import React, { useEffect, useRef, useState } from 'react';
import { Compass, ZoomIn, ZoomOut, RotateCcw, MapPin, Navigation } from 'lucide-react';
import { POŽAREVAC_POIS, PožarevacPoi } from '../services/pozaravacPoi';
import { TurfZone, DynamicMission } from '../services/dynamicMissionEngine';
import { Quest } from '../services/characterProgress';

export interface PožarevacMiniMapProps {
  playerPos: { x: number; z: number; heading: number };
  nearPoi?: PožarevacPoi | null;
  onSelectPoi?: (poi: PožarevacPoi) => void;
  pois?: PožarevacPoi[];
  activeMission?: Quest | DynamicMission;
  turfZones?: TurfZone[];
}

export const PožarevacMiniMap: React.FC<PožarevacMiniMapProps> = ({
  playerPos,
  nearPoi,
  onSelectPoi,
  pois = POŽAREVAC_POIS,
  activeMission,
  turfZones = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.2); // 1.0x to 2.2x
  const [isRotatingMode, setIsRotatingMode] = useState<boolean>(true); // Rotate map with heading vs North-Up

  // Real GPS coordinates (Požarevac Center: 44.6199° N, 21.1865° E)
  const latDisplay = (44.6199 + playerPos.z * 0.0001).toFixed(4);
  const lonDisplay = (21.1865 + playerPos.x * 0.0001).toFixed(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let sweepAngle = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      sweepAngle += 0.035;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = width / 2 - 4;

      ctx.clearRect(0, 0, width, height);

      // Save initial state
      ctx.save();

      // Circular clip mask for radar frame
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      // Base background: Deep satellite slate
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Camera transformation: Center on player
      ctx.save();
      ctx.translate(centerX, centerY);

      if (isRotatingMode) {
        // Rotate map so player heading always points UP
        ctx.rotate(-playerPos.heading);
      }

      // World scale factor: 3D world is [-36, +36] meters
      const worldScale = (radius / 36) * zoomLevel;

      // Translate world so player is at center
      ctx.translate(-playerPos.x * worldScale, -playerPos.z * worldScale);

      // 1. Turf Zones Territory Shading
      turfZones.forEach((zone) => {
        const zx = zone.centerCoords.x * worldScale;
        const zz = zone.centerCoords.z * worldScale;
        ctx.fillStyle = `${zone.color}22`; // ~13% opacity
        ctx.beginPath();
        ctx.arc(zx, zz, 9 * worldScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `${zone.color}66`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // 2. Urban Blocks / Lots
      ctx.fillStyle = '#1e293b';
      const drawBlock = (x: number, z: number, w: number, d: number) => {
        ctx.fillRect(x * worldScale, z * worldScale, w * worldScale, d * worldScale);
      };
      drawBlock(-15, -24, 8, 16);
      drawBlock(7, -24, 8, 16);
      drawBlock(-15, 8, 8, 16);
      drawBlock(7, 8, 8, 16);
      drawBlock(-28, -12, 10, 24);
      drawBlock(18, -12, 10, 24);

      // 3. Gradski Park (Green zone)
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.roundRect(-22 * worldScale, 6 * worldScale, 14 * worldScale, 18 * worldScale, 12);
      ctx.fill();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 4. Čačalica Hill (Forest zone)
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.ellipse(20 * worldScale, 16 * worldScale, 14 * worldScale, 11 * worldScale, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // 5. Hipodrom (Sand racetrack oval)
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2.5 * worldScale;
      ctx.beginPath();
      ctx.ellipse(22 * worldScale, -13 * worldScale, 6 * worldScale, 4 * worldScale, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 6. Stari Korzo Pedestrian Promenade (Terracotta pavers)
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 4 * worldScale;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(14 * worldScale, -8 * worldScale);
      ctx.stroke();

      // 7. Street Network Asphalt
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3.5 * worldScale;
      ctx.beginPath();
      ctx.moveTo(-18 * worldScale, -35 * worldScale);
      ctx.lineTo(-18 * worldScale, 35 * worldScale);
      ctx.moveTo(18 * worldScale, -35 * worldScale);
      ctx.lineTo(18 * worldScale, 35 * worldScale);
      ctx.moveTo(-35 * worldScale, -14 * worldScale);
      ctx.lineTo(35 * worldScale, -14 * worldScale);
      ctx.moveTo(-35 * worldScale, 14 * worldScale);
      ctx.lineTo(35 * worldScale, 14 * worldScale);
      ctx.stroke();

      // Main Boulevards: Tabačka Čaršija (N-S) & Voje Dulića (E-W)
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 5.2 * worldScale;
      ctx.beginPath();
      // Tabačka Čaršija
      ctx.moveTo(0, -36 * worldScale);
      ctx.lineTo(0, 36 * worldScale);
      // Voje Dulića
      ctx.moveTo(-36 * worldScale, 0);
      ctx.lineTo(36 * worldScale, 0);
      ctx.stroke();

      // Yellow Centerline Dividers
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -36 * worldScale);
      ctx.lineTo(0, 36 * worldScale);
      ctx.moveTo(-36 * worldScale, 0);
      ctx.lineTo(36 * worldScale, 0);
      ctx.stroke();

      // Central Plaza Roundabout (Trg Oslobođenja)
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5 * worldScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(0, 0, 2.0 * worldScale, 0, Math.PI * 2);
      ctx.fill();

      // 8. POI Locations on 2D map
      pois.forEach((poi) => {
        const poiX = poi.coords.x * worldScale;
        const poiZ = poi.coords.z * worldScale;
        const isNear = nearPoi?.id === poi.id;

        const poiColor =
          poi.category === 'park'
            ? '#22c55e'
            : poi.category === 'commercial'
            ? '#06b6d4'
            : poi.category === 'hq'
            ? '#a855f7'
            : '#eab308';

        // Outer pulse ring if near
        if (isNear) {
          ctx.strokeStyle = poiColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(poiX, poiZ, (6 + Math.sin(sweepAngle * 3) * 2) * (zoomLevel > 1.4 ? 1 : 0.8), 0, Math.PI * 2);
          ctx.stroke();
        }

        // POI Marker Dot
        ctx.fillStyle = poiColor;
        ctx.beginPath();
        ctx.arc(poiX, poiZ, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Label if zoomed in
        if (zoomLevel > 1.25) {
          ctx.font = 'bold 8px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(poi.name.slice(0, 10), poiX, poiZ - 6);
        }
      });

      // 9. Active Mission Beacon
      if (activeMission && 'targetCoords' in activeMission) {
        const mx = activeMission.targetCoords.x * worldScale;
        const mz = activeMission.targetCoords.z * worldScale;
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(mx, mz, 7 + Math.sin(sweepAngle * 4) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(mx, mz, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore(); // Undo world translate & rotation

      // 10. Radar HUD Elements (Drawn in screen space)
      // Radar Rings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      [0.35, 0.65, 0.95].forEach((pct) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * pct, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Rotating Radar Sweep Line
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(sweepAngle);
      const grad = ctx.createLinearGradient(0, 0, radius, 0);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0.35)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, 0, 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Player Blip at Center
      ctx.save();
      ctx.translate(centerX, centerY);
      if (!isRotatingMode) {
        ctx.rotate(playerPos.heading);
      }
      // Directional Player Arrow (Cyan Triad)
      ctx.fillStyle = '#06b6d4';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(5, 5);
      ctx.lineTo(0, 2);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Cardinal North Indicator
      ctx.restore(); // Undo clip

      // Border Ring
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // North Mark
      const northAngle = isRotatingMode ? -playerPos.heading : 0;
      const nx = centerX + Math.sin(northAngle) * (radius - 8);
      const ny = centerY - Math.cos(northAngle) * (radius - 8);
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', nx, ny);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [playerPos, nearPoi, pois, activeMission, turfZones, zoomLevel, isRotatingMode]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          className="rounded-full shadow-lg shadow-cyan-950/50 block"
        />

        {/* Radar Controls Toolbar */}
        <div className="absolute -bottom-1 -right-1 flex flex-col gap-1">
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.2, z + 0.3))}
            className="w-5 h-5 rounded-md bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center transition shadow cursor-pointer text-[10px]"
            title="Približi (Zoom In)"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.3))}
            className="w-5 h-5 rounded-md bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center transition shadow cursor-pointer text-[10px]"
            title="Udalji (Zoom Out)"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsRotatingMode(!isRotatingMode)}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition shadow cursor-pointer text-[10px] ${
              isRotatingMode
                ? 'bg-cyan-600/80 text-white border-cyan-400'
                : 'bg-slate-900/90 text-slate-400 border-slate-700'
            }`}
            title={isRotatingMode ? 'Smer Kretanja (Heading Up)' : 'Sever Gore (North Up)'}
          >
            <Navigation className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
