import { TrafficWorkspacePage } from '@/components/traffic/traffic-workspace-page';
import { Suspense } from 'react';

export default function TrafficPage() {
  return (
    <Suspense fallback={<div className="h-24" />}>
      <TrafficWorkspacePage />
    </Suspense>
  );
}