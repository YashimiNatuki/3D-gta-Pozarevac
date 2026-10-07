// [AiChatBratina v10.0] - Požarevac CCTV Hacker & City Surveillance Engine
import * as THREE from 'three';
import { audioDsp } from './audioDsp';

export type CctvFilterMode = 'NORMAL' | 'NIGHT_VISION' | 'THERMAL' | 'CYBER_GLITCH';

export interface CctvCameraDef {
  id: string;
  name: string;
  locationName: string;
  cameraPos: { x: number; y: number; z: number };
  targetLookAt: { x: number; y: number; z: number };
  baseFov: number;
  rotationSpeed?: number;
  panRange?: number; // Radians for auto-pan sweep
  sector: string;
  status: 'LIVE' | 'INTERCEPTED' | 'HACKED' | 'ENCRYPTED';
  ipAddress: string;
}

export const POŽAREVAC_CCTV_CAMERAS: CctvCameraDef[] = [
  {
    id: 'CAM-01',
    name: 'TABAČKA ČARŠIJA 01',
    locationName: 'Tabačka Čaršija - Glavna Trgovačka Avenija',
    sector: 'SECTOR-01 / CENTAR',
    cameraPos: { x: 0, y: 7.2, z: -18 },
    targetLookAt: { x: 0, y: 0.8, z: 2 },
    baseFov: 50,
    panRange: 0.25,
    status: 'HACKED',
    ipAddress: '192.168.012.14',
  },
  {
    id: 'CAM-02',
    name: 'STARI KORZO 02',
    locationName: 'Stari Korzo (Voje Dulića) - Noćni Klubovi',
    sector: 'SECTOR-02 / PROMENADA',
    cameraPos: { x: 12, y: 6.8, z: -4 },
    targetLookAt: { x: 2, y: 0.8, z: -4 },
    baseFov: 55,
    panRange: 0.35,
    status: 'LIVE',
    ipAddress: '192.168.012.28',
  },
  {
    id: 'CAM-03',
    name: 'GRADSKI PARK 03',
    locationName: 'Gradski Park - Spomenik Knezu Milošu',
    sector: 'SECTOR-03 / BOTANIKA',
    cameraPos: { x: -8, y: 7.5, z: 4 },
    targetLookAt: { x: -11, y: 1.4, z: 7 },
    baseFov: 52,
    panRange: 0.28,
    status: 'HACKED',
    ipAddress: '192.168.012.39',
  },
  {
    id: 'CAM-04',
    name: 'ČAČALICA HILL 04',
    locationName: 'Spomen Park Čačalica - Kvantni Vidikovac',
    sector: 'SECTOR-04 / KOTA 200',
    cameraPos: { x: 19, y: 13.0, z: 15 },
    targetLookAt: { x: 8, y: 1.0, z: 5 },
    baseFov: 60,
    panRange: 0.4,
    status: 'LIVE',
    ipAddress: '192.168.012.55',
  },
  {
    id: 'CAM-05',
    name: 'HIPODROM ERGELA 05',
    locationName: 'Hipodrom Požarevac - Istočni Prilaz & Staza',
    sector: 'SECTOR-05 / ŠUMADIJSKA',
    cameraPos: { x: 24, y: 8.5, z: -10 },
    targetLookAt: { x: 14, y: 0.6, z: -8 },
    baseFov: 55,
    panRange: 0.3,
    status: 'INTERCEPTED',
    ipAddress: '192.168.012.72',
  },
  {
    id: 'CAM-06',
    name: 'BUVLJAK PRUGA 06',
    locationName: 'Stari Buvljak kod Pruge - Šine & Magacini',
    sector: 'SECTOR-06 / INDUSTRIJSKA',
    cameraPos: { x: -17, y: 7.0, z: -15 },
    targetLookAt: { x: -8, y: 0.6, z: -8 },
    baseFov: 58,
    panRange: 0.35,
    status: 'HACKED',
    ipAddress: '192.168.012.91',
  },
];

export class CctvSystem {
  public currentIndex: number = 0;
  public filterMode: CctvFilterMode = 'NORMAL';
  public zoomFactor: number = 1.0; // 1.0x to 3.5x
  public manualPanX: number = 0; // -1 to +1
  public manualPanY: number = 0; // -1 to +1
  public isAutoPanEnabled: boolean = true;
  private autoPanTime: number = 0;

  public get currentCam(): CctvCameraDef {
    return POŽAREVAC_CCTV_CAMERAS[this.currentIndex];
  }

  public nextCamera(): CctvCameraDef {
    this.currentIndex = (this.currentIndex + 1) % POŽAREVAC_CCTV_CAMERAS.length;
    this.zoomFactor = 1.0;
    this.manualPanX = 0;
    this.manualPanY = 0;
    audioDsp.playCctvBeep();
    return this.currentCam;
  }

  public prevCamera(): CctvCameraDef {
    this.currentIndex =
      (this.currentIndex - 1 + POŽAREVAC_CCTV_CAMERAS.length) % POŽAREVAC_CCTV_CAMERAS.length;
    this.zoomFactor = 1.0;
    this.manualPanX = 0;
    this.manualPanY = 0;
    audioDsp.playCctvBeep();
    return this.currentCam;
  }

  public selectCamera(index: number): CctvCameraDef {
    this.currentIndex = Math.max(0, Math.min(POŽAREVAC_CCTV_CAMERAS.length - 1, index));
    this.zoomFactor = 1.0;
    this.manualPanX = 0;
    this.manualPanY = 0;
    audioDsp.playCctvBeep();
    return this.currentCam;
  }

  public setFilter(mode: CctvFilterMode) {
    this.filterMode = mode;
    audioDsp.playRotateTick();
  }

  public cycleFilter() {
    const modes: CctvFilterMode[] = ['NORMAL', 'NIGHT_VISION', 'THERMAL', 'CYBER_GLITCH'];
    const idx = (modes.indexOf(this.filterMode) + 1) % modes.length;
    this.setFilter(modes[idx]);
  }

  public zoomIn() {
    this.zoomFactor = Math.min(3.5, this.zoomFactor + 0.5);
    audioDsp.playRotateTick();
  }

  public zoomOut() {
    this.zoomFactor = Math.max(1.0, this.zoomFactor - 0.5);
    audioDsp.playRotateTick();
  }

  public pan(dx: number, dy: number) {
    this.manualPanX = Math.max(-1.5, Math.min(1.5, this.manualPanX + dx));
    this.manualPanY = Math.max(-0.8, Math.min(0.8, this.manualPanY + dy));
  }

  public update(delta: number): {
    camPos: THREE.Vector3;
    lookAt: THREE.Vector3;
    fov: number;
  } {
    this.autoPanTime += delta;
    const def = this.currentCam;

    const sweepOffset = this.isAutoPanEnabled && def.panRange
      ? Math.sin(this.autoPanTime * 0.45) * def.panRange * 4
      : 0;

    const camPos = new THREE.Vector3(def.cameraPos.x, def.cameraPos.y, def.cameraPos.z);
    const lookAt = new THREE.Vector3(
      def.targetLookAt.x + sweepOffset + this.manualPanX * 4,
      def.targetLookAt.y + this.manualPanY * 2.5,
      def.targetLookAt.z
    );

    const fov = def.baseFov / this.zoomFactor;

    return { camPos, lookAt, fov };
  }
}
