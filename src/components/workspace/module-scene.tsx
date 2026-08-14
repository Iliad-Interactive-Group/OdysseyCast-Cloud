'use client';

import { PeteyControlCenter } from '@/components/workspace/petey-control-center';
import { PromoSyncSchemaPanel } from '@/components/workspace/promosync-schema-panel';
import { getModuleByKey, type ModuleKey } from '@/lib/odyssey-nav';

export function ModuleScene({ moduleKey }: { moduleKey: ModuleKey }) {
  const activeModule = getModuleByKey(moduleKey);
  const isPetey = activeModule.key === 'petey-agent-hub';
  const isPromoSync = activeModule.key === 'promosync-traffic-scheduling';

  return (
    <>
      {isPromoSync ? <PromoSyncSchemaPanel /> : null}
      {isPetey ? <PeteyControlCenter /> : null}
    </>
  );
}
