'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { TrafficControlCenter } from '@/components/workspace/traffic-control-center';
import { getOdysseyModuleAccent } from '@/lib/odyssey-accents';
import { getModuleByKey, getModuleView } from '@/lib/odyssey-nav';
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, cn } from '@iliad/ui';

const trafficModule = getModuleByKey('traffic-pulse');

export function TrafficWorkspacePage() {
  const searchParams = useSearchParams();
  const accent = getOdysseyModuleAccent(trafficModule.key);
  const view = getModuleView(trafficModule, searchParams.get('view') ?? undefined);
  const activeViewId = view.id === 'setup' ? 'setup' : 'desk';

  return (
    <div className="space-y-6">
      <Card className="odyssey-panel overflow-hidden border-border/80">
        <CardHeader className="gap-4 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                'uppercase tracking-[0.16em] border border-transparent',
                accent.badgeBg,
                accent.badgeText,
              )}
            >
              {trafficModule.status}
            </Badge>
            <Badge variant="outline">Traffic Desk</Badge>
            <Badge variant="outline">{activeViewId === 'setup' ? 'Setup' : 'Operations'}</Badge>
          </div>

          <div className="space-y-3">
            <CardTitle className="max-w-3xl text-3xl tracking-tight text-foreground md:text-4xl">
              Traffic Operations
            </CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
              Live setup, coverage approval, generation, and delivery status only.
            </CardDescription>

            <div className="flex flex-wrap gap-2">
              {trafficModule.views.map((moduleView) => {
                const isActive = moduleView.id === activeViewId;

                return (
                  <Button
                    key={moduleView.id}
                    asChild
                    size="sm"
                    variant={isActive ? 'default' : 'outline'}
                    className={cn(
                      isActive ? cn(accent.badgeBg, accent.badgeText) : 'border-border/70',
                    )}
                  >
                    <Link href={`${trafficModule.href}?view=${moduleView.id}`}>
                      {moduleView.label}
                    </Link>
                  </Button>
                );
              })}
              <Button asChild size="sm" variant="outline" className="border-border/70">
                <Link href="/petey-agent-hub">Open Ops Hub</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <TrafficControlCenter activeViewId={activeViewId} />
    </div>
  );
}
