export type NpcArchetype =
  | 'loyal_friend' | 'street_smart_trader' | 'territorial_rival'
  | 'duty_bound_officer' | 'protective_partner' | 'street_animal' | 'strategic_boss';
export type NpcRelationshipEventType =
  | 'kindness' | 'completed_favor' | 'shared_risk' | 'protected' | 'apology'
  | 'insult' | 'betrayal' | 'threat' | 'bribe' | 'lie' | 'ignored';
export type NpcDisposition = 'hostile' | 'wary' | 'neutral' | 'friendly' | 'trusted';
export type NpcInteractionAction = 'refuse' | 'warn_player' | 'greet' | 'trade_fairly' | 'offer_mission' | 'call_backup';
export interface NpcRelationshipScores { trust: number; respect: number; fear: number; loyalty: number }
export interface NpcRelationshipProfile {
  id: string; name: string; archetype: NpcArchetype; initialScores?: Partial<NpcRelationshipScores>;
}
export interface NpcRelationshipEvent {
  /** Stable caller-generated ID. Replaying the same ID never applies an event twice. */
  eventId: string; type: NpcRelationshipEventType; occurredAt: number; note?: string;
}
export interface NpcRelationshipMemory {
  eventId: string; type: NpcRelationshipEventType; occurredAt: number; note: string;
}
export interface NpcRelationshipSnapshot {
  npcId: string; name: string; archetype: NpcArchetype; scores: NpcRelationshipScores;
  disposition: NpcDisposition; memories: NpcRelationshipMemory[]; lastEventAt: number | null;
}
export interface NpcInteractionContext { missionAvailable?: boolean; tradeAvailable?: boolean; wantedLevel?: number }
export interface NpcInteractionOutcome {
  disposition: NpcDisposition; action: NpcInteractionAction; dialogueKey: string;
  canOfferMission: boolean; tradePriceMultiplier: number;
}
export interface NpcRelationshipEngineOptions { memoryLimit?: number }

const SCORE_MIN = 0;
const SCORE_MAX = 100;
const DEFAULT_SCORE = 50;
const EVENT_DELTAS: Record<NpcRelationshipEventType, NpcRelationshipScores> = {
  kindness: { trust: 5, respect: 1, fear: -1, loyalty: 2 },
  completed_favor: { trust: 9, respect: 5, fear: -1, loyalty: 8 },
  shared_risk: { trust: 8, respect: 6, fear: -2, loyalty: 5 },
  protected: { trust: 10, respect: 7, fear: -5, loyalty: 10 },
  apology: { trust: 4, respect: 2, fear: -1, loyalty: 2 },
  insult: { trust: -8, respect: -9, fear: 1, loyalty: -3 },
  betrayal: { trust: -20, respect: -12, fear: 4, loyalty: -18 },
  threat: { trust: -10, respect: -2, fear: 12, loyalty: -5 },
  bribe: { trust: -3, respect: -5, fear: 0, loyalty: -3 },
  lie: { trust: -10, respect: -4, fear: 0, loyalty: -5 },
  ignored: { trust: -1, respect: 0, fear: 0, loyalty: -2 },
};
const clampScore = (value: number): number =>
  Math.round(Math.max(SCORE_MIN, Math.min(SCORE_MAX, Number.isFinite(value) ? value : DEFAULT_SCORE)));
const normalizeText = (value: unknown, maxLength: number): string => {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
};
function cloneScores(scores: NpcRelationshipScores): NpcRelationshipScores {
  return { trust: scores.trust, respect: scores.respect, fear: scores.fear, loyalty: scores.loyalty };
}
function getDisposition(scores: NpcRelationshipScores): NpcDisposition {
  if (scores.trust >= 75 && scores.loyalty >= 70 && scores.respect >= 55) return 'trusted';
  if (scores.trust < 25 && scores.respect < 25 && scores.fear < 60) return 'hostile';
  if (scores.fear >= 60 || scores.trust < 35 || scores.respect < 30) return 'wary';
  if (scores.trust >= 60 && scores.respect >= 50) return 'friendly';
  return 'neutral';
}
interface InternalNpcState {
  profile: NpcRelationshipProfile; scores: NpcRelationshipScores; memories: NpcRelationshipMemory[];
  seenEventIds: Set<string>; lastEventAt: number | null;
}
/**
 * Deterministic, renderer-agnostic NPC relationship state.
 * It does not access browser storage, network services, AI providers, or game entities.
 * Persist snapshots through the existing save layer when wiring it into gameplay.
 */
export class NpcRelationshipEngine {
  private readonly memoryLimit: number;
  private readonly npcs = new Map<string, InternalNpcState>();
  constructor(options: NpcRelationshipEngineOptions = {}) {
    this.memoryLimit = Math.max(1, Math.min(32, Math.floor(options.memoryLimit ?? 8)));
  }
  public registerNpc(profile: NpcRelationshipProfile): NpcRelationshipSnapshot {
    const id = normalizeText(profile.id, 100);
    const name = normalizeText(profile.name, 100);
    if (!id || !name) throw new Error('NPC id and name are required.');
    if (this.npcs.has(id)) throw new Error(`NPC "${id}" is already registered.`);
    const initial = profile.initialScores ?? {};
    const state: InternalNpcState = {
      profile: { id, name, archetype: profile.archetype },
      scores: {
        trust: clampScore(initial.trust ?? DEFAULT_SCORE),
        respect: clampScore(initial.respect ?? DEFAULT_SCORE),
        fear: clampScore(initial.fear ?? 0),
        loyalty: clampScore(initial.loyalty ?? DEFAULT_SCORE),
      },
      memories: [], seenEventIds: new Set<string>(), lastEventAt: null,
    };
    this.npcs.set(id, state);
    return this.toSnapshot(state);
  }
  public getSnapshot(npcId: string): NpcRelationshipSnapshot | null {
    const state = this.npcs.get(npcId);
    return state ? this.toSnapshot(state) : null;
  }
  public recordEvent(npcId: string, event: NpcRelationshipEvent): NpcRelationshipSnapshot | null {
    const state = this.npcs.get(npcId);
    if (!state) return null;
    const eventId = normalizeText(event.eventId, 120);
    if (!eventId || !Number.isFinite(event.occurredAt)) return this.toSnapshot(state);
    if (state.seenEventIds.has(eventId)) return this.toSnapshot(state);
    const delta = EVENT_DELTAS[event.type];
    if (!delta) return this.toSnapshot(state);
    state.scores = {
      trust: clampScore(state.scores.trust + delta.trust),
      respect: clampScore(state.scores.respect + delta.respect),
      fear: clampScore(state.scores.fear + delta.fear),
      loyalty: clampScore(state.scores.loyalty + delta.loyalty),
    };
    state.seenEventIds.add(eventId);
    state.lastEventAt = state.lastEventAt === null ? event.occurredAt : Math.max(state.lastEventAt, event.occurredAt);
    state.memories.push({
      eventId, type: event.type, occurredAt: event.occurredAt, note: normalizeText(event.note, 160),
    });
    if (state.memories.length > this.memoryLimit) state.memories.splice(0, state.memories.length - this.memoryLimit);
    return this.toSnapshot(state);
  }
  /** Fear fades fastest; trust/respect slowly return to neutral; loyalty follows current trust. */
  public applyDecay(npcId: string, elapsedGameHours: number): NpcRelationshipSnapshot | null {
    const state = this.npcs.get(npcId);
    if (!state) return null;
    if (!Number.isFinite(elapsedGameHours) || elapsedGameHours <= 0) return this.toSnapshot(state);
    const hours = Math.min(elapsedGameHours, 24 * 365);
    const neutralDrift = Math.min(50, hours * 0.25);
    const loyaltyDrift = Math.min(100, hours * 0.35);
    const fearDecay = Math.min(100, hours * 1.5);
    const drift = (value: number) => value < DEFAULT_SCORE
      ? Math.min(DEFAULT_SCORE, value + neutralDrift) : Math.max(DEFAULT_SCORE, value - neutralDrift);
    state.scores = {
      trust: clampScore(drift(state.scores.trust)),
      respect: clampScore(drift(state.scores.respect)),
      fear: clampScore(state.scores.fear - fearDecay),
      loyalty: clampScore(state.scores.loyalty < state.scores.trust
        ? Math.min(state.scores.trust, state.scores.loyalty + loyaltyDrift)
        : Math.max(state.scores.trust, state.scores.loyalty - loyaltyDrift)),
    };
    return this.toSnapshot(state);
  }
  public getInteractionOutcome(npcId: string, context: NpcInteractionContext = {}): NpcInteractionOutcome | null {
    const state = this.npcs.get(npcId);
    if (!state) return null;
    const scores = state.scores;
    const disposition = getDisposition(scores);
    const wanted = Number.isFinite(context.wantedLevel) ? Math.max(0, context.wantedLevel ?? 0) : 0;
    if (wanted >= 3 && state.profile.archetype === 'duty_bound_officer') {
      return { disposition, action: 'call_backup', dialogueKey: 'officer_wanted_escalation',
        canOfferMission: false, tradePriceMultiplier: 1 };
    }
    if (disposition === 'hostile') return {
      disposition, action: 'refuse', dialogueKey: 'npc_hostile_refusal',
      canOfferMission: false, tradePriceMultiplier: 1.25,
    };
    if (disposition === 'wary') return {
      disposition, action: 'warn_player', dialogueKey: 'npc_wary_warning',
      canOfferMission: false, tradePriceMultiplier: 1.15,
    };
    if (disposition === 'trusted' || disposition === 'friendly') {
      const canOfferMission = context.missionAvailable === true;
      return {
        disposition, action: canOfferMission ? 'offer_mission' : context.tradeAvailable ? 'trade_fairly' : 'greet',
        dialogueKey: disposition === 'trusted' ? 'npc_trusted_greeting' : 'npc_friendly_greeting',
        canOfferMission, tradePriceMultiplier: disposition === 'trusted' ? 0.85 : 0.95,
      };
    }
    return {
      disposition, action: context.tradeAvailable ? 'trade_fairly' : 'greet',
      dialogueKey: 'npc_neutral_greeting', canOfferMission: false, tradePriceMultiplier: 1,
    };
  }
  private toSnapshot(state: InternalNpcState): NpcRelationshipSnapshot {
    return {
      npcId: state.profile.id, name: state.profile.name, archetype: state.profile.archetype,
      scores: cloneScores(state.scores), disposition: getDisposition(state.scores),
      memories: state.memories.map((memory) => ({ ...memory })), lastEventAt: state.lastEventAt,
    };
  }
}
