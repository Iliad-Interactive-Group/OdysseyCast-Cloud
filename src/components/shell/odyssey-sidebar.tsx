import Link from 'next/link';
import { Badge, cn } from '@iliad/ui';
import { getOdysseyModuleAccent } from '@/lib/odyssey-accents';
import { ODYSSEY_MODULES, isOdysseyRouteActive } from '@/lib/odyssey-nav';

export function OdysseySidebar({
  pathname,
  collapsed = false,
  onNavigate,
}: {
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-5">
      {!collapsed ? (
        <div className="space-y-1 px-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Modules
          </p>
          <h2 className="text-lg font-semibold text-foreground">Broadcast Workspace</h2>
        </div>
      ) : null}

      <div className="space-y-2">
        {ODYSSEY_MODULES.map((item) => {
          const active = isOdysseyRouteActive(pathname, item.href);
          const accent = getOdysseyModuleAccent(item.key);
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'block rounded-xl border transition-colors',
                collapsed ? 'p-2.5' : 'p-3',
                active
                  ? accent.activeItemClass
                  : 'border-border bg-card/70 hover:border-border/90 hover:bg-muted/65',
              )}
              title={collapsed ? item.label : undefined}
            >
              <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
                <Icon
                  className={cn(
                    'h-4 w-4',
                    active ? accent.activeIconClass : 'text-muted-foreground',
                  )}
                />
                {!collapsed ? (
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                ) : null}
                {!collapsed && item.badge ? (
                  <Badge variant="outline" className="ml-auto text-[10px] uppercase tracking-wide">
                    {item.badge}
                  </Badge>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
