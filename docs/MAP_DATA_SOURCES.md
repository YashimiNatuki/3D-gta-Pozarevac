# Otvoreni map podaci i atribucija

## OSM podloga u 3D sceni

`public/data/pozarevac-osm-extract.json` je lokalni snapshot puteva, zgrada, zelenih površina i voda iz OpenStreetMap-a za okvir `[44.6157, 21.1798, 44.6269, 21.1958]`. Snapshot je preuzet 10. oktobra 2026. preko jednog ograničenog Overpass upita; igra ga učitava sa svog origin-a i ne šalje zahteve map servisima tokom gameplay-a. `scripts/update-pozarevac-osm.py` dokumentuje i ponavlja taj postupak bez spoljne Python biblioteke.

Vektorski podaci su pod [Open Database License (ODbL)](https://www.openstreetmap.org/copyright). U sceni se prikazuje vidljiva atribucija „© OpenStreetMap contributors“ sa vezom ka uslovima. Snapshot ostaje dostupan kao izdvojeni podatkovni fajl uz licencu i izvor. OpenStreetMap-ovi javni raster tile serveri nisu korišćeni za preuzimanje/offline cache: njihova politika izričito zabranjuje masovno preuzimanje i pripremu tile arhiva.

Map tekstura je sopstveni renderer projekta nad OSM geometrijom — **nije satelitski snimak**. Otvoreni sloj prikazuje stvarne evidentirane ulice i footprint-e u WGS84 projekciji Požarevac origin-a (44.62130 N, 21.18780 E; približno 16 m po Three.js jedinici). 3D zgrade, visine, okolni detalji i delovi izvan izvatka i dalje su gameplay scenografija, ne survey-precizna rekonstrukcija.

## Satelitske slike i elevacija

Postojeći Google Maps prozor u `GoogleMapsModal.tsx` prikazuje Google roadmap/satellite/hybrid kao ugnježdenu mapu. Taj prikaz ostaje kod provajdera; igra ne preuzima, ne cache-uje i ne pretvara Google tile-ove u teksturu sveta. Za istu svrhu ne koristi se `tile.openstreetmap.org` kao offline tile izvor.

Copernicus Sentinel-2 podaci dostupni su besplatno; 4 spectral bands imaju 10 m prostornu rezoluciju. To je korisno za širi land-cover/vegetation prikaz, ali nije detalj nivoa pojedinačnih trotoara i krovova. Copernicus DEM GLO-30 je slobodno dostupan u rezoluciji 30 m, ali je DSM (uključuje zgrade i vegetaciju), ne čisti model tla. EEA-10 10 m DEM pristup ima ograničenja korisničke podobnosti. Ovi izvori nisu ugrađeni kao da su već pribavljeni; stvarni elevation layer zahteva posebnu obradu i obavezno navođenje izvora/licence pre distribucije.

## Izvori

- [OpenStreetMap attribution guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines)
- [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/)
- [Overpass API guidance](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [Copernicus Sentinel-2](https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-2)
- [Copernicus DEM](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM)
- [Copernicus DEM open-data registry](https://registry.opendata.aws/copernicus-dem/)
