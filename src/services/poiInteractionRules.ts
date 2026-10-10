export const VASARISTE_POI_ID = 'vasariste_stadium';

export interface PoiInteractionStamp {
  id: string;
  at: number;
}

export function shouldAutoActivatePoi(poiId: string | undefined, previousPoiId: string | undefined): boolean {
  return poiId === VASARISTE_POI_ID && poiId !== previousPoiId;
}

export function canInteractWithPoi(
  lastInteraction: PoiInteractionStamp | null,
  poiId: string,
  now: number,
  cooldownMs = 1800,
): boolean {
  return !lastInteraction || lastInteraction.id !== poiId || now - lastInteraction.at >= cooldownMs;
}
