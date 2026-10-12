# Status integracije: Unity/Cesium ↔ browser 3D igra

**Datum pregleda:** 2026-10-12  
**Status:** nije potvrđeno konačno objedinjavanje; potrebni su lokalni Unity dokazi i sinhronizacija grana.

## 1. Izvršni zaključak

Postoje dva različita runtime-a:

1. **Unity projekat** — ranije identifikovan lokalno kao `C:\Users\jamal\Pozarevac Lejt Najt 3D Gta-ThugLife`. Zabeleženi kontekst: Unity Editor `6000.6.5f1`, Cesium for Unity `1.26.0`, scena `Assets/Scenes/SampleScene.unity`, postojeći origin lat `44.6193`, lon `21.1764`, Cesium ion asset ID-jevi `96188` i `2275207`. Ove vrednosti su referentne informacije iz prethodnih radnih beleški, a **nisu potvrđene novim lokalnim čitanjem u ovom pregledu**.

2. **Web igra** — `YashimiNatuki/3D-gta-Pozarevac`, React/TypeScript/Three.js. Glavna grana `main` ne sadrži Unity scene niti Unity C# runtime. U `feat/pozarevac-landmarks-3d` je dokumentovan Three.js koordinatni origin `44.62130 N, 21.18780 E`, OSM centralni izvod, Copernicus DEM grid i tri GLB landmarka.

Zaključak: imamo web igru sa značajnim city/gameplay radom i odvojeni Unity/Cesium projekat, ali ovaj pregled ne potvrđuje da se Unity scena/3D Tiles direktno izvršavaju unutar browser igre. Nema dokaza da su Cesium coordinate origin, scene i Unity asseti bezbedno preneti u web runtime — i ne treba ih prenositi kao sirove scene fajlove.

## 2. Razlika koordinatnih origin-a

| Runtime | WGS84 referenca | Poreklo tvrdnje | Napomena |
|---|---|---|---|
| Unity/Cesium | 44.6193, 21.1764 | Prethodne beleške o `SampleScene.unity`; lokalni fajl nije ponovo pročitan u ovom pregledu | Ne menjati bez pregleda scene/tileset georeference |
| Three.js web | 44.62130, 21.18780 | `docs/POZAREVAC_LANDMARK_SOURCES.md` na feature grani | Oko 16 realnih metara po game jedinici; +X istok, −Z sever prema dokumentaciji |

Razlika između ove dve geografske reference je približno **0,9 km**. Ova razlika je dovoljno velika da slučajno kopiranje položaja pomeri objekte sa pogrešnog dela grada. Ne treba menjati Unity origin niti web origin da bi se “poklopili” bez izmerenog transformacionog testa.

## 3. Šta se nalazi u web city pipeline-u

U feature grani `feat/pozarevac-landmarks-3d` dokumentovani su:
- `public/data/pozarevac-osm-extract.json` — offline ograničeni OSM vektorski extract.
- `public/data/pozarevac-dem-heightfield.json` — 97×97 grid nad 2,56 × 2,56 km scenom iz Copernicus DEM GLO-30.
- `public/assets/landmarks/pozarevac-hospital.glb`
- `public/assets/landmarks/stari-korzo-block.glb`
- `public/assets/landmarks/vasariste-stadium.glb`
- `src/services/pozarevacLandmarks.ts`, `urbanMicroLandmarks.ts`, `modularBuildingFactory.ts`
- `terrainHeightfield.ts`, `osmGroundTexture.ts`, `terrainImagery.ts`

Landmarki su stilizovani, generisani modeli. Oni nisu potvrđeni arhitektonski planovi niti zamenjuju fotogrametriju. OSM extract je vektorska podloga, ne satelitski snimak. Terrain grid je regionalni DEM, ne LiDAR i ne preciznost svakog krova/trotoara.

Važno: ovi asseti su bili vidljivi u feature branch inventory-ju, a ne u pregledanom `main`. Pre gameplay testiranja mora se izabrati i spojiti odabrani PR, rešiti konflikти i ponoviti testovi.

## 4. Preporučena arhitektura integracije

### Faza A — popis i referentni kadar
- Napraviti read-only inventar Unity `Assets/`, `Packages/manifest.json`, `ProjectSettings/ProjectVersion.txt`, scena, prefab-a i Cesium компоненти.
- Sačuvati SHA/hash i timestamp za bitne scene/tileset konfiguracije.
- Snimiti Editor kadar na postojećem origin-u i zapisati poznatu lokaciju i terrain height.
- Ne menjati `SampleScene.unity`, Cesium origin, ion ID-jeve ili tileset podešavanja.

### Faza B — nezavisni adapteri, zajednički podaci
Definisati verzionisani `CityLocation` ugovor:
- `id` stabilan i jedinstven;
- `label` i `category`;
- `latitude`, `longitude` u WGS84;
- `elevationMeters` i izvor visine, ako je poznat;
- `geometryKind` (`point`, `polygon`, `model-anchor`);
- `assetUri` relativna putanja/identifikator bez privatnog URL-а;
- `source`, `license`, `confidence`;
- `transformVersion` ili verzija kalibracije.

Ne deliti sirove Unity `Transform` vrednosti sa web igrom kao da su geografske koordinate. Unity world coordinates, Cesium ECEF/ENU i Three.js gameplay local coordinates različiti su prostori.

### Faza C — transformacija i kalibracija
- Zadržati jedan konfigurisani origin po runtime-u.
- Implementirati dva adaptera iz zajedničkog WGS84 ugovora u lokalni runtime prostor.
- Koristiti najmanje tri proverene kontrolne tačke raspoređene po mapi i uporediti rastojanja u metrima, azimut i visinu.
- Potvrditi znak i smer osa (+X/−Z u dokumentovanom web okviru), vertikalni datum i game-unit scale.
- Testirati na jednoj zgradi/POI pre većeg seta; tek zatim proširiti catalog.
- Upisati toleranciju u test. Ne koristiti “izgleda približno dobro” kao geodetsku potvrdu.

### Faza D — fizički modeli i gameplay
- Render mesh i collision mesh tretirati kao odvojene resurse; ne praviti collision mesh iz svakog vidljivog detalja fasade.
- Zabeležiti skalu, pivot, heading/orientation, bounds, izvor i fallback za svaki GLB.
- Proveriti da igrač može da prođe validnim ulicama; stati uz fasadu, penjati se/ne penjati se gde je predviđeno, i proveriti da collider ne visi iznad DEM-a.
- Unity NavMesh/C# physics не преносити у Three.js као да су компатибилни. Изабрати један авторитативни gameplay runtime или дефинисати стабилан синхронизациони API.

## 5. Šta ne raditi

- Ne prepisivati `Assets/Scenes/SampleScene.unity`.
- Ne menjati Cesium origin na `44.62130, 21.18780` samo zato što je to web origin.
- Ne menjati web origin na `44.6193, 21.1764` samo zato što Unity već koristi tu tačku.
- Ne kopirati Cesium Unity package reference u `package.json`.
- Ne kopirati Unity C# u TypeScript bez prevođenja modela stanja, lifecycle-a i fizičkog modela.
- Ne stavljati ion/API ključeve u source control, browser bundle, README ili test log.
- Ne preuzimati/cache-ovati Google map tile-ove mimo licenci/API uslova. Potrebna je dozvoljena putanja za upotrebu/redistribuciju i vidljiva atribucija.
- Ne nazivati render “1:1 realistično” pre geodetske, asset-license i visual QA provere.

## 6. Acceptance criteria

- [ ] Unity projekat može da se otvori bez novih import/compile grešaka.
- [ ] Originalna Unity scena i Cesium origin ostali su netaknuti kroz kalibraciju.
- [ ] Tri kontrolne tačke odgovaraju u oba runtime-a u zapisanoj toleranciji.
- [ ] Jedan landmark je potvrđen: pojava, pozicija, heading, visina, scale, bounds i collision.
- [ ] Player controller radi kroz realne ulice, a ne samo na praznoj podlozi.
- [ ] Web city data i asseti su uključeni u granu koja prolazi TypeScript, invariant tests i build.
- [ ] OSM/Copernicus/proprietary source atribucije i dozvole su dokumentovane.
- [ ] Unity Play Mode smoke test i browser smoke test su odvojeno prijavljeni.
- [ ] Status svake integracije označen je kao `planned`, `in-progress` ili `verified`, ne pretpostavljen.
