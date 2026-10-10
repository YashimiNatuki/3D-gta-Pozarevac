# 3D GTA Požarevac

Web 3D igra / interaktivni prototip smešten u stilizovanu, cyberpunk verziju centra Požarevca. Projekat koristi React, TypeScript, Three.js i WebGL; cilj je da spoji istraživanje grada, misije, saobraćaj, NPC-je, teritorije i kvartovsku ekonomiju u browseru.

> Grad i njegove razmere su stilizovani za gameplay. Neki nazivi i koordinate kvartova su lokalni ili približni, a ne zvanično kartografsko razgraničenje. Izvori i ograničenja su zabeleženi u [`docs/POZAREVAC_LANDMARK_SOURCES.md`](docs/POZAREVAC_LANDMARK_SOURCES.md).

## Funkcije

- Three.js scena sa promenom doba dana, vremenskim efektima, senkama i opcionalnim bloom post-processingom.
- Third-person kretanje, skok, sprint, orbit kamera i više režima kamere; uz stvarnu GLO-30 DEM draped geometriju i visinski usklađeno kretanje na nagibu.
- Kamera se sklanja ispred statičkih prepreka i postepeno vraća na željenu udaljenost kada se pogled oslobodi.
- Saobraćaj, policija, pešaci, psi, dinamičke misije i teritorijalne zone.
- Pešaci predviđaju putanju bržih vozila i beže u stranu uz kratku paniku, srpski glasovni uzvik i vizuelni signal; lokalna crowd separation smanjuje preklapanje.
- Udar vozila: vozilo koje se kreće brže od približno 1,8 m/s može odbaciti igrača; udar utiče na zdravlje, trošak lečenja i Wanted nivo kod jačeg kontakta. Vozilo koči, uz 1,5 s cooldown.
- POI i scenografija Požarevca, uključujući GLB modele Vašarišta, Starog Korzoa i bolnice, uz proceduralne fallback modele.
- Kvartovski reoni, lokalna pijaca, sadnja i žetva na parcelama uz fizičku blizinu i pravila reona.
- Izbor između umetničke podloge i lokalnog OSM sloja sa stvarnim ulicama, zgradama, parkovima i vodom; OSM snapshot se učitava sa aplikacije, bez runtime tile/API zahteva.
- Visinski reljef je obrađen iz Copernicus DEM GLO-30; Čačalica je GPS-usklađena sa grebenom i oko 74 m je iznad centra (oko 4,6 game jedinica). Nije LiDAR niti krovno precizna rekonstrukcija.
- Mission tracker prikazuje poglavlje priče, sledeći checkpoint, rastojanje i opciono otvarajući brifing lika.
- Srpski NPC audio barkovi, ambijentalni zvuk i intro video.
- Lokalno čuvanje progresa; pojedine cloud funkcije zavise od Firebase/Google podešavanja.

## Tehnologije

- React 19 + TypeScript
- Vite 8
- Three.js `EffectComposer` post-processing (RenderPass, UnrealBloomPass)
- Cannon-es za fiziku
- Tailwind CSS 4
- Web Audio API
- Firebase i Google Gemini integracije

## Preduslovi

- Node.js 22 preporučen (Node 20.19+ kompatibilan sa Vite 8)
- npm, pnpm ili Bun
- Savremen browser sa WebGL podrškom

## Pokretanje lokalno

```bash
git clone https://github.com/YashimiNatuki/3D-gta-Pozarevac.git
cd 3D-gta-Pozarevac
npm ci
npm run dev
```

Vite ispisuje lokalni URL, podrazumevano `http://localhost:3000`.

### Konfiguracija okruženja

Kopiraj `.env.example` u `.env.local` i dodaj samo ključeve koje koristiš:

```bash
cp .env.example .env.local
```

`GEMINI_API_KEY` je potreban za Gemini AI/video API rute. Osnovna lokalna 3D scena može da se pokrene i bez tog ključa, ali AI/cloud funkcije neće biti dostupne. OAuth, Google Workspace, Maps i Firebase funkcije mogu tražiti zasebnu konfiguraciju u odgovarajućem projektu.

**Ne commit-uj `.env`, `.env.local`, API ključeve, OAuth tokene ili Firebase tajne.** Koristi lokalne environment varijable ili secret manager hosting platforme.

## Kontrole

| Akcija | Kontrola |
|---|---|
| Kretanje | `W A S D` ili strelice |
| Sprint | `Shift` + kretanje |
| Skok | `Space` |
| Interakcija sa obližnjim POI/parcelom | `E` |
| Rotiranje kamere | miš; levi ili desni klik + prevlačenje |
| Zumiranje | točkić miša |
| Dobacivanje prolaznicima | `V` |

HUD sadrži dodatne kontrole za kameru, radar, vreme, radio, misije, farmu, pijacu i reone.

## Razvojne komande

```bash
npm run dev             # Vite dev server
npm run lint            # TypeScript provera (tsc --noEmit)
npm run test:invariants # gameplay/persistence/security invariant testovi
npm run build           # produkcioni build u dist/
npm run preview         # lokalni pregled produkcionog build-a
```

Build može prikazati upozorenje o velikom `game-services` chunk-u; to je upozorenje za optimizaciju, ne neuspeh build-a.

## Struktura koda

```text
src/
  App.tsx                         # aplikaciono stanje i integracija gameplay UI-ja
  components/ThreeCanvas.tsx       # Three.js scena, render loop i 3D interakcije
  services/thirdPersonController.ts# kretanje, collision i third-person kamera
  services/trafficSystem.ts        # saobraćaj i reakcija vozila na sudar
  services/collisionGeometry.ts    # geometrija camera occlusion / vehicle contact
  services/dynamicMissionEngine.ts # misije i turf zone
  services/osmGroundTexture.ts    # offline render OSM vektora u teksturu tla
  services/terrainHeightfield.ts # DEM validacija, height sampling i grade
  services/pedestrianPanic.ts     # projekcija putanje vozila i near-hit detekcija
  services/vehicleImpactConsequences.ts # health/cash/Wanted pravila udara
  services/pozarevacDistricts.ts   # kanonski registar kvartova
  services/streetEconomy.ts        # tržište, parcele, semena i žetva
  services/urbanMicroLandmarks.ts  # GLB landmarki i proceduralni fallback
  services/characterModel.ts       # proceduralni model lika
  services/audioDsp.ts             # audio DSP i efekti
  services/audioLocalizationManager.ts
public/assets/landmarks/           # optimizovani GLB modeli grada
public/data/pozarevac-osm-extract.json # lokalni OSM podaci, ODbL atribucija u sceni/docs
public/data/pozarevac-dem-heightfield.json # obrađeni Copernicus GLO-30 grid + izvor/atribucija
public/videos/                     # uvodni video, ako je prisutan u checkout-u
scripts/update-pozarevac-osm.py    # reproducibilno osvežavanje ograničenog izvoda
 tests/gameplay-invariants.ts      # regresioni invariant testovi
 docs/                             # izvori lokacija, tehničke beleške i roadmap
```

## Lokacije i asseti

Vašarište se u igri tretira kao stadion; neke lokalne oznake, poput Đure/favela i Bloka C, predstavljaju gameplay nazive i približne zone. Pogledaj [izvore lokacija i ograničenja](docs/POZAREVAC_LANDMARK_SOURCES.md). Modeli u `public/assets/landmarks/` su generisani 3D asseti, a ne zvanični arhitektonski nacrti.

Tekstura tla može da se prebaci između umetničke i stvarne OSM geometrije. DEM visinski mesh učitava se lokalno pri pokretanju; mapa tako nije satelitska fotografija. Atribucije OSM i Copernicus vidljive su u sceni. Google Satellite/Hybrid prikaz ostaje u zasebnom Google Maps prozoru. Izvori, licence i granice rezolucije su u [MAP_DATA_SOURCES.md](docs/MAP_DATA_SOURCES.md).

## Doprinos i licenca

Pre izmene proveri postojeće module i izvrši `npm run lint`, `npm run test:invariants` i `npm run build`. Projekat u ovom checkout-u nema deklarisanu open-source licencu; dok se licenca ne doda, nemoj pretpostavljati dozvolu za redistribuciju ili komercijalnu upotrebu.
