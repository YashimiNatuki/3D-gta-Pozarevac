# Web igra Požarevac — GitHub audit (bez automatskog merge-a)

> **Stanje pregledano:** 2026-10-17 · **Branch:** `main` · **Tip projekta:** React, Vite, Three.js, Cannon-es, TypeScript.  
> **Nije isto što i:** zasebni Unity/Cesium repozitorijum `VKT-PozarevacCity`.

## Sažetak dokaza

| ID | Prioritet | Nalaz | Dokaz |
|---|---|---|---|
| GTA-001 | P1 dokumentovana provera ne radi | README upućuje na `npm run test:invariants`, ali skripta ne postoji u aktuelnom root `package.json` | README „Pokretanje web igre“ + package scripts |
| GTA-002 | P2 testing gap | `package.json` nema `test` skriptu; `lint` pokreće samo `tsc --noEmit` | `package.json` |
| GTA-003 | P2 Windows kompatibilnost | `clean` koristi `rm -rf dist server.js`, što nije nativna PowerShell komanda | `package.json` |
| GTA-004 | P1 integracija | 5 PR-ova ostaje otvoreno, uključujući NPC engine, misije, landmarke i intro; nisu potvrđeni kao integrisani na `main` | GitHub PR listing |
| GTA-005 | P2 sprovođenje CI | Prisutni su CodeQL i `webpack.yml` workflow fajlovi; iz samog prisustva se ne može zaključiti da pokrivaju gameplay regresije | `.github/workflows/` |

## GTA-001 — Dokumentovana skripta ne postoji

**Reprodukcija:** pogledati listu `scripts` u root `package.json`. Postoje `dev`, `dev-app`, `build`, `start`, `preview`, `clean`, `lint`. Nema `test:invariants`.

**Posledica:** `npm run test:invariants` iz README završava greškom „Missing script“.

**Predlog:** Ako postoji stvarni test runner, navesti proverenu komandu i dodati odgovarajuću npm skriptu. Ako test još ne postoji, ukloniti neistinito uputstvo i označiti test kao TODO sa konkretnim test planom (determinističko spawn/save/missions/physics).

## GTA-002 — Tipovi nisu isto što i testovi

`npm run lint` pokreće `tsc --noEmit`, što je statička TypeScript provera. Ona **ne** pokriva kolizije, čuvanje igre, kinematiku, rezoluciju objekata ili navigaciju NPC-jeva. Ne predstavljati je kao ceo test suite.

**Predlog:** dodati zasebne `typecheck`, `test`, `test:smoke` komande sa stvarnim automatizovanim testovima, pa zatim povezati CI. Ne dodavati lažne komande bez implementacije.

## GTA-003 — Windows cleanup

`rm -rf` je POSIX sintaksa. Za PowerShell/Windows npm scripts koristiti portable Node `fs.rmSync` skriptu, *nakon* reprodukcije i provere da brisanje `server.js` nije opasno za radni source. Ne pokretati `clean` u korisnikovom checkout-u dok se ne pregleda efekat. Ovo je review nalaz, ne izvršena komanda.

## GTA-004 — PR integracija

Otvoreni PR-ovi u trenutku audita:

- #10 Feature/hq npc relationship engine
- #9 Feat/npc personality mission clarity
- #3 Feat/pozarevac landmarks 3d
- #2 Improve Požarevac missions and intro video safety
- #1 Cinematic THUG LIFE game intro video

**Ne spajati automatski.** Prvo pregledati diff, mergeability, date modele i testove, zatim na privremenoj grani integrisati minimalnu nezavisnu funkciju i potvrditi runtime. Posebno paziti na zavisnosti između misija, NPC stanja i fizičkog sveta.

## Važna granica: Unity projekat

`VKT-PozarevacCity` već opisuje novije Unity/Cesium prototipove, razvojne Windows pakete i testne zapise. Nikakvo prebacivanje Unity scena u web repo nije urađeno ovim auditom; koordinatni sistem, licence i geografska semantika moraju se povezivati preko eksplicitnih adaptera, ne kopiranjem C# u TS.

## Plan lokalne verifikacije (Ubuntu/WSL2 terminal, iz web repo root-a)

```bash
node --version
npm --version
npm install
npm run lint
npm run build
```

Za reproduktibilan CI sledeći korak je lockfile/installer politika. **Nemoj** kopirati Windows PowerShell sintaksu u bash. Nema `test:invariants` dok se stvarno ne implementira. Pre bilo kakvog `npm ci`, proveriti da li je prisutan aktuelni, odgovarajući `package-lock.json`; GitHub root sadrži i `bun.lock`.

## Status provere

- [x] README, package.json, root i workflow imena pročitani.
- [x] Lista 5 otvorenih PR-ova očitana.
- [x] Proverena neusaglašenost README test komande i scripts.
- [ ] Lokalni `npm install`, lint, build — nisu pokrenuti.
- [ ] CI workflow logovi i PR diff — nisu nezavisno pregledani ovim auditom.
- [ ] Three.js browser, Unity Editor, collision/misije/save smoke — nisu pokrenuti.
- [ ] Spojene grane ili izvršen deploy — **nije rađeno**.

## Prioriteti

1. Ispraviti dokumentovanu proveru i uspostaviti stvarni test runner.
2. Napraviti reproduktibilan build i verifikovati verziju Node-a potrebnu za instalirane pakete.
3. Stabilizovati collision/save/mission testove pre NPC i geo integracije.
4. Uraditi PR-by-PR review bez automatskog merge-a.
5. Performance/visual dijagnostiku raditi tek uz lokalnu igru, hardver i eksplicitnu dozvolu.

Izveštaj je statički pregled; **ne predstavlja prolazak builda ili igrivosti**.
