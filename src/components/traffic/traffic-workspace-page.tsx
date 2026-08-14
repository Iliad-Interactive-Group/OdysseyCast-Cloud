'use client';

import { useSearchParams } from 'next/navigation';
import { TrafficControlCenter } from '@/components/workspace/traffic-control-center';
import { getModuleByKey, getModuleView } from '@/lib/odyssey-nav';

const trafficModule = getModuleByKey('traffic-pulse');

export function TrafficWorkspacePage() {
  const searchParams = useSearchParams();
  const view = getModuleView(trafficModule, searchParams.get('view') ?? undefined);
  const activeViewId = view.id === 'setup' ? 'setup' : 'desk';

  return <TrafficControlCenter activeViewId={activeViewId} />;
}
