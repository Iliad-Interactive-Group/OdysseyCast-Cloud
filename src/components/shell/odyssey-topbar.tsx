'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Badge, Button, cn } from '@iliad/ui';
import { getOdysseyModuleAccent } from '@/lib/odyssey-accents';
import { getActiveOdysseyModule, getModuleView } from '@/lib/odyssey-nav';

export function OdysseyTopbar({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const activeModule = getActiveOdysseyModule(pathname);
  const accent = getOdysseyModuleAccent(activeModule.key);
  const activeView = getModuleView(activeModule, searchParams.get('view') ?? undefined);

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{activeModule.label}</p>
          <Badge
            variant="secondary"
            className={cn('uppercase tracking-[0.16em] border border-transparent', accent.badgeBg, accent.badgeText)}
          >
            {activeModule.status}
          </Badge>
          <Badge variant="outline">{activeModule.audience}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{activeModule.objective}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {activeModule.views.map((view) => {
          const isActive = activeView.id === view.id;

          return (
            <Button
              key={view.id}
              asChild
              variant="outline"
              size="sm"
              className={cn(
                'justify-start border-border/70',
                isActive ? cn('border-transparent', accent.badgeBg, accent.badgeText) : '',
              )}
            >
              <Link href={`${activeModule.href}?view=${view.id}`}>{view.label}</Link>
            </Button>
          );
        })}

        <Button asChild variant="outline" size="sm" className="border-border/70">
          <Link href="/petey-agent-hub">Ops Hub</Link>
        </Button>
      </div>
    </div>
  );
}