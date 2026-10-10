# Otvoreni map podaci i atribucija

## OSM podloga u 3D sceni

`public/data/pozarevac-osm-extract.json` je lokalni snapshot puteva, zgrada, zelenih površina i voda iz OpenStreetMap-a za okvir `[44.6157, 21.1798, 44.6269, 21.1958]`. Snapshot je preuzet 10. oktobra 2026. preko jednog ograničenog Overpass upita; igra ga učitava sa svog origin-a i ne šalje zahteve map servisima tokom gameplay-a. `scripts/update-pozarevac-osm.py` dokumentuje i ponavlja taj postupak bez spoljne Python biblioteke.

Vektorski podaci su pod [Open Database License (ODbL)](https://www.openstreetmap.org/copyright). U sceni se prikazuje vidljiva atribucija „© OpenStreetMap contributors“ sa vezom ka uslovima. Snapshot ostaje dostupan kao izdvojeni podatkovni fajl uz licencu i izvor. OpenStreetMap-ovi javni raster tile serveri nisu korišćeni za preuzimanje/offline cache: njihova politika izričito zabranjuje masovno preuzimanje i pripremu tile arhiva.

Map tekstura je sopstveni renderer projekta nad OSM geometrijom — **nije satelitski snimak**. Otvoreni sloj prikazuje stvarne evidentirane ulice i footprint-e u WGS84 projekciji Požarevac origin-a (44.62130 N, 21.18780 E; približno 16 m po Three.js jedinici). 3D zgrade, visine, okolni detalji i delovi izvan izvatka i dalje su gameplay scenografija, ne survey-precizna rekonstrukcija.

## Satelitske slike i elevacija

Postojeći Google Maps prozor u `GoogleMapsModal.tsx` prikazuje Google roadmap/satellite/hybrid kao ugnježdenu mapu. Taj prikaz ostaje kod provajdera; igra ne preuzima, ne cache-uje i ne pretvara Google tile-ove u teksturu sveta. Za istu svrhu ne koristi se `tile.openstreetmap.org` kao offline tile izvor.

Copernicus Sentinel-2 podaci dostupni su besplatno; 4 spectral bands imaju 10 m prostornu rezoluciju. To je korisno za širi land-cover/vegetation prikaz, ali nije detalj nivoa pojedinačnih trotoara i krovova.

### Ugrađeni Copernicus reljef

`public/data/pozarevac-dem-heightfield.json` sadrži obrađeni 97×97 visinski grid za teren 160×160 game jedinica (2.56×2.56 km po projekciji). Izvor je Copernicus DEM GLO-30 Public COG tile za N44/E021. Podaci su u EPSG:4326, vertikalni datum EGM2008 i jedinica su metri. Visine su normalizovane na vrednost DEM-a na centralnom koordinatnom origin-u, a mesh koristi skalu 16 stvarnih metara po game jedinici. Čačalica je pozicionirana na GPS koordinati 44.61420, 21.20120; iz GLO-30 se dobija približno 157 m, naspram oko 84 m na centru (oko 74 m razlike, približno 4.6 game jedinica). To je reljefna razlika merena iz DSM-a, a ne lokalni LiDAR survey.

Copernicus GLO-30 je **DSM**, pa visine uključuju vegetaciju i objekte; pixel je nominalno 30 m, interpolacija ne stvara dodatne detalje. 3D rezultat zato predstavlja stvarnu regionalnu kotu/greben i širu okolinu, ne pojedinačne ivičnjake niti bare-earth model. Za opštu distribuciju koristi se obavezno Copernicus izvorno obaveštenje koje je uključeno u DEM metadata i na terenskom UI overlay-u. Reprodukovanje heightfield-a: preuzmi izvorni COG i pokreni `python3 scripts/process-pozarevac-dem.py <copernicus-tile.tif>` (zahteva `rasterio` i `numpy`). Ne commit-uj sirovi COG od 43 MB; u repou ostaje mali obrađeni grid.

## Izvori

- [OpenStreetMap attribution guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines)
- [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/)
- [Overpass API guidance](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [Copernicus Sentinel-2](https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-2)
- [Copernicus DEM](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM)
- [Copernicus DEM open-data registry](https://registry.opendata.aws/copernicus-dem/)
- [Copernicus DEM GLO-30 COG tile N44/E021](https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N44_00_E021_00_DEM/Copernicus_DSM_COG_10_N44_00_E021_00_DEM.tif)
