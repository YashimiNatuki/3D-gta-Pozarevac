# Požarevac: izvori landmarka i pouzdanost koordinata

Ovaj dokument razdvaja javno dokumentovane nazive od lokalnih/neformalnih labela i od autorske geometrije igre. GLB landmark modeli su stilizovane rekonstrukcije namenjene igri, a ne zvanični arhitektonski modeli. Bolnica je prikazana samo kao javno dostupna spoljašnjost.

## Javno dokumentovani landmarki

| Lokacija | Šta je potkrepljeno | Izvori |
|---|---|---|
| Opšta bolnica Požarevac | Postojanje javne zdravstvene ustanove; igra ne reprodukuje unutrašnjost ili bezbednosnu infrastrukturu. | [OB Požarevac](https://bolnica.obp.rs/), [Ministarstvo zdravlja](https://zdravlje.gov.rs/tekst/373195/opsta-bolnica-pozarevac.php), [Ministarstvo za evropske integracije](https://www.mei.gov.rs/eng/news/2317/more/w/0/reconstructed-part-of-the-general-hospital-in-pozarevac-officially-opened/) |
| Stari Korzo | Javno dokumentovan naziv zone/ulice; scene izloga i pasaža su autorski. | [PlanPlus](https://www.planplus.rs/pozarevac/ulica/stari-korzo/608010688), [Kafe Korzo](https://kafekorzo.rs/), [Film in Serbia](https://www.filminserbia.com/pozarevac-2/?lang=sr) |
| Vašarište | Lokalno/historijski naziv povezan sa gradskim stadionom, danas vezanim za ime dr Mihaila Andejevića Andrejke. | [Novosti](https://www.novosti.rs/c/srbija/vesti/1143962/pored-andrejke-slave-ostale-svoje-velikane-gradskom-fudbalskom-stadionu-pozarevcu-ime-cuvenog-sugradjanina-mihajla-andrejevica), [StadiumDB](https://stadiumdb.com/stadiums/ser/stadion_vasariste) |
| Busije | Naziv je dokumentovan u lokalnim obaveštenjima; precizne granice naselja nisu tretirane kao zvanično potvrđene. | [Grad Požarevac — Toplifikacija](https://pozarevac.rs/obavestenje-jp-toplifikacija-31/), [Grad Požarevac — hram Sv. Petke](https://pozarevac.rs/osvestan-hram-svete-petke/), [Paragraf](http://demo.paragraf.rs/demo/combined/Old/t/t2009_07/t07_0448.htm) |
| Đurđeve rupe | Dokumentovan naziv ulice; rute/tačke u igri su izmišljene. | [Grad Požarevac](https://pozarevac.rs/author/bokan/page/136/?lang=en&lng=lat), [PlanPlus](https://www.planplus.rs/pozarevac/ulica/djurdjeve-rupe/608000514), [Boom93](https://boom93.rs/article/34747/pozar-u-ulici-durdeve-rupe-tuzilastvo-nalozilo-uvidaj) |

## Lokalni ili neformalni nazivi

**Blok C** i **Đuranske favele/Djuranske favele** nisu zvanično potvrđeni kao kartografski entiteti. U igri su zadržani kao lokalne orijentacione oznake oko Tabačke čaršije, u skladu sa korisnikovom lokalnom korekcijom. Ne predstavljaju zvanične granice naselja.

## Vašarište — koordinate i izvori

TomTom POI pretraga za “Gradski stadion Vašarište” vratila je nepovezane stadione van Požarevca; pretraga zato nije korišćena za pomeranje POI-ja. TomTom geokoder je vratio **Gradsko sokače, 44.6219202 N, 21.1849692 E** — obližnji adresni rezultat, a ne potvrđen centar stadiona. Scena zadržava postojeću lokalnu tačku **(-24, 12)**, označenu u `pozaravacPoi.ts` kao `local-approximate`; njen GPS je izveden iz lokalnog WGS84 origin-a, ne tvrdnja o anketiranoj lokaciji.

## Koordinatni okvir, teren i ograničenja izvora

- `src/services/pozaravacPoi.ts` koristi lokalni tangentni ravan sa origin-om **44.62130 N, 21.18780 E**, skalom približno **16 m po Three.js jedinici**, istok kao +X i sever kao −Z.
- TomTom Maps MCP konektor u ovoj sesiji podržava geokodiranje, POI pretragu, rute i vizuelizaciju mape; ne vraća spreman 3D teren/DEM ili Three.js mesh.
- Pokušaj preuzimanja vektorske geometrije preko javnog OSM Overpass servisa završio se greškama 504/500; zato **nije** ugrađen nepotvrđen OSM izvod, raster podloga ili DEM i nijedan novi teren nije predstavljen kao realan.
- Za budući stvarni 3D reljef treba dodati izvor visina (npr. DEM) koji pokriva isti bounding box, obraditi njegove visine/koordinate prema lokalnom transform-u i zabeležiti atribuciju/licencu. Dok to ne postoji, reljef i mikro-lokacije ostaju autorski gameplay prikaz.
