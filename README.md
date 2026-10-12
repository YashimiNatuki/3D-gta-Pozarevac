# 3D-VelikaKradjaTockova Po-Bl👁️k-C presentie®

**Radni naziv igre:** 3D-VelikaKradjaTockova Po-Bl👁️k-C presentie®️  
**GitHub izvor:** [YashimiNatuki/3D-gta-Pozarevac](https://github.com/YashimiNatuki/3D-gta-Pozarevac)  
**Datum statusnog pregleda:** 2026-10-12

> **Važan status:** Ovo je browser/Three.js igra i projekat-specifični indeks rada. Unity/Cesium projekat je poseban lokalni Unity projekat. Pregledana GitHub grana `main` ne sadrži Unity `.unity` scene, C# gameplay skripte niti potpun Unity projekat. Zbog toga se Unity grad, Cesium 3D Tiles i browser igra ne mogu opisati kao već konačno spojeni.

## Cilj proizvoda

Igriva treće-lice 3D igra smeštena u stilizovan Požarevac: istraživanje kvartova, prepoznatljive lokacije, prolaznici sa kratkim situacionim dobacivanjima, telefon sa ponudama misija, teritorijalna kontrola, ekonomija, uzgoj kao fikcionalni gameplay sistem, saobraćaj, policija, zvuk i progresija.

Nov naziv igre je usvojen kao **brending projekta**. GitHub repozitorijum zadržava postojeće ime dok se ne odradi odvojena, bezbedna promena repo/Unity folder identiteta. To ne sme samo po sebi menjati Unity scene, import settings, asset GUID-ove, build profile ili Cesium origin.

## Šta je potvrđeno na GitHub-u

Pregled glavne grane `main` pokazao je:
- React 19, TypeScript, Vite, Three.js, Cannon-es i web audio zavisnosti.
- Ulazna tačka web aplikacije u `src/App.tsx`, scena u `src/components/ThreeCanvas.tsx`.
- Third-person kontroler i fizika u `src/services/thirdPersonController.ts` i `src/services/physicsEngine.ts`.
- Main ima specifikacije/roadmap dokumente, ali je u snapshot-u pregleda nedostajao root `README.md`.
- Veliki skup real-world map, GLB i gameplay sistema nalazi se u otvorenim feature granama/PR-ovima, a ne može se smatrati integrisanim u `main` pre njihovog bezbednog spajanja i provere.

Na grani `feat/pozarevac-landmarks-3d` postoje dokumentovani OSM podaci, Copernicus DEM GLO-30 visinski grid i tri stilizovana GLB landmarka: bolnica, Stari Korzo blok i stadion Vašarište. To su modeli za igru, ne geodetski/arhi­tektonski survey modeli.

## Gde je šta

| Oblast | Putanja | Svrha |
|---|---|---|
| Aplikaciona logika | `src/App.tsx` | Povezivanje HUD-a, scene i gameplay UI-ja |
| 3D renderer | `src/components/ThreeCanvas.tsx` | Three.js scena, render loop i prostorne interakcije |
| Igrač/kamera | `src/services/thirdPersonController.ts` | Kretanje, sprint/skok, kamera i prepreke |
| Misije | `src/services/dynamicMissionEngine.ts` | Ugovor i stanje aktivne misije na gameplay granama |
| NPC/personality | `src/services/npcPrompt.ts`, `npcRelationshipEngine.ts` | Dobacivanja i deterministički odnosi na odgovarajućoj feature grani |
| Grad/kvartovi | `src/services/pozarevacDistricts.ts`, `pozarevacLandmarks.ts` | Katalog lokacija/kvartova na odgovarajućoj feature grani |
| Teren/mapa | `src/services/terrainHeightfield.ts`, `osmGroundTexture.ts`, `terrainImagery.ts` | DEM uzorkovanje, OSM podloga i lokalni raster |
| Zgrade | `src/services/modularBuildingFactory.ts`, `urbanMicroLandmarks.ts` | Proceduralne zgrade i GLB landmarki |
| Asseti grada | `public/assets/landmarks/` | Stilizovani GLB modeli, na odgovarajućoj feature grani |
| Lokalni podaci | `public/data/` | OSM extract i DEM grid, na odgovarajućoj feature grani |
| Izvori i licence | `docs/MAP_DATA_SOURCES.md`, `docs/POZAREVAC_LANDMARK_SOURCES.md` | Atribucija, geografska ograničenja i izvori podataka |

## Pokretanje web igre

U WSL/Linux terminalu, iz checkout-a repozitorijuma:

```bash
npm ci
npm run dev-app
```

Uobičajene provere koje su definisane u projektu:

```bash
npm run lint
npm run test:invariants
npm run build
git diff --check
```

Ove komande proveravaju web projekat. **Ne kompajliraju Unity projekat** i same po sebi ne potvrđuju reprodukciju igre u Unity Editor-u.

## Unity i Cesium — pravilo integracije

Unity ostaje zaseban runtime dok se ne izabere i implementira eksplicitan most. Ne kopirati Unity C# direktno u Three.js runtime. Prvo:
1. Popisati postojeći Unity projekat, scene, Cesium komponentе, prefab-e, asset GUID-ove, model scale i lokalne promene.
2. Sačuvati postojeći Unity scene origin i Cesium konfiguraciju.
3. Odrediti kanonski geografski ugovor (WGS84 lokacije + provenijencija podataka), pa odvojene adaptere pretvaranja u Unity i Three.js lokalni koordinatni sistem.
4. Uskladiti testnu tačku poznate lokacije i visine u oba runtime-a; tek tada dodavati više građevina.
5. Napraviti smoke test koji potvrđuje lokaciju, orijentaciju, razmeru, koliziju i performanse.

Pogledaj [Unity/Cesium integracioni status](docs/PROJECT_STATUS_UNITY_CESIUM_INTEGRATION.md).

## Dizajn gameplay sistema

- **NPC dobacivanja:** kratke, situacione rečenice; proximity/cooldown i varijacije, bez ponavljanja svake sekunde.
- **Telefon/misije:** dolazna ponuda, prihvati/odbaci/ignoriši, pregled cilja i koraka, jedan autoritativni aktivni briefing.
- **Fokus prihvaćene misije:** jasno izdvojiti aktivnu misiju; smanjiti ambijentalnu muziku i nebitne HUD popup-e; pauzirati automatsko otvaranje konkurentskih poruka dok je briefing otvoren; ne blokirati input koji je potreban za igranje.
- **Teritorije:** kontrola kvartova, rival state, checkpoint-i, nagrade i save reconciliation sa stabilnim ID-jevima.
- **Uzgoj kao gameplay:** parcela, vreme/rast u igri, inventar, žetva, zaštita i reonska potražnja; ne treba duplirati persistence sistem.
- **Kretanje i svet:** prepreke, terrain-height sampling, collision, usklađena animacija i rezervni likovi za nedostajuće GLB modele.

Specifikacija i testovi navedeni su u [ugovorima gameplay sistema](docs/GAMEPLAY_SYSTEM_CONTRACTS.md).

## Trenutni PR rizik

Na dan pregleda, važni PR-ovi za landmarke, mission/intро i NPC engine su otvoreni, neki su prijavljeni kao `mergeable: false` i grane su divergirale od `main`. Ne spajati ih naslepo. Pogledaj [PR audit i preporučeni redosled](docs/PR_INTEGRATION_AUDIT_2026-10-12.md).

## Licenca, atribucija i pouzdanost

OSM podaci moraju zadržati Open Database License atribuciju; DEM, GeoTIFF, video, GLB i font/model licence moraju biti proverene pre javnog redistribuiranja. Imena kvartova, POI lokacije, stilizovane zgrade i game-unit koordinate nisu automatski zvanične geodetske granice ili arhitektonski modeli.

## Povezani projekti

- [AiChatBrat v420 web app](https://github.com/YashimiNatuki/aichatbrat-web) — odvojeni full-stack AI proizvod.
- [Legacy AiChatBrat v420](https://github.com/YashimiNatuki/AiChatBrat-v.420) — stariji README/blueprint materijal.
- [Požarevac + AiChatBrat orchestrator](https://github.com/YashimiNatuki/pozarevac-ai-orchestrator) — indeks i adapter ugovori, ne monolit koji spaja source fajlove.

Pravilo ostaje: moduli se razvijaju i testiraju nezavisno; integracija ide kroz verzionisane, tipizirane ugovore.
