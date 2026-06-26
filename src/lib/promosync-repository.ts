import 'server-only';

import { getFirestoreAdmin } from '@iliad/firebase/admin';
import {
  PROMOSYNC_COLLECTIONS,
  type Campaign,
  type CreativeAsset,
  type InventorySlot,
  type OrderLine,
  type PlacementRule,
} from '@/lib/sales-traffic-model';
import type { PromoSyncBootstrapPayload } from '@/lib/promosync-bootstrap';

type PromoSyncCollectionRecord =
  | Campaign
  | CreativeAsset
  | InventorySlot
  | OrderLine
  | PlacementRule;

async function queryTenantCollection<T extends PromoSyncCollectionRecord>(
  collectionName: string,
  tenantId: string,
): Promise<T[]> {
  const firestore = getFirestoreAdmin();
  const snapshot = await firestore
    .collection(collectionName)
    .where('tenantId', '==', tenantId)
    .limit(100)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<T, 'id'>) }) as T);
}

export async function getPromoSyncBootstrapPayload(
  tenantId: string,
): Promise<PromoSyncBootstrapPayload> {
  const [inventorySlots, campaigns, orderLines, creativeAssets, placementRules] = await Promise.all(
    [
      queryTenantCollection<InventorySlot>(PROMOSYNC_COLLECTIONS.inventorySlots, tenantId),
      queryTenantCollection<Campaign>(PROMOSYNC_COLLECTIONS.campaigns, tenantId),
      queryTenantCollection<OrderLine>(PROMOSYNC_COLLECTIONS.orderLines, tenantId),
      queryTenantCollection<CreativeAsset>(PROMOSYNC_COLLECTIONS.creativeAssets, tenantId),
      queryTenantCollection<PlacementRule>(PROMOSYNC_COLLECTIONS.placementRules, tenantId),
    ],
  );

  return {
    source: 'firestore',
    tenantId,
    inventorySlots,
    campaigns,
    orderLines,
    creativeAssets,
    placementRules,
  };
}
