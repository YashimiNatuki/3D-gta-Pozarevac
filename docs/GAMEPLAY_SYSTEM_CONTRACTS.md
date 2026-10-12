# Gameplay system contracts — 3D-VelikaKradjaTockova Po-Bl👁️k-C presentie®

**Status dokumenta:** specifikacija ponašanja i acceptance criteria; nije tvrdnja da je svaki UX detalj već implementiran u `main`.  
**Datum:** 2026-10-12

## 1. Osnovna pravila

1. Jedan autoritativni gameplay state po runtime-u; HUD je prikaz tog stanja, ne druga baza.
2. Misije imaju stabilne ID-jeve, validirane checkpoint-e i idempotentne nagrade.
3. Random događaji smeju da obogate grad, ali ne smeju prekidati prihvaćenu misiju ili spamovati igrača.
4. Svaka misija mora reći šta, gde, zašto i koji su uslovi/ograničenja, a stanje se mora videti u telefonu i HUD-u.
5. Save migration mora da čuva postojeći progres; novе мисије се додају reconciliation-om, ne resetovanjem save-a.
6. Ulični rivalitet, teritorije i uzgoj su fikcionalni sistemi igre. Napredovanje se modeluje kroz kontrolu zona, resurse u igri, reputaciju, logistiku i rizik — ne kroz real-world uputstva.

## 2. NPC dobacivanja (situacioni street barks)

### Okidači
- Proximity: igrač ulazi u prsten oko NPC-a i NPC je u vidnom/razumnom kontekstu.
- Situacioni događaj: igrač prolazi, auto naglo zakoči, nivo wanted-a poraste, igrač ulazi u novi reon ili se završi misija.
- Personality/relationship: trust, respect, fear, loyalty i raniji događaji mogu birati kategoriju dijaloga.
- Ne aktivirati istu bark repliku istog NPC-a više puta u kratkom intervalu.

### Kontrakt
`StreetBarkEvent` (predloženi koncept) sadrži `eventId`, `npcId`, `kind`, `dialogueKey`, `createdAtGameTime`, `cooldownGroup`, `priority` i opciono `audioCue`. Dogovorene poruke se čuvaju kao lokalizovani stringovi / kratki audio klipovi; generisani tekst ne sme da vrati izvršivi kod ili menja mission state.

Početne smernice za tuning (konfigurisati kroz gameplay settings):
- Proximity radius: 5–12 game jedinica, zavisno od scene scale.
- Per-NPC cooldown: 20–60 sekundi gameplay vremena.
- Global ambient speech budget: 1 bark po kratkom intervalu za mali radius, sa jitter-om.
- Priority: accepted-mission critical > danger/wanted warning > story bark > ambient chatter.
- Variation: više replika po kategoriji i seed/recent-history izbor bez neposrednog ponavljanja.
- Occlusion/volume: glas slabi sa rastojanjem; u kolima, razgovoru ili briefing-u smanjiti konkurentski govor.

Ove brojke su početni tuning predlog, ne rezultat merenja u trenutnom build-u.

## 3. Telefon — ponuda misije i prihvatanje

### Predloženi state machine

```text
idle → incoming_offer → offer_visible
  ├─ reject → dismissed/cooldown
  ├─ ignore → expired/cooldown
  └─ accept → accepted → briefing_focus → active
                                  ├─ completed
                                  ├─ failed
                                  └─ abandoned → available/retry
```

Telefon obrađuje UX; Mission Engine ostaje izvor istine za ID, status, checkpoint, rok, uslove i nagradu. Prihvat mora biti atomski: ako već postoji druga aktivna misija i pravilo ne dozvoljava zamenu, ponuda treba jasno da kaže zašto ne može biti prihvaćena.

### Šta igrač vidi
- ko zove/šalje poruku;
- kratak, karakterističan dijalog;
- razlog/svrhu posla;
- šta treba uraditi prvo;
- naredni checkpoint i reon;
- vreme/roaming/wanted/parcel/roba/uslov ako je relevantan;
- nagradu, rizik i uslov neuspeha;
- Accept, Reject, Later/Close.

Ne prikazivati nepoznat cilj kao da je potvrđen. Kada lokacija ili uslov nisu dostupni, pokazati blokadu i jasan sledeći korak.

## 4. Fokus prihvaćene misije — “samo ova misija sada”

Kada igrač prihvati poziv:
1. Otvoriti jedinstveni Mission Briefing/Phone Focus panel.
2. Privremeno prigušiti ambijentalnu muziku i nebitne street barks; koristiti audio ducking sa smooth fade-in/fade-out, a ne menjati master volume trajno.
3. Pauzirati automatsko otvaranje konkurentskih low-priority modala/ponuda do zatvaranja briefing-a ili do kritičnog interrupt-a.
4. HUD stavlja aktivni cilj, sledeći checkpoint, distancu, rok i blocker u prvi plan.
5. Ugasiti/confine dodatne objective markere nižeg prioriteta, ali ostaviti mapu/putanju i potrebne komande vidljive.
6. Nakon Accept/Continue, zatvoriti modal i vratiti gameplay input; ne zamrznuti igrača trajno.
7. Na pause/menu/escape dozvoliti povratak na aktivni briefing.
8. Nakon Completed/Failed/Abandoned vratiti prethodni audio miks i normalne event prioritete čak i ako se modal ne montira (cleanup mora biti u `finally`/lifecycle cleanup).

Preporučeni ugovor: `MissionFocusState = { missionId, reason, openedAt, duckingToken, suppressedEventGroups }`. Audio ducking treba da koristi token/stack ili centralni audio-mix manager kako dve istovremene UI komponente ne bi vratile pogrešnu jačinu. Fokus ne sme da ugasi police/danger interrupt koji je definisan kao kritičan.

## 5. Misije, checkpoint-i i save

- Jedan centralni mission catalog definiše tipove, giver-e, rute, required items, vremenske uslove, wanted pravila, turf effects i nagrade.
- Mission Engine obrađuje prihvatanje, aktivaciju, sledeći checkpoint, success/failure, abandon/retry i save reconciliation.
- HUD/Phone renderuju stanje iz Engine-a. UI ne dodeljuje nagrade direktno.
- Checkpoint aktivacija mora biti enter/exit-latched da igrač koji stoji u jednom markeru ne bi preskočio sledeće tačke.
- Nagrade su idempotentne po `missionId + rewardId`; reload/retry/dupliran event ne sme dvaput isplatiti isti reward.
- Save schema ima eksplicitnu verziju; nedostajući opciono polje dobija kompatibilan default; stari ID-jevi ne smeju tiho da promene identitet.
- Daily/ambient missions generišu se iz dozvoljene matrice pravila, ne iz slobodnog teksta koji može da izmisli nepodržane tipove/markere.

## 6. Teritorije / Turf Wars

`TurfZone` treba da ima stabilan `id`, ime, lokaciju/landmark reference, controlling gang, kontrolu 0–100, contested state, nagradu/income u igri, respect bonus i map overlay state.

- Kontrola se menja samo nakon završenog, validiranog mission event-a ili jasno definisanog gameplay tick-a.
- Novac/reputacija/territory reward moraju biti idempotentni i sačuvani zajedno.
- Rival reakcije su vezane za zone i relationship states; ne treba spawnovati neograničene NPC-eve.
- Ako se promeni mapa/koordinate zone, migracija mora očuvati ownership i progress starog save-a.
- Mapa koristi istu verziju canonical district registry-ja kao phone/HUD/missions.
- Zona koja nema potvrđenu stvarnu granicu mora biti označena kao fictional/gameplay area, a ne kao zvanična granica naselja.

## 7. Uzgoj / hidroponika kao fikcionalna ekonomija

Sistemski kontrakt treba da modeluje:
- plant plot ID, zone/district, state (empty/planted/growing/ready/harvested);
- game-time growth duration, fictional inputs, inventory/capacity, harvest payout/XP;
- uslove pristupa i eventualne gameplay risiko/territory modifiers;
- save state i catalog migration;
- UI feedback za rast, spremnost, žetvu, kapacitet ili blocker.

Ne praviti drugi nezavisni persistence path u modalu. Use existing game progress/save service. Ne prikazivati žetvu ili profit dok inventar/parcel event nije uspešno commit-ovan; za retry koristiti idempotency key.

## 8. Animacija, fizika i world state

- Player movement, model pose, footsteps/IK, collision and terrain height use a common frame/state update contract.
- Animation clip mapping must have fallback for missing idle/walk/run/jump clips.
- Render mesh and collision proxy remain separate; use simplified collision for city blocks, vehicles and street props.
- DEM height sampling must handle missing/out-of-bounds values and blend/fallback to prior terrain behavior.
- City asset loader must handle failed GLB load without blanking the scene.
- Time/weather lighting effects should update shared registered materials; dispose materials/geometries/listeners on scene teardown.
- UI focus, lost window focus and dialog open/close must clear stale player movement/orbit inputs.

## 9. Acceptance test matrix

| Area | Minimum regression test |
|---|---|
| NPC barks | No identical bark spam; short cooldown; mission focus suppresses low priority barks |
| Phone offer | Accept/reject/ignore paths all terminate; one active mission enforced |
| Mission focus | Audio duck starts and always releases; accepted mission stays primary; movement resumes after closing |
| Checkpoints | Cannot skip route while standing in a marker; correct active-next objective |
| Reward | Duplicate completion/reload cannot duplicate cash/XP/items |
| Turf | Ownership persists through save/load and map-catalog reconciliation |
| Hydroponics | Plant/grow/harvest transitions save once; plot/resource invariants hold |
| NPC relations | Scores clamp to bounds; duplicate relationship events are ignored; behavior persists through game progress |
| Movement/collision | WASD/arrow/sprint/jump/camera remain responsive after dialogs and window blur |
| Map/asset | Landmark anchors align to terrain, known scale, and valid POI; failed asset uses fallback |
| Performance | Low-end browser gracefully reduces expensive effects/instancing; no WebGL2 must not create a blank UI |
| Localization | Phone/HUD/dialogue keys resolve in Serbian and fallback locale |

## 10. Code locations discovered on feature branches

The branches inventory includes `src/services/dynamicMissionEngine.ts`, `missionRules.ts`, `gameDirector.ts`, `gameProgress.ts`, `missionBriefing.ts`, `streetEconomy.ts`, `npcPrompt.ts`, `npcRelationshipEngine.ts`, `pedestrianPanic.ts`, `trafficSystem.ts`, `poiInteractionRules.ts`, `BratinaPhoneModal.tsx`, `BotanicalFarmModal.tsx`, `TurfWarModal.tsx`, and `GtaPožarevacHud.tsx`. Availability on a feature branch is not proof of presence in current `main`.

## 11. Definition of done

Do not label this design “implemented” until tests for mission focus/audio restoration, NPC bark throttling, save reconciliation, turf, farm, and map alignment run on the chosen integrated branch. Attach CI run links and manual browser/Unity smoke-test evidence separately.
