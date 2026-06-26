import type {
  Campaign,
  CreativeAsset,
  InventorySlot,
  OrderLine,
  PlacementRule,
} from '@/lib/sales-traffic-model';

export interface PromoSyncBootstrapPayload {
  source: 'demo' | 'firestore';
  tenantId: string;
  inventorySlots: InventorySlot[];
  campaigns: Campaign[];
  orderLines: OrderLine[];
  creativeAssets: CreativeAsset[];
  placementRules: PlacementRule[];
}

export function buildPromoSyncDemoSeed(tenantId = 'tenant-demo'): PromoSyncBootstrapPayload {
  return {
    source: 'demo',
    tenantId,
    inventorySlots: [
      {
        id: 'slot-6a',
        tenantId,
        stationId: 'station-kjot',
        airDate: '2026-03-30',
        breakId: 'break-6a',
        daypartId: 'daypart-morning-drive',
        scheduledTime: '06:20:00',
        maxSeconds: 180,
        reservedSeconds: 120,
        status: 'open',
      },
      {
        id: 'slot-6b',
        tenantId,
        stationId: 'station-kjot',
        airDate: '2026-03-30',
        breakId: 'break-6b',
        daypartId: 'daypart-morning-drive',
        scheduledTime: '06:40:00',
        maxSeconds: 180,
        reservedSeconds: 170,
        status: 'open',
      },
      {
        id: 'slot-7a',
        tenantId,
        stationId: 'station-kjot',
        airDate: '2026-03-30',
        breakId: 'break-7a',
        daypartId: 'daypart-morning-drive',
        scheduledTime: '07:15:00',
        maxSeconds: 180,
        reservedSeconds: 90,
        status: 'held',
      },
    ],
    campaigns: [
      {
        id: 'campaign-auto',
        tenantId,
        advertiserId: 'advertiser-auto',
        name: 'Auto Dealer March Push',
        objective: 'Drive weekend lot visits',
        startDate: '2026-03-25',
        endDate: '2026-04-07',
        stationIds: ['station-kjot'],
        status: 'active',
      },
    ],
    orderLines: [
      {
        id: 'orderline-30a',
        tenantId,
        campaignId: 'campaign-auto',
        stationId: 'station-kjot',
        daypartIds: ['daypart-morning-drive'],
        weeklySpots: 18,
        seconds: 30,
        placementType: 'floating',
        separationAdvertiserMinutes: 30,
        separationCategoryMinutes: 20,
      },
    ],
    creativeAssets: [
      {
        id: 'creative-30a',
        tenantId,
        campaignId: 'campaign-auto',
        orderLineId: 'orderline-30a',
        assetType: 'audio',
        name: 'Auto Dealer Sale Spot v2',
        durationSeconds: 30,
        status: 'approved',
      },
    ],
    placementRules: [
      {
        id: 'rule-open-only',
        tenantId,
        name: 'Only open or held slots are schedulable',
        priority: 1,
        enabled: true,
        deterministic: true,
        conditions: ['slot status blocked'],
        actions: ['deny placement'],
      },
      {
        id: 'rule-floating-allowed',
        tenantId,
        stationId: 'station-kjot',
        name: 'Floating placements allowed on morning drive',
        priority: 2,
        enabled: true,
        deterministic: true,
        conditions: ['floating placement'],
        actions: ['allow placement'],
      },
    ],
  };
}