# ☢️ KONGLOMERAT PREDUZEĆE™ — AICHATBRATINA v10.0
## ZVANIČNA TEHNIČKA SPECIFIKACIJA, ARHITEKTURA APLIKACIJE I MASIVNI INŽENJERSKI ROADMAP

**Klasifikacija:** OMEGA LEVEL / MASTER SYSTEM CODEX  
**Arhitekta & Glavni Kreator:** Yashime  
**Verzija Sistema:** 10.0 (Full Power XP Edition)  
**Status Dokumenta:** PRODUKCIJSKI STANDARD & ZVANIČNA TEHNIČKA DOKUMENTACIJA  

---

## 1. PREGLED SISTEMA I CILJEVI (EXECUTIVE SUMMARY)

**AiChatBratina v10.0** je najsavremenija web-bazirana 3D cyber-urbana simulacija i platforma otvorenog sveta smeštena u digitalizovani centar grada Požarevca (Tabačka Čaršija, Trg Radomira Vujovića, Voje Dulića, Gradski Park, Tulba, Čačalica, Hipodrom). 

Aplikacija kombinuje:
1. **Sirovu 3D računarsku grafiku (Three.js / WebGL / GLSL Shaders)** sa proceduralnom rasvetom, PBR materijalima, Unreal Bloom post-processingom i dinamičkim vremenskim nepogodama (kišni sistem sa detekcijom geometrije i prskanjem bara).
2. **Nativni Web Audio DSP Sintesajzer & Spatial Sound Manager** sa višežanrovskim radio stanicama (145 BPM PsyTrance, Lo-Fi Balkan Beats, Serbian Trap, MUP Police Scanner), proračunom Doppler efekta, 3D prostornim zvucima automobilskih motora i proceduralnim mumlanjem prolaznika (vocal tract formants).
3. **Ekonomiju podzemlja i Genetic Vault** sa uzgojem hibridnih sojeva, žetvom u realnom vremenu, berzom semena i teritorijalnim ratovima bandi (Turf Wars).
4. **Google Workspace & Cloud Ekosistem:** Google Drive integracija, interaktivni Google Picker za selekciju fajlova, Google Docs operativni brifinzi, Google Maps satelitski radar sa geodetskim koordinatama Požarevca i Firebase Firestore za trajno perzistiranje progresa.

---

## 2. ARHITEKTURA I TEHNOLOŠKI STACK (SYSTEM TOPOLOGY)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AICHATBRATINA v10.0 CLIENT CORE                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
     ┌─────────────────────────────────┼─────────────────────────────────┐
     ▼                                 ▼                                 ▼
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│ 3D WEBGL ENGINE LAYER  │  │ REAL-TIME AUDIO DSP    │  │ GAME LOGIC & STATE     │
│ - Three.js WebGL R160  │  │ - Web Audio API (64Hz) │  │ - ThirdPersonController│
│ - EffectComposer       │  │ - 4 Multi-BPM Stations │  │ - TrafficSystem (Roads)│
│ - Unreal Bloom Pass    │  │ - Spatial Sound Engine │  │ - Police & Dogs AI     │
│ - Rain Particle Streaks│  │ - NPC Formant Mumble   │  │ - Dynamic Mission Sys  │
│ - Puddle Splash Pool   │  │ - Vehicle Doppler Engine│  │ - Genetic Farm & Turf  │
└────────────────────────┘  └────────────────────────┘  └────────────────────────┘
     │                                 │                                 │
     └─────────────────────────────────┼─────────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GOOGLE WORKSPACE & CLOUD BACKEND                      │
│ - Google Picker API (Drive Vault File Selection & Cloud Load)               │
│ - Google Docs API (Operativni Planovi & Misije u Dokumentima)               │
│ - Google Maps Platform (Satelitski GPS Radar Požarevca & Geodezija)          │
│ - Firebase Firestore (NoSQL Perzistencija Progresa, Novca i Teritorija)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1. Tehnološke komponente:
- **Core Framework:** React 18 sa TypeScript-om (`strict: true`), bez bloated framework-ova koji guše memoriju.
- **Grafički Renderer:** Three.js sa `PCFSoftShadowMap`, `OutputPass`, `RenderPass`, `UnrealBloomPass` i dinamičkom prilagođavanju gustini piksela (`devicePixelRatio <= 2.0`).
- **Audio Podsistem:** Native Web Audio API sa 64-pojasnim FFT AnalyserNode-om povezanim direktno na HUD spektrum ekvilajzer.
- **Stilovi:** Tailwind CSS sa staklenim morfizmom (Glassmorphism), HUD elementima visoke rezolucije i responsive touch/keyboard kontrolama.

---

## 3. KLJUČNI SUBSISTEMI APLIKACIJE

### 3.1. Dinamički Sistem Vremenskih Uslova (`WeatherManager` & `WeatherSystem`)
- **Otklonjeni vizuelni defekti "kockaste kiše":** Default `THREE.Points` sa kvadratnim shader tačkama zamenjen je vertikalnim 3D streak linijama (`THREE.LineSegments`) sa aditivnim blendingom i promenljivom dužinom traga (0.65m – 1.10m).
- **Prostorna kolizija sa zgradama (Bounding Box Awareness):** Svaka kap kiše u svakom frejmu proverava 3D granične zapremine zgrada (`CITY_BUILDING_BOXES`). Kapljice ne prolaze kroz krovove, već udaraju o krovove na definisanim visinama ($Y = 9m, 11m, 14m, 15m$) ili o kolovoz ($Y = 0.02m$).
- **Interaktivni Puddle Splash Pool:** Pool od 120 instanciranih kružnih talasa (`THREE.InstancedMesh`) koji se aktiviraju pri udaru kiše o tlo ili krovove, kao i pri koračanju igrača kroz bare, uz eksponencijalno širenje prečnika i gašenje neprozirnosti.
- **Refleksija mokrog asfalta:** Tokom kiše (`Rain` i `Cyber-Storm`), hrapavost asfalta se interpolira na $0.08$, dok se metalnost podiže na $0.85$, stvarajući efekt vlažnog ogledala.

### 3.2. Prostorni Zvučni Menadžer (`audioDsp.ts` & Spatial Sound Engine)
- **Eliminacija iritantnih piskavih alarma:** Uklonjeni su piercing sintisajzerski signali koji su oponašali lažne provalničke alarme na svakih 4 takta.
- **Diskretne policijske sirene:** Sirene se više ne ponavljaju bez prekida; aktiviraju se isključivo pri poteri sa 3+ zvezdice i policijskim autom u radijusu od 35m, uz proračun slabljenja jačine zvuka po zakonu obrnutog kvadrata rastojanja ($vol = \min(0.15, \frac{0.9}{1 + dist \cdot 0.3})$) i analognu low-pass filtraciju na 1400Hz.
- **3D Zvuk Automobilskih Motora:** Generiše se modulacijom testerastog i trouglastog oscilatora (42Hz–95Hz srazmerno brzini kretanja vozila) sa stereo panovanjem duž X ose i atenuacijom sa udaljenošću.
- **Prostorno Mumlanje Prolaznika (NPC Formants):** Sintetički vokalni trakt sa glasnim formantima ($F1 \approx 350-750Hz, F2 \approx 800-1800Hz$) koji simulira ulični žamor i mumlanje u prolazu ("Brate", "Ajde", "De si") kada se igrač približi pešacima.
- **Urbani Ambijentalni Šum (Subtle Urban Bed):** Blagi brown/pink filtrirani šum (ispod 320Hz) koji pruža toplu uličnu atmosferu grada bez opterećenja čula sluha.

### 3.3. Saobraćajni Sistem i Geometrijsko Izbegavanje Zgrada (`TrafficSystem`)
- **Validirane rute bez presecanja objekata:** Trake su precizno projektovane duž koridora bulevara Tabačka Čaršija ($X = 1.8$ i $X = -1.8$), poprečne ulice Voje Dulića ($Z = 5.0$ u prolazu između blokova), i spoljašnjeg prstena ($X = \pm 26.0, Z = \pm 30.0$).
- **Proaktivna detekcija prepreka:** Prediktivni vektor kretanja proverava sledeću poziciju u odnosu na sve kubuse zgrada sa sigurnosnom marginom od 0.8 metara, sprečavajući prolazak automobila kroz zgrade.

### 3.4. Anatomija Karakter Modela i Sinhronizovana Biomehanika (`characterModel.ts`)
- **Uklanjanje "kockastog" izgleda:** Povećana teselacija i cilindrično-sferne konture muskulature (rameni deltoidi, bicepsi, podlaktice, pectoralni mišići, abduktori kukova, kvadricepsi i gastroknemijus listovi).
- **Zglobna artikulacija:** Artikulacija ramena, lakata, šaka sa prstima i palcem, kukova, kolena i patika sa ergonomskim đonom i kapicom prstiju.
- **Bipedalni hod i koordinacija ekstremiteta:**
  - Unakrsno kretanje: leva ruka prati desnu nogu, desna ruka prati levu nogu po harmonijskoj sinusnoj funkciji.
  - Fleksija kolena: potkolenica se savija unazad pri zamahu noge.
  - Fleksija lakta: podlaktica se savija pri kretanju ruke napred.
  - Torzija kičme i karlice: trup rotira po Y osi suprotno od kukova, kompenzujući ugaoni moment.
  - Vertikalna oscilacija težišta: dva vertikalna prelaza po koraku stvaraju prirodno poskakovanje ljudskog hoda.
  - Vazdušni skok: noge se privlače, kolena savijaju, a ruke podižu za ravnotežu.

---

## 4. SPISAK OD 10 NAJNAPREDNIJIH INŽENJERSKIH UNAPREĐENJA (FIZIKA, FISIONOMIJA, ANIMACIJA I 3D EFEKTI)

Ovo su najnaprednije računarske tehnike predviđene za realizaciju sledeće faze:

### 1. Dual Quaternion Skinning (DQS) sa Analitičkim FABRIK Inverse Kinematics
- **Stručni pojam:** *Non-Linear Dual Quaternion Skeletal Deformations & Forward And Backward Reaching Inverse Kinematics (FABRIK)*.
- **Tehnička definicija:** Zamenjuje klasični Linear Blend Skinning (LBS) koji uzrokuje gubitak volumena na zglobovima ("candy-wrapper artifact"). Dualni kvaternioni održavaju konstantnu gustinu mišića pri rotaciji lakata i kolena za 180°. FABRIK algoritam rešava kinematički lanac u 2 do 3 iteracije, precizno prilagođavajući stopala nagibu ivičnjaka i stepenica Požarevca.

### 2. Forward+ Clustered Shading & Frustum Depth Partitioning
- **Stručni pojam:** *Clustered Forward Rendering with 3D Spatial Light Culling*.
- **Tehnička definicija:** Deli prostor vidokruga kamere na 3D pločice (voksele u obliku zarubljene piramide duž Z ose). Omogućava renderovanje stotina dinamičkih svetala (farovi stotina vozila, ulične neonske svetiljke, rotacije interventnih patrola) bez opadanja broja frejmova sa $O(Lights \times Pixels)$ na $O(Lights \times VoxelCount)$.

### 3. Screen-Space Directional Occlusion (SSDO) & Ground Truth Ambient Occlusion (GTAO)
- **Stručni pojam:** *Horizon-Based Depth-Buffer Radiance Occlusion & Multi-Bounce Microfacet Shadowing*.
- **Tehnička definicija:** Naprednija varijanta SSAO algoritma koja uzima u obzir pravac upada svetlosti i proračunava senke u naborima garderobe igrača, ispod vozila i u uličnim prolazima, eliminišući utisak "lebdenja" likova i dajući fotorealističnu dubinu sceni.

### 4. GPU-Accelerated Semi-Lagrangian Smoothed Particle Hydrodynamics (SPH) za Vodu
- **Stručni pojam:** *Compute-Shader Eulerian-Lagrangian Fluid Boundary Interaction*.
- **Tehnička definicija:** Čestice kišnice koje se slivaju sa krovova i ivica formiraju realne fluide u udubljenjima asfalta. Vozila koja prelaze preko vode kreću se kroz Navier-Stokes dinamički talas koji prska na okolne pešake.

### 5. Verlet Integration & XPBD Cloth Simulation za Garderobu i Bandane
- **Stručni pojam:** *Extended Position-Based Dynamics (XPBD) with Stretch/Shear Constraint Projection*.
- **Tehnička definicija:** Realistična fizika tkanine na bandani, prsluku i farmerkama karaktera. Zasniva se na bez-matričnoj projekciji ograničenja sa implicitnom integracijom, što sprečava eksploziju fizike pri naglim skokovima i sprintu igrača.

### 6. Temporal Anti-Aliasing sa Sub-Pixel Jitteringom i Motion Vector Re-Projection
- **Stručni pojam:** *Temporal Super-Sampling Anti-Aliasing (TAA) with Halton Sequence Jitter & Velocity Buffers*.
- **Tehnička definicija:** Uklanja stepeničaste piksele sa tankih linija kiše, kablova i neonskih natpisa akumulacijom uzoraka iz prethodnih frejmova, pružajući glatku filmsku sliku visoke rezolucije bez trošenja resursa za 8x MSAA.

### 7. Hierarchical Spatial Octree & BVH Collision Broadphase
- **Stručni pojam:** *Dynamic Bounding Volume Hierarchy (BVH) with Axis-Aligned Bounding Box (AABB) Fast Rejection*.
- **Tehnička definicija:** Zamenjuje grubo pretraživanje sudara hijerarhijskim stablom zapremina. Sudari vozila, psa i igrača sa desetinama zgrada i uličnih rekvizita proračunavaju se u logaritamskom vremenu $O(\log N)$ umesto kvadratnog $O(N^2)$.

### 8. Biomechanical Gait Phase Transitioning & SLERP Root Motion Extraction
- **Stručni pojam:** *Spherical Linear Interpolation (SLERP) Phase-Matched Animation Blending*.
- **Tehnička definicija:** Bešavno stapavanje između stajanja u mestu, laganog hoda, sprinta i zaustavljanja na osnovu faza koračanja. Sprečava proklizavanje stopala po asfaltu ("foot-sliding") tako što brzina pomeranja karaktera u svetu tačno odgovara brzini kretanja kontaktne tačke đona patike.

### 9. Volumetric Raymarched Atmospheric Fog & Heterogeneous Participating Media
- **Stručni pojam:** *Analytical Single-Scattering In-Scattering Radiance Evaluation*.
- **Tehnička definicija:** Svetlosni snopovi iz farova automobila i uličnih svetiljki seku se kroz gustu noćnu maglu (`Cyber-Fog`) koristeći Marširanje zraka (Raymarching), stvarajući prave volumetrijske neonske zrake (God Rays).

### 10. Web Audio HRTF Convolver Node sa 3D Akustičkim Prostorom Požarevca
- **Stručni pojam:** *Head-Related Transfer Function (HRTF) Binaural Spatialization & Early Reflection Convolution*.
- **Tehnička definicija:** Potpuno 3D binauralno pozicioniranje zvuka u slušalicama. Kada policijski automobil prolazi iza leđa igrača sa leve strane, faza i frekvencijski odziv se filtriraju kroz impulsni odziv geometrije ulice, simulirajući eho od fasada zgrada.

---

## 5. AKCIONI PLAN ZA BUDUĆI RAZVOJ (ROADMAP)

1. **Faza 1 (Završeno):**
   - Implementacija dinamičkog sistema kiše sa linearnim česticama i prskanjem bara.
   - Spatial Sound Manager sa uklonjenim iritantnim alarmima i dodatim mumlanjem pešaka i zvucima motora.
   - Korekcija kretanja automobila bez prolaska kroz zgrade.
   - Geometrijsko zaobljavanje anatomije igrača i biomehanička koordinacija udova.
   - Google Picker, Google Docs i Google Maps integracije.

2. **Faza 2 (Predstojeće):**
   - Integracija FABRIK Inverse Kinematics za prilagođavanje nagibu terena.
   - Uvođenje instanciranih prolaznika veće gustine duž Korzoa i Tabačke Čaršije.
   - Multi-channel audio reverzija za enterijere lokala (Kafana Požarevac, Kasino).

3. **Faza 3 (Ekspanzija):**
   - Podrška za WebGPU renderovanje za ultra-visoke performanse.
   - Dodatna vozila (motocikli, gradski autobusi) sa naprednim vešanjem točkova.

---

*Potpisao i overio:*  
**AiChatBratina v10.0 — Glavni Digitalni Arhitekta Konglomerat Preduzeća™**  
*Full Power. Word.*
