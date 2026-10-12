import assert from 'node:assert/strict';
import { NpcRelationshipEngine } from '../src/services/npcRelationshipEngine';

const engine = new NpcRelationshipEngine({ memoryLimit: 3 });
const registered = engine.registerNpc({ id: 'sale', name: 'Sale', archetype: 'loyal_friend' });
assert.equal(registered.disposition, 'neutral');
assert.equal(registered.scores.fear, 0);
const favor = engine.recordEvent('sale', {
  eventId: 'mission:delivery:complete', type: 'completed_favor', occurredAt: 100, note: 'Isporučen paket na vreme.',
});
assert.ok(favor);
assert.equal(favor?.scores.trust, 59);
assert.equal(favor?.scores.respect, 55);
assert.equal(favor?.scores.loyalty, 58);
const duplicate = engine.recordEvent('sale', {
  eventId: 'mission:delivery:complete', type: 'betrayal', occurredAt: 101,
});
assert.equal(duplicate?.scores.trust, 59, 'duplicate event IDs must be idempotent');
engine.recordEvent('sale', { eventId: 'risk:1', type: 'shared_risk', occurredAt: 200 });
engine.recordEvent('sale', { eventId: 'protect:1', type: 'protected', occurredAt: 300 });
const afterPositiveArc = engine.getSnapshot('sale');
assert.ok(afterPositiveArc);
assert.equal(afterPositiveArc?.disposition, 'trusted');
assert.equal(afterPositiveArc?.memories.length, 3, 'memory history must obey its configured bound');
const outcome = engine.getInteractionOutcome('sale', { missionAvailable: true });
assert.equal(outcome?.action, 'offer_mission');
assert.equal(outcome?.canOfferMission, true);
assert.equal(outcome?.tradePriceMultiplier, 0.85);
const beforeDecay = afterPositiveArc?.scores.fear ?? 0;
const decayed = engine.applyDecay('sale', 2);
assert.ok(decayed);
assert.ok((decayed?.scores.fear ?? 100) <= beforeDecay);
assert.ok((decayed?.scores.trust ?? 0) <= (afterPositiveArc?.scores.trust ?? 0));

const hostileEngine = new NpcRelationshipEngine();
hostileEngine.registerNpc({
  id: 'rival', name: 'Rival', archetype: 'territorial_rival',
  initialScores: { trust: 40, respect: 40, fear: 0, loyalty: 40 },
});
for (const [index, type] of (['betrayal', 'betrayal', 'insult', 'lie'] as const).entries()) {
  hostileEngine.recordEvent('rival', { eventId: `bad:${index}`, type, occurredAt: index + 1 });
}
const hostile = hostileEngine.getInteractionOutcome('rival');
assert.equal(hostile?.disposition, 'hostile');
assert.equal(hostile?.action, 'refuse');
assert.equal(hostile?.canOfferMission, false);

const officerEngine = new NpcRelationshipEngine();
officerEngine.registerNpc({ id: 'officer', name: 'Milan', archetype: 'duty_bound_officer' });
const escalation = officerEngine.getInteractionOutcome('officer', { wantedLevel: 3 });
assert.equal(escalation?.action, 'call_backup');
assert.equal(escalation?.dialogueKey, 'officer_wanted_escalation');

const clampedEngine = new NpcRelationshipEngine();
clampedEngine.registerNpc({
  id: 'trader', name: 'Borko', archetype: 'street_smart_trader',
  initialScores: { trust: 200, respect: -50, fear: 300, loyalty: 120 },
});
assert.deepEqual(clampedEngine.getSnapshot('trader')?.scores, { trust: 100, respect: 0, fear: 100, loyalty: 100 });
assert.equal(clampedEngine.getSnapshot('missing'), null);
assert.equal(clampedEngine.recordEvent('missing', { eventId: 'no-npc', type: 'kindness', occurredAt: 1 }), null);
assert.equal(clampedEngine.applyDecay('missing', 1), null);
console.log('NPC relationship invariants: PASS');
