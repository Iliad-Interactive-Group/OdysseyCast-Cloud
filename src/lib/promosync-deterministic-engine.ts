import type {
  AvailabilityQuery,
  AvailabilityResult,
  Campaign,
  CreativeAsset,
  InventorySlot,
  OrderLine,
  PlacementRule,
  SpotPlacementType,
} from '@/lib/sales-traffic-model';

interface PlacementCandidate {
  slotId: string;
  campaignId: string;
  orderLineId: string;
  score: number;
  ruleHits: string[];
  reasons: string[];
}

interface PromotionDecisionInput {
  query: AvailabilityQuery;
  inventorySlots: InventorySlot[];
  campaigns: Campaign[];
  orderLines: OrderLine[];
  creativeAssets: CreativeAsset[];
  placementRules: PlacementRule[];
}

export interface PromotionDecisionSummary {
  availability: AvailabilityResult[];
  placementCandidates: PlacementCandidate[];
  blockedOrderLines: Array<{ orderLineId: string; reasons: string[] }>;
}

function isCampaignActive(campaign: Campaign, airDate: string): boolean {
  return (
    campaign.status === 'active' && airDate >= campaign.startDate && airDate <= campaign.endDate
  );
}

function hasApprovedCreative(orderLineId: string, assets: CreativeAsset[]): boolean {
  return assets.some(
    (asset) =>
      asset.orderLineId === orderLineId &&
      asset.status === 'approved' &&
      asset.assetType === 'audio',
  );
}

function hasEnoughSeconds(slot: InventorySlot, seconds: number): boolean {
  const remaining = slot.maxSeconds - slot.reservedSeconds;
  return remaining >= seconds;
}

function hasLegalStatus(slot: InventorySlot): boolean {
  return slot.status === 'open' || slot.status === 'held';
}

function isPlacementTypeAllowed(
  placementType: SpotPlacementType,
  slot: InventorySlot,
  rules: PlacementRule[],
): { allowed: boolean; hits: string[] } {
  const activeRules = rules
    .filter((rule) => rule.enabled && rule.deterministic)
    .sort((a, b) => a.priority - b.priority);

  const hits: string[] = [];

  for (const rule of activeRules) {
    const conditionString = rule.conditions.join(' ').toLowerCase();
    const actionString = rule.actions.join(' ').toLowerCase();

    if (conditionString.includes('sponsorship') && placementType === 'sponsorship') {
      hits.push(rule.name);
      if (actionString.includes('deny') && slot.status !== 'open') {
        return { allowed: false, hits };
      }
    }

    if (conditionString.includes('blocked') && slot.status === 'blocked') {
      hits.push(rule.name);
      return { allowed: false, hits };
    }
  }

  return { allowed: true, hits };
}

function scorePlacementCandidate(
  slot: InventorySlot,
  orderLine: OrderLine,
  ruleHits: string[],
): PlacementCandidate {
  const remainingSeconds = slot.maxSeconds - slot.reservedSeconds;
  let score = 50;

  if (remainingSeconds >= orderLine.seconds * 2) score += 15;
  if (slot.status === 'open') score += 10;
  if (ruleHits.length > 0) score += Math.min(ruleHits.length * 5, 20);

  return {
    slotId: slot.id,
    campaignId: orderLine.campaignId,
    orderLineId: orderLine.id,
    score,
    ruleHits,
    reasons: [
      `Remaining seconds in break: ${remainingSeconds}`,
      `Placement type: ${orderLine.placementType}`,
      ruleHits.length
        ? `Matched deterministic rules: ${ruleHits.join(', ')}`
        : 'No explicit deterministic rule hit required',
    ],
  };
}

export function calculateAvailability(
  query: AvailabilityQuery,
  inventorySlots: InventorySlot[],
): AvailabilityResult[] {
  const scopedSlots = inventorySlots.filter((slot) => {
    if (!query.stationIds.includes(slot.stationId)) return false;
    if (slot.airDate < query.startDate || slot.airDate > query.endDate) return false;
    if (query.daypartIds?.length && !query.daypartIds.includes(slot.daypartId)) return false;
    return true;
  });

  const grouped = new Map<string, AvailabilityResult>();

  for (const slot of scopedSlots) {
    const key = `${slot.stationId}:${slot.daypartId}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        stationId: slot.stationId,
        daypartId: slot.daypartId,
        openSlots: 0,
        openSeconds: 0,
        confidence: 'strict',
        limitingFactors: [],
      });
    }

    const item = grouped.get(key)!;
    const remaining = Math.max(slot.maxSeconds - slot.reservedSeconds, 0);

    if (hasLegalStatus(slot) && remaining > 0) {
      item.openSlots += 1;
      item.openSeconds += remaining;
    }

    if (slot.status === 'blocked') {
      item.limitingFactors.push('Blocked inventory present');
    }
  }

  return [...grouped.values()].map((result) => ({
    ...result,
    limitingFactors: [...new Set(result.limitingFactors)].slice(0, 3),
  }));
}

export function runPromotionDecisioning(input: PromotionDecisionInput): PromotionDecisionSummary {
  const availability = calculateAvailability(input.query, input.inventorySlots);

  const placementCandidates: PlacementCandidate[] = [];
  const blockedOrderLines: Array<{ orderLineId: string; reasons: string[] }> = [];

  for (const orderLine of input.orderLines) {
    const candidateSlots = input.inventorySlots.filter((slot) => {
      if (slot.stationId !== orderLine.stationId) return false;
      if (!orderLine.daypartIds.includes(slot.daypartId)) return false;
      if (slot.airDate < input.query.startDate || slot.airDate > input.query.endDate) return false;
      return true;
    });

    const reasons: string[] = [];
    if (!hasApprovedCreative(orderLine.id, input.creativeAssets)) {
      reasons.push('No approved audio creative for order line');
    }

    const campaign = input.campaigns.find((item) => item.id === orderLine.campaignId);
    if (!campaign) {
      reasons.push('Campaign missing');
    }

    if (reasons.length > 0) {
      blockedOrderLines.push({ orderLineId: orderLine.id, reasons });
      continue;
    }

    for (const slot of candidateSlots) {
      const slotReasons: string[] = [];
      const active = isCampaignActive(campaign!, slot.airDate);
      if (!active) slotReasons.push('Campaign not active for slot date');
      if (!hasLegalStatus(slot)) slotReasons.push('Slot status is not schedulable');
      if (!hasEnoughSeconds(slot, orderLine.seconds))
        slotReasons.push('Insufficient seconds in break');

      const placementCheck = isPlacementTypeAllowed(
        orderLine.placementType,
        slot,
        input.placementRules,
      );
      if (!placementCheck.allowed) slotReasons.push('Deterministic rule denied placement');

      if (slotReasons.length > 0) continue;

      placementCandidates.push(scorePlacementCandidate(slot, orderLine, placementCheck.hits));
    }
  }

  placementCandidates.sort((a, b) => b.score - a.score);

  return {
    availability,
    placementCandidates: placementCandidates.slice(0, 8),
    blockedOrderLines,
  };
}
