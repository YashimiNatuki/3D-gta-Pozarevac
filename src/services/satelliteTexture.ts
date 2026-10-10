import * as THREE from 'three';

/** Creates the art-directed fallback map. This is not satellite imagery or survey geometry. */
export function createPozarevacStylizedGroundTexture(): THREE.CanvasTexture {
  const size = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // 1. Base Terrain / Urban Ground (Crisp slate-gray aerial concrete foundation)
  ctx.fillStyle = '#2d3748';
  ctx.fillRect(0, 0, size, size);

  // Subtle aerial concrete / pavement noise
  for (let i = 0; i < 6000; i++) {
    const rx = Math.random() * size;
    const ry = Math.random() * size;
    const rad = Math.random() * 4 + 1;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(74, 85, 104, 0.45)' : 'rgba(45, 55, 72, 0.4)';
    ctx.beginPath();
    ctx.arc(rx, ry, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. City Block Foundations (Lighter gray concrete yards & residential paving)
  const drawUrbanPlot = (x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = '#3f4c61';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#5a6b82';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
  };

  drawUrbanPlot(size * 0.1, size * 0.1, size * 0.35, size * 0.35);
  drawUrbanPlot(size * 0.55, size * 0.1, size * 0.35, size * 0.35);
  drawUrbanPlot(size * 0.55, size * 0.55, size * 0.35, size * 0.35);

  // 3. Gradski Park (Top-Left quadrant - Vibrant lush green park)
  const parkX = size * 0.14;
  const parkY = size * 0.53;
  const parkW = size * 0.32;
  const parkH = size * 0.36;

  // Rich green lawn base
  ctx.fillStyle = '#1e6f3d';
  ctx.beginPath();
  ctx.roundRect(parkX, parkY, parkW, parkH, 30);
  ctx.fill();
  ctx.strokeStyle = '#27ae60';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Park grass texture & tree clusters
  for (let k = 0; k < 1200; k++) {
    const px = parkX + Math.random() * parkW;
    const py = parkY + Math.random() * parkH;
    const rad = Math.random() * 12 + 6;
    ctx.fillStyle = Math.random() > 0.4 ? 'rgba(39, 174, 96, 0.65)' : 'rgba(26, 115, 60, 0.7)';
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Park gravel walkways (Warm stone beige paths)
  ctx.strokeStyle = '#e2c59b';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(parkX + 40, parkY + parkH / 2);
  ctx.bezierCurveTo(parkX + parkW * 0.4, parkY + parkH * 0.2, parkX + parkW * 0.6, parkY + parkH * 0.8, parkX + parkW - 40, parkY + parkH / 2);
  ctx.stroke();

  // 4. Čačalica Hill (Bottom-Right quadrant deep natural woodland)
  ctx.fillStyle = '#14532d';
  ctx.beginPath();
  ctx.ellipse(size * 0.78, size * 0.78, size * 0.18, size * 0.16, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 8;
  ctx.stroke();

  for (let c = 0; c < 800; c++) {
    const cx = size * 0.7 + Math.random() * (size * 0.18);
    const cy = size * 0.7 + Math.random() * (size * 0.18);
    ctx.fillStyle = 'rgba(22, 101, 52, 0.7)';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.random() * 16 + 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. STARI KORZO PEDESTRIAN PROMENADE (Terracotta European pedestrian pavers)
  ctx.fillStyle = '#b45309'; // Warm pedestrian paving
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.5);
  ctx.lineTo(size * 0.8, size * 0.35);
  ctx.lineTo(size * 0.82, size * 0.39);
  ctx.lineTo(size * 0.52, size * 0.54);
  ctx.closePath();
  ctx.fill();

  // Korzo cobblestone pattern lines
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  for (let step = 0; step < 20; step++) {
    const t = step / 20;
    const x1 = size * 0.5 + t * (size * 0.3);
    const y1 = size * 0.5 - t * (size * 0.15);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + 18, y1 + 36);
    ctx.stroke();
  }

  // 6. CRISP ROAD ASPHALT & SIDEWALKS NETWORK OF POŽAREVAC
  // A) Sidewalk borders (Light concrete curbs)
  ctx.strokeStyle = '#94a3b8'; // Light concrete curb
  ctx.lineWidth = 92;
  ctx.lineCap = 'square';

  // Tabačka Čaršija Sidewalk border
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.02);
  ctx.lineTo(size * 0.5, size * 0.98);
  ctx.stroke();

  // Voje Dulića Sidewalk border
  ctx.beginPath();
  ctx.moveTo(size * 0.05, size * 0.5);
  ctx.lineTo(size * 0.95, size * 0.5);
  ctx.stroke();

  // B) Fresh Dark Road Asphalt
  ctx.strokeStyle = '#1e293b'; // High-contrast clean dark asphalt
  ctx.lineWidth = 72;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Tabačka Čaršija (Main Boulevard running N-S through center)
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.02);
  ctx.lineTo(size * 0.5, size * 0.98);
  ctx.stroke();

  // Voje Dulića & Stari Centar Ring (E-W crossing)
  ctx.beginPath();
  ctx.moveTo(size * 0.05, size * 0.5);
  ctx.lineTo(size * 0.95, size * 0.5);
  ctx.stroke();

  // Secondary grid streets (Sinđelićeva, Moše Pijade, Nemanjina)
  ctx.strokeStyle = '#273549';
  ctx.lineWidth = 44;
  ctx.beginPath();
  ctx.moveTo(size * 0.3, size * 0.05);
  ctx.lineTo(size * 0.3, size * 0.95);
  ctx.moveTo(size * 0.7, size * 0.05);
  ctx.lineTo(size * 0.7, size * 0.95);
  ctx.moveTo(size * 0.08, size * 0.3);
  ctx.lineTo(size * 0.92, size * 0.3);
  ctx.moveTo(size * 0.08, size * 0.7);
  ctx.lineTo(size * 0.92, size * 0.7);
  ctx.stroke();

  // 7. CENTRAL PLAZA ROUNDABOUT (Trg Radomira Vujovića / Trg Oslobođenja)
  // Outer pedestrian plaza circle
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, 95, 0, Math.PI * 2);
  ctx.fill();

  // Decorative stone ring
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, 88, 0, Math.PI * 2);
  ctx.stroke();

  // Asphalt roundabout lane
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, 68, 0, Math.PI * 2);
  ctx.fill();

  // Central island with fountain water & monument
  ctx.fillStyle = '#0284c7'; // Sparkling fountain water
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Gold monument center point (Miloš Obrenović spomenik)
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, 12, 0, Math.PI * 2);
  ctx.fill();

  // 8. CRISP WHITE & YELLOW ROAD MARKINGS
  // Double solid yellow center divider on Tabačka Čaršija
  ctx.strokeStyle = '#fbbf24'; // Bright yellow
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(size * 0.5 - 4, size * 0.05);
  ctx.lineTo(size * 0.5 - 4, size * 0.42);
  ctx.moveTo(size * 0.5 + 4, size * 0.05);
  ctx.lineTo(size * 0.5 + 4, size * 0.42);
  ctx.moveTo(size * 0.5 - 4, size * 0.58);
  ctx.lineTo(size * 0.5 - 4, size * 0.95);
  ctx.moveTo(size * 0.5 + 4, size * 0.58);
  ctx.lineTo(size * 0.5 + 4, size * 0.95);
  ctx.stroke();

  // White dashed lane divider lines
  ctx.strokeStyle = '#f8fafc'; // Crisp bright white
  ctx.lineWidth = 4;
  ctx.setLineDash([26, 18]);
  ctx.beginPath();
  ctx.moveTo(size * 0.5 - 18, size * 0.06);
  ctx.lineTo(size * 0.5 - 18, size * 0.42);
  ctx.moveTo(size * 0.5 + 18, size * 0.06);
  ctx.lineTo(size * 0.5 + 18, size * 0.42);
  ctx.moveTo(size * 0.5 - 18, size * 0.58);
  ctx.lineTo(size * 0.5 - 18, size * 0.94);
  ctx.moveTo(size * 0.5 + 18, size * 0.58);
  ctx.lineTo(size * 0.5 + 18, size * 0.94);
  // Voje Dulića dashed
  ctx.moveTo(size * 0.08, size * 0.5);
  ctx.lineTo(size * 0.42, size * 0.5);
  ctx.moveTo(size * 0.58, size * 0.5);
  ctx.lineTo(size * 0.92, size * 0.5);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  // Zebra Crosswalks at central intersection
  const drawCrosswalk = (cx: number, cy: number, horizontal = true) => {
    ctx.fillStyle = '#ffffff';
    const numStripes = 8;
    for (let s = 0; s < numStripes; s++) {
      if (horizontal) {
        ctx.fillRect(cx - 32 + s * 9, cy - 18, 6, 36);
      } else {
        ctx.fillRect(cx - 18, cy - 32 + s * 9, 36, 6);
      }
    }
  };

  drawCrosswalk(size * 0.5, size * 0.42, true);
  drawCrosswalk(size * 0.5, size * 0.58, true);
  drawCrosswalk(size * 0.42, size * 0.5, false);
  drawCrosswalk(size * 0.58, size * 0.5, false);

  // 9. DETAILED SATELLITE BUILDING ROOFTOPS
  const roofColors = ['#475569', '#334155', '#64748b', '#52525b', '#3f3f46'];
  const drawRooftop = (x: number, y: number, w: number, h: number) => {
    // Sharp drop shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(x + 8, y + 8, w, h);

    // Main roof face
    ctx.fillStyle = roofColors[Math.floor(Math.random() * roofColors.length)];
    ctx.fillRect(x, y, w, h);

    // Crisp white parapet edge
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    // Rooftop vents / HVAC structures
    if (w > 45 && h > 45) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x + 10, y + 10, 14, 14);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + w - 24, y + h - 24, 16, 12);
    }
  };

  const buildingQuadrants = [
    { startX: size * 0.12, startY: size * 0.12, endX: size * 0.46, endY: size * 0.46 },
    { startX: size * 0.54, startY: size * 0.12, endX: size * 0.88, endY: size * 0.46 },
    { startX: size * 0.54, startY: size * 0.54, endX: size * 0.88, endY: size * 0.88 },
  ];

  buildingQuadrants.forEach((q) => {
    for (let bx = q.startX; bx < q.endX - 50; bx += 76) {
      for (let by = q.startY; by < q.endY - 50; by += 66) {
        if (Math.random() > 0.15) {
          const bw = Math.min(64, Math.random() * 22 + 44);
          const bh = Math.min(54, Math.random() * 20 + 38);
          drawRooftop(bx, by, bw, bh);
        }
      }
    }
  });

  // 10. CRISP ROAD NAMES & GPS LABELS (Visible from aerial or ground view)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 8;
  ctx.font = '900 26px sans-serif';

  ctx.fillStyle = '#38bdf8';
  ctx.fillText('⚡ TABAČKA ČARŠIJA ⚡', size * 0.52, size * 0.22);

  ctx.fillStyle = '#4ade80';
  ctx.fillText('🌳 GRADSKI PARK POŽAREVAC', size * 0.15, size * 0.52);

  ctx.fillStyle = '#fb923c';
  ctx.fillText('☕ STARI KORZO', size * 0.64, size * 0.35);

  ctx.fillStyle = '#facc15';
  ctx.fillText('⭐ TRG OSLOBOĐENJA (CENTAR)', size * 0.38, size * 0.47);

  ctx.fillStyle = '#34d399';
  ctx.fillText('⛰️ ČAČALICA ŠUMA', size * 0.72, size * 0.94);

  ctx.shadowBlur = 0; // Reset shadow

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
