'use client';

import {
  getModuleEvents,
  getModuleQueueItems,
  getModuleRuntime,
} from '@/lib/odyssey-control-plane';
import { getOdysseyModuleAccent } from '@/lib/odyssey-accents';
import type { ModuleKey } from '@/lib/odyssey-nav';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from '@iliad/ui';
import { AlertTriangle, ArrowRight, DatabaseZap, Layers3, ShieldCheck } from 'lucide-react';

const readinessTone: Record<ReturnType<typeof getModuleRuntime>['readiness'], string> = {
  foundation: 'bg-muted text-muted-foreground',
  design: 'bg-secondary text-secondary-foreground',
  build: 'bg-primary/15 text-primary',
  integration: 'bg-amber-500/15 text-amber-200',
  hardening: 'bg-emerald-500/15 text-emerald-200',
};

export function ModuleDeliveryPanel({ moduleKey }: { moduleKey: ModuleKey }) {
  const runtime = getModuleRuntime(moduleKey);
  const queueItems = getModuleQueueItems(moduleKey);
  const events = getModuleEvents(moduleKey);
  const accent = getOdysseyModuleAccent(moduleKey);

  return (
    <Card className="odyssey-panel border-border/80">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className={cn('uppercase tracking-[0.16em] border border-transparent', accent.badgeBg, accent.badgeText)}
          >
            implementation posture
          </Badge>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${readinessTone[runtime.readiness]}`}
          >
            {runtime.readiness}
          </span>
          <Badge variant="outline">{runtime.currentPhase}</Badge>
        </div>
        <div>
          <CardTitle className="text-xl">Module Foundation Contract</CardTitle>
          <CardDescription>{runtime.targetOutcome}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
            <div className="flex items-center gap-2">
              <DatabaseZap className={cn('h-4 w-4', accent.badgeText)} />
              <p className="text-sm font-medium text-foreground">Schema domains</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {runtime.schemaDomains.map((domain) => (
                <Badge key={domain} variant="outline">
                  {domain}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
            <div className="flex items-center gap-2">
              <Layers3 className={cn('h-4 w-4', accent.badgeText)} />
              <p className="text-sm font-medium text-foreground">Dependencies</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {runtime.dependencies.length === 0 ? (
                <Badge variant="outline">platform root</Badge>
              ) : (
                runtime.dependencies.map((dependency) => (
                  <Badge key={dependency} variant="outline">
                    {dependency}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className={cn('h-4 w-4', accent.badgeText)} />
              <p className="text-sm font-medium text-foreground">Execution queue</p>
            </div>
            <div className="mt-3 space-y-3">
              {queueItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No module-specific queue items registered yet.
                </p>
              ) : (
                queueItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border/50 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <Badge variant="outline">{item.lane}</Badge>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      owner: {item.owner}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn('h-4 w-4', accent.badgeText)} />
              <p className="text-sm font-medium text-foreground">Blocking concerns</p>
            </div>
            <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
              {runtime.blockingConcerns.map((concern) => (
                <li key={concern} className="flex gap-2">
                  <ArrowRight className={cn('mt-0.5 h-4 w-4 shrink-0', accent.badgeText)} />
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
          <p className="text-sm font-medium text-foreground">Module event feed</p>
          <div className="mt-3 space-y-3">
            {events.map((event) => (
              <div key={event.id} className="rounded-xl border border-border/50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{event.category}</Badge>
                  <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {event.timestampLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">{event.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
