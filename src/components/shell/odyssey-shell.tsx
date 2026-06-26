'use client';

import { Button, cn } from '@iliad/ui';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { getOdysseyModuleAccent } from '@/lib/odyssey-accents';
import { getActiveOdysseyModule } from '@/lib/odyssey-nav';
import { OdysseyPeteyRail } from './odyssey-petey-rail';
import { OdysseySidebar } from './odyssey-sidebar';
import { OdysseySuiteHeader } from './odyssey-suite-header';
import { OdysseyTopbar } from './odyssey-topbar';

export function OdysseyShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeModule = getActiveOdysseyModule(pathname);
  const accent = getOdysseyModuleAccent(activeModule.key);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
      <OdysseySuiteHeader onOpenSidebar={() => setMobileSidebarOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={cn(
            'fixed inset-y-14 left-0 z-40 border-r border-border bg-card/95 backdrop-blur-xl transition-transform duration-300 xl:static xl:inset-auto xl:flex xl:flex-col xl:translate-x-0',
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0',
            sidebarCollapsed ? 'w-[72px]' : 'w-[340px]',
          )}
        >
          <button
            onClick={() => setSidebarCollapsed((value) => !value)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden xl:flex items-center gap-2 h-[42px] px-3 border-b transition-colors shrink-0',
              sidebarCollapsed ? 'justify-center' : 'justify-end',
            )}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div className="xl:hidden flex items-center justify-between h-[42px] px-3 border-b shrink-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Modules
            </p>
            <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 md:p-4 custom-scrollbar">
            <OdysseySidebar
              pathname={pathname}
              collapsed={sidebarCollapsed}
              onNavigate={() => setMobileSidebarOpen(false)}
            />
          </div>

          <button
            onClick={() => setSidebarCollapsed((value) => !value)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden xl:flex items-center h-[42px] px-3 border-t transition-colors shrink-0',
              sidebarCollapsed ? 'justify-center' : 'justify-end',
            )}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </aside>

        {mobileSidebarOpen ? (
          <div
            className="fixed inset-0 z-30 bg-black/45 xl:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        ) : null}

        <div
          className={cn(
            'relative flex min-w-0 flex-1 flex-col overflow-hidden border-t-2',
            accent.borderClass,
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-500"
            style={{
              background: `radial-gradient(ellipse at top left, rgba(${accent.rgb}, var(--odyssey-glow-alpha)) 0%, transparent 60%)`,
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 shrink-0 border-b border-border/70 bg-background/70 px-4 py-3 backdrop-blur md:px-6">
            <Suspense fallback={<div className="h-12" />}>
              <OdysseyTopbar pathname={pathname} />
            </Suspense>
          </div>

          <div className="relative z-10 flex-1 overflow-auto p-4 md:p-6">{children}</div>
        </div>

        <aside
          className={cn(
            'hidden xl:flex flex-col border-l shrink-0 overflow-hidden transition-all duration-300 bg-card/75 backdrop-blur-xl',
            rightPanelCollapsed ? 'w-[56px]' : 'w-[420px]',
          )}
        >
          <button
            onClick={() => setRightPanelCollapsed((value) => !value)}
            aria-label={rightPanelCollapsed ? 'Open Petey sidebar' : 'Close Petey sidebar'}
            className={cn(
              'flex items-center h-[42px] px-3 border-b transition-colors shrink-0',
              rightPanelCollapsed ? 'justify-center' : 'justify-between',
            )}
          >
            {rightPanelCollapsed ? (
              <MessageSquare className="h-4 w-4 text-fuchsia-400" />
            ) : (
              <>
                <span className="text-sm font-medium text-foreground">Petey Sidebar</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </>
            )}
          </button>

          <OdysseyPeteyRail pathname={pathname} collapsed={rightPanelCollapsed} />
        </aside>
      </div>
    </div>
  );
}
