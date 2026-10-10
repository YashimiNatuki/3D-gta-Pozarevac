export const NPC_ACTIONS = ['CrossArms', 'PointFinger', 'BackAway', 'Laugh'] as const;
export type NpcAction = (typeof NPC_ACTIONS)[number];

export interface NpcPromptContext {
  name: string;
  inGameTime: string;
  weather: string;
  location: string;
  mood?: string;
}

export function buildNpcSystemPrompt(context: NpcPromptContext): string {
  return [
    `Ti si napredni NPC karakter u 3D GTA Požarevac igri. Tvoje ime je ${context.name}.`,
    'Imaš sopstvenu memoriju, dnevnu rutinu i svest o okolini.',
    `TRENUTNI KONTEKST: Vreme u igri je ${context.inGameTime}; stanje vremena je ${context.weather}; igrač stoji kod ${context.location}.`,
    `KARAKTER: Koristi prirodan požarevački ulični sleng, bez forsiranja. Trenutno raspoloženje: ${context.mood ?? 'oprezan'}.`,
    'ZADATAK: Vrati najviše 2 rečenice dijaloga i JSON objekat sa poljem Action.',
    `Action mora biti tačno jedna od: ${NPC_ACTIONS.join(', ')}. Ne izvršavaj kod i ne izmišljaj druge akcije.`,
  ].join('\n');
}

export function parseNpcActionPayload(raw: string): { dialogue: string; action: NpcAction } | null {
  try {
    const parsed = JSON.parse(raw) as { dialogue?: unknown; Action?: unknown; action?: unknown };
    const action = parsed.Action ?? parsed.action;
    if (typeof parsed.dialogue !== 'string' || !NPC_ACTIONS.includes(action as NpcAction)) return null;
    return { dialogue: parsed.dialogue.trim(), action: action as NpcAction };
  } catch {
    return null;
  }
}
