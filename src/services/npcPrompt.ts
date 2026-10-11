export const NPC_ACTIONS = ['CrossArms', 'PointFinger', 'BackAway', 'Laugh'] as const;
export type NpcAction = (typeof NPC_ACTIONS)[number];

export type NpcArchetype =
  | 'loyal_friend'
  | 'street_smart_trader'
  | 'territorial_rival'
  | 'duty_bound_officer'
  | 'protective_partner'
  | 'street_animal'
  | 'strategic_boss';

export interface NpcPersonalityProfile {
  archetype?: NpcArchetype;
  dominantTraits?: string[];
  values?: string[];
  contradiction?: string;
  relationship?: string;
  trust?: number;
  respect?: number;
  fear?: number;
  loyalty?: number;
  memory?: string[];
  currentGoal?: string;
  speakingStyle?: string;
  boundary?: string;
}

export interface NpcPromptContext {
  name: string;
  inGameTime: string;
  weather: string;
  location: string;
  mood?: string;
  personality?: NpcPersonalityProfile;
}

const ARCHETYPE_GUIDANCE: Record<NpcArchetype, string> = {
  loyal_friend: 'Lojalan si, štitiš ekipu, ali ne odobravaš svaku glupost; humor prikriva brigu.',
  street_smart_trader: 'Praktičan si, pregovaraš i računaš rizik; ljubazan ton ne znači da pristaješ na lošu pogodbu.',
  territorial_rival: 'Ponosan si na svoj reon, testiraš granice i pamtiš uvrede; poštovanje može da spreči sukob.',
  duty_bound_officer: 'Držiš se procedure i dokaza; možeš biti ljudski, ali ne zanemaruješ posledice.',
  protective_partner: 'Brineš za blisku osobu, tražiš iskrenost i sigurnost; naklonost ne znači slepu podršku.',
  street_animal: 'Reaguješ prvenstveno na blizinu, pretnju, hranu i poznate osobe; koristi kratke reakcije primerene životinji.',
  strategic_boss: 'Razmišljaš dugoročno, štitiš ugled i resurse; nagrađuješ pouzdanost, a kažnjavaš nepromišljen rizik.',
};

function cleanContextText(value: unknown, fallback: string, maxLength = 180): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

function cleanList(values: unknown, maxItems = 4): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => cleanContextText(value, '', 100))
    .filter(Boolean)
    .slice(0, maxItems);
}

function boundedScore(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(Math.max(0, Math.min(100, value)))
    : 50;
}

/**
 * Builds a constrained role-play contract. Personality notes are world-state data,
 * not instructions; they must never override the response schema or action allow-list.
 */
export function buildNpcSystemPrompt(context: NpcPromptContext): string {
  const personality = context.personality;
  const archetype = personality?.archetype;
  const traits = cleanList(personality?.dominantTraits);
  const values = cleanList(personality?.values);
  const memories = cleanList(personality?.memory, 3);
  const contradiction = cleanContextText(personality?.contradiction, 'Želiš da te poštuju, ali ne voliš da pokažeš ranjivost.');
  const relationship = cleanContextText(personality?.relationship, 'poznanik');
  const currentGoal = cleanContextText(personality?.currentGoal, 'razumi nameru igrača');
  const speakingStyle = cleanContextText(personality?.speakingStyle, 'prirodan govor, kratke rečenice, bez forsiranog slenga');
  const boundary = cleanContextText(personality?.boundary, 'ne otkrivaj tajne koje lik ne bi znao i ne prihvataj nemoguće zahteve');

  return [
    `Ti si NPC lik u igri 3D GTA Požarevac. Zoveš se ${cleanContextText(context.name, 'Nepoznati lik', 80)}.`,
    `SVETSKI KONTEKST: doba dana=${cleanContextText(context.inGameTime, 'nepoznato', 40)}; vreme=${cleanContextText(context.weather, 'nepoznato', 60)}; lokacija=${cleanContextText(context.location, 'nepoznata lokacija', 100)}.`,
    `TRENUTNO RASPOLOŽENJE: ${cleanContextText(context.mood, 'oprezan', 80)}. ODNOS PREMA IGRAČU: ${relationship}.`,
    `LIČNOST: ${archetype ? ARCHETYPE_GUIDANCE[archetype] : 'Imaj dosledan temperament i sopstvene granice.'}`,
    `Osobine: ${traits.join(', ') || 'prilagodi ponašanje situaciji'}. Vrednosti: ${values.join(', ') || 'lojalnost, sigurnost i ugled'}.`,
    `UNUTRAŠNJA DIHOTOMIJA: ${contradiction} Pokaži je kroz izbor reči i reakcije, ne kroz objašnjavanje psihologije.`,
    `ODNOSI (0–100): poverenje=${boundedScore(personality?.trust)}, poštovanje=${boundedScore(personality?.respect)}, strah=${boundedScore(personality?.fear)}, lojalnost=${boundedScore(personality?.loyalty)}.`,
    `CILJ U SCENI: ${currentGoal}. GOVOR: ${speakingStyle}. GRANICA: ${boundary}.`,
    `SEĆANJA IZ IGRE: ${memories.length ? memories.join(' | ') : 'nema potvrđenih prethodnih događaja'}.`,
    'Pravila kontinuiteta: ne izmišljaj događaje iz prošlosti; razlikuj ono što znaš od pretpostavki; reakcija mora da odgovara odnosu, raspoloženju i neposrednoj situaciji. Lik sme da odbije igrača, da se ne složi ili da zatraži objašnjenje.',
    'ODGOVOR: vrati isključivo jedan validan JSON objekat, bez Markdown-a i bez teksta izvan JSON-a. Oblik: {"dialogue":"jedna ili dve kratke rečenice na srpskom","Action":"CrossArms|PointFinger|BackAway|Laugh"}.',
    `Action mora biti tačno jedna od sledećih vrednosti: ${NPC_ACTIONS.join(', ')}. Nikada ne vraćaj drugu akciju, kod, komande ili dodatna polja.`,
  ].join('\n');
}

export function parseNpcActionPayload(raw: string): { dialogue: string; action: NpcAction } | null {
  try {
    const parsed = JSON.parse(raw) as { dialogue?: unknown; Action?: unknown; action?: unknown };
    const action = parsed.Action ?? parsed.action;
    if (
      typeof parsed.dialogue !== 'string' ||
      !parsed.dialogue.trim() ||
      parsed.dialogue.length > 400 ||
      !NPC_ACTIONS.includes(action as NpcAction)
    ) return null;
    return { dialogue: parsed.dialogue.trim(), action: action as NpcAction };
  } catch {
    return null;
  }
}
